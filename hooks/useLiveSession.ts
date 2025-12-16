import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

export interface UseLiveSessionResult {
  isConnected: boolean;
  isError: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reset: () => Promise<void>;
  status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'buffering';
}

export const useLiveSession = (): UseLiveSessionResult => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking' | 'buffering'>('disconnected');
  const [isError, setIsError] = useState(false);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // API Session Ref
  const sessionRef = useRef<any>(null); // Keeping generic to avoid complex TS mapping for the internal session object

  const disconnect = useCallback(() => {
    // 1. Close session
    if (sessionRef.current) {
      sessionRef.current = null;
    }

    // 2. Stop Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 3. Stop Audio Processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // 4. Close Audio Contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // 5. Clear active playback
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setStatus('disconnected');
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      console.error("No API Key found");
      setIsError(true);
      return;
    }

    try {
      setStatus('connecting');
      setIsError(false);

      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      // Ensure contexts are running (vital for some browsers)
      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setStatus('connected');

            // Start processing microphone input
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            
            // Reduced buffer size for lower latency (2048 is ~128ms at 16kHz)
            const processor = inputAudioContextRef.current.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createPcmBlob(inputData);
               
               sessionPromise.then(session => {
                  if (sessionRef.current) { // Only send if session is still active
                    session.sendRealtimeInput({ media: pcmBlob });
                  }
               });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Interruption
             const interrupted = message.serverContent?.interrupted;
             if (interrupted) {
                console.log("Interrupted");
                activeSourcesRef.current.forEach(src => {
                   try { src.stop(); } catch(e) {}
                });
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('connected'); // Revert to listening/connected state
                return;
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                // If we aren't currently playing audio, we are in a buffering/loading state
                if (activeSourcesRef.current.size === 0) {
                    setStatus('buffering');
                }
                
                // Sync timing
                nextStartTimeRef.current = Math.max(
                   nextStartTimeRef.current,
                   outputAudioContextRef.current.currentTime
                );

                const audioBuffer = await decodeAudioData(
                   base64ToUint8Array(base64Audio),
                   outputAudioContextRef.current,
                   24000,
                   1
                );

                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                
                source.addEventListener('ended', () => {
                   activeSourcesRef.current.delete(source);
                   // Check if we are truly done speaking (no other sources playing)
                   if (activeSourcesRef.current.size === 0) {
                      setStatus('connected'); // Back to listening
                   }
                });

                // Status becomes 'speaking' as soon as we schedule the audio
                setStatus('speaking');
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                activeSourcesRef.current.add(source);
             }
          },
          onclose: () => {
             console.log("Session closed");
             disconnect();
          },
          onerror: (err) => {
             console.error("Session error", err);
             setIsError(true);
             disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are NutriVoice, an empathetic, energetic, and highly knowledgeable diet and nutrition coach. Keep your answers concise, encouraging, and focused on healthy, sustainable habits. You are talking to a user via voice, so avoid long lists or complex formatting. Use natural, conversational language.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      
      // Store session for cleanup
      sessionPromise.then(sess => {
        sessionRef.current = sess;
      }).catch(e => {
        console.error("Connection failed", e);
        setIsError(true);
        disconnect();
      });

    } catch (e) {
      console.error("Initialization failed", e);
      setIsError(true);
      disconnect();
    }
  }, [disconnect]);

  const reset = useCallback(async () => {
    disconnect();
    await connect();
  }, [disconnect, connect]);

  useEffect(() => {
    // Cleanup on unmount
    return () => disconnect();
  }, [disconnect]);

  return {
    isConnected: status === 'connected' || status === 'speaking' || status === 'buffering',
    isError,
    connect,
    disconnect,
    reset,
    status
  };
};