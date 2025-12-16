import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { UseLiveSessionResult } from '../hooks/useLiveSession';

interface VoiceOrbProps {
  session: UseLiveSessionResult;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ session }) => {
  const { isConnected, isError, connect, disconnect, reset, status } = session;
  const prevStatusRef = useRef(status);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip speech on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!('speechSynthesis' in window)) return;

    const speak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.volume = 0.6; // Slightly lower volume to blend better
      window.speechSynthesis.speak(utterance);
    };

    // Handle Error State
    if (isError) {
      speak('Connection error encountered.');
      return;
    }

    // Handle Status Changes
    if (status !== prevStatusRef.current) {
      switch (status) {
        case 'connecting':
          speak('Connecting...');
          break;
        case 'connected':
          // Only announce if coming from connecting or buffering
          if (prevStatusRef.current === 'connecting' || prevStatusRef.current === 'buffering') {
            speak('Audio ready. Listening.');
          }
          break;
        case 'buffering':
          speak('Buffering response...');
          break;
        case 'speaking':
           speak('Speaking');
          break;
        case 'disconnected':
           speak('Session disconnected.');
          break;
      }
      prevStatusRef.current = status;
    }
  }, [status, isError]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-2xl shadow-violet-900/10 border border-white p-8 overflow-hidden group">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white opacity-80 z-0"></div>
      
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-200 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-200 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>

      <div className="z-10 flex flex-col items-center gap-8 w-full">
        {/* Status Indicator Text */}
        <div className="h-8 flex items-center justify-center">
            {status === 'disconnected' && <span className="text-neutral-400 font-bold tracking-wide text-xs uppercase flex items-center gap-2"><Sparkles size={12}/> Tap to speak</span>}
            {status === 'connecting' && <span className="text-violet-500 font-semibold animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Connecting...</span>}
            {status === 'connected' && <span className="text-violet-600 font-bold">Listening...</span>}
            {status === 'buffering' && <span className="text-violet-500 font-semibold animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Buffering...</span>}
            {status === 'speaking' && <span className="text-fuchsia-500 font-bold">Speaking...</span>}
            {isError && <span className="text-red-500 font-medium flex items-center gap-1"><AlertCircle size={16}/> Connection Error</span>}
        </div>

        {/* The Orb */}
        <div className="relative flex items-center justify-center scale-110">
           {/* Visualizer Circle */}
           <div 
             className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
               status === 'disconnected' ? 'bg-neutral-100 shadow-inner' : 
               status === 'connected' ? 'blob bg-gradient-to-tr from-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-500/40' : 
               status === 'buffering' ? 'scale-105 bg-violet-300 text-white shadow-lg shadow-violet-500/20 animate-pulse' :
               status === 'speaking' ? 'blob speaking bg-gradient-to-tr from-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/40' : 'bg-neutral-200'
             }`}
           >
             {status === 'speaking' ? (
                <div className="flex gap-1.5 h-10 items-center">
                    <div className="w-2 h-full bg-white/90 rounded-full animate-[bounce_1s_infinite]"></div>
                    <div className="w-2 h-2/3 bg-white/90 rounded-full animate-[bounce_1s_infinite_0.1s]"></div>
                    <div className="w-2 h-full bg-white/90 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                </div>
             ) : status === 'buffering' ? (
                <Loader2 size={48} className="animate-spin text-white drop-shadow-md" />
             ) : (
                <Mic size={48} className={`transition-opacity duration-300 ${status === 'disconnected' ? 'text-neutral-400' : 'text-white drop-shadow-md'}`} />
             )}
           </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-4 w-full px-4">
           {!isConnected ? (
             <button 
                onClick={() => connect()}
                disabled={status === 'connecting'}
                className="w-full bg-neutral-900 hover:bg-violet-900 text-white py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neutral-900/20 flex items-center justify-center gap-2"
             >
                {status === 'connecting' ? 'Connecting...' : <><Mic size={18} /> Start Session</>}
             </button>
           ) : (
             <>
               <button 
                  onClick={() => reset()}
                  className="bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 p-4 rounded-2xl transition-all hover:shadow-md active:scale-95 flex items-center justify-center shadow-sm"
                  title="Clear Conversation & Reset Memory"
               >
                  <RotateCcw size={20} />
               </button>
               <button 
                  onClick={() => disconnect()}
                  className="flex-1 bg-white hover:bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl font-bold transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 shadow-sm"
               >
                  <MicOff size={18} />
                  End Session
               </button>
             </>
           )}
        </div>
        
        <p className="text-[10px] uppercase tracking-widest text-neutral-300 text-center font-bold">
           Powered by Gemini 2.5
        </p>
      </div>
    </div>
  );
};