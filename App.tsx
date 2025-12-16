import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { VoiceOrb } from './components/VoiceOrb';
import { StatsCard } from './components/StatsCard';
import { DailyPlan, Meal } from './components/DailyPlan';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { Apple, Activity, Flame, ChevronRight, Clock, Star, Leaf, Filter, Volume2, Loader2, Sparkles, User, Zap, Mic, Calendar, MessageCircle, Scale } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { base64ToUint8Array, decodeAudioData } from './utils/audioUtils';
import { useLiveSession } from './hooks/useLiveSession';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'recipes'>('dashboard');
  const [speakingRecipe, setSpeakingRecipe] = useState<string | null>(null);
  
  // Voice Session State (Lifted)
  const session = useLiveSession();
  
  // Auth & Profile State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Alex');
  const [userWeight, setUserWeight] = useState('72.5');
  const [userHeight, setUserHeight] = useState('178');
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [visitorHistory, setVisitorHistory] = useState([
    { action: "Account Created", date: "Jan 15, 2024", icon: <User size={16} /> },
  ]);

  const handleLogin = () => {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      // Add a login event to history
      const now = new Date();
      setVisitorHistory(prev => [{
          action: "Logged In",
          date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          icon: <Calendar size={16} />
      }, ...prev]);
  };

  const handleSignUp = (name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    
    // Reset history for new user and add creation event
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    setVisitorHistory([
      { 
        action: "Account Created", 
        date: timestamp, 
        icon: <User size={16} /> 
      },
      {
        action: "Logged In",
        date: timestamp,
        icon: <Calendar size={16} />
      }
    ]);
  };
  
  const handleUpdateStats = (weight: string, height: string) => {
      setUserWeight(weight);
      setUserHeight(height);
      const now = new Date();
      setVisitorHistory(prev => [{
          action: "Updated Body Metrics",
          date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          icon: <Scale size={16} />
      }, ...prev]);
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setShowProfileModal(false);
  };

  // Recipe State
  const [recipes, setRecipes] = useState<any[]>([
    { title: "Quinoa Power Bowl", cal: "450", time: "20 min", tag: "Vegan", color: "from-green-400 to-emerald-500", icon: Leaf, reviews: 128 },
    { title: "Zesty Lemon Chicken", cal: "380", time: "35 min", tag: "High Protein", color: "from-amber-400 to-orange-500", icon: Flame, reviews: 84 },
    { title: "Berry Blast Smoothie", cal: "220", time: "5 min", tag: "Breakfast", color: "from-fuchsia-400 to-pink-500", icon: Apple, reviews: 256 },
    { title: "Spicy Tuna Wrap", cal: "320", time: "15 min", tag: "Lunch", color: "from-blue-400 to-indigo-500", icon: Activity, reviews: 42 },
  ]);
  const [isRecipeListening, setIsRecipeListening] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);

  // Lifted state for data persistence
  const [meals, setMeals] = useState<Meal[]>([
    { time: '08:00 AM', name: 'Avocado Toast & Poached Egg', cals: '450 kcal', type: 'Breakfast' },
    { time: '11:00 AM', name: 'Greek Yogurt & Berries', cals: '150 kcal', type: 'Snack' },
    { time: '01:30 PM', name: 'Grilled Salmon Salad', cals: '650 kcal', type: 'Lunch' },
    { time: '04:00 PM', name: 'Almonds & Apple Slices', cals: '200 kcal', type: 'Snack' },
    { time: '07:30 PM', name: 'Lemon Herb Chicken Breast', cals: '400 kcal', type: 'Dinner' },
  ]);

  const TARGET_CALORIES = 2000;

  const handleAddMeal = (newMeal: Meal) => {
    setMeals(prev => [...prev, newMeal]);
  };

  // Helper to map string to icon component
  const getIconComponent = (iconName: string) => {
    switch(iconName) {
        case 'Leaf': return Leaf;
        case 'Flame': return Flame;
        case 'Apple': return Apple;
        case 'Activity': return Activity;
        default: return Flame;
    }
  };

  const handleRecipeVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser. Please use Chrome or Safari.");
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecipeListening(true);
    
    recognition.onend = () => setIsRecipeListening(false);
    
    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecipeListening(false);
        setIsGeneratingRecipe(true);
        
        try {
            if (!process.env.API_KEY) throw new Error("No API Key");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `Create a unique, healthy recipe based on this request: "${transcript}".
            Return a JSON object with these fields:
            - title: string (catchy name)
            - cal: string (just number)
            - time: string (e.g. "20 min")
            - tag: string (short category like Vegan, High Protein, Breakfast, Snack)
            - color: string (choose exactly one: "from-green-400 to-emerald-500", "from-amber-400 to-orange-500", "from-fuchsia-400 to-pink-500", "from-blue-400 to-indigo-500")
            - icon: string (choose exactly one: "Leaf", "Flame", "Apple", "Activity")
            - reviews: number (random between 50 and 500)
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json" 
                }
            });
            
            const text = response.text;
            if (text) {
                const newRecipeData = JSON.parse(text);
                const newRecipe = {
                    ...newRecipeData,
                    cal: newRecipeData.cal.toString(),
                    icon: getIconComponent(newRecipeData.icon)
                };
                setRecipes(prev => [newRecipe, ...prev]);
                
                // Add to history
                setVisitorHistory(prev => [{
                    action: `Generated Recipe: ${newRecipeData.title}`,
                    date: "Just now",
                    icon: <Zap size={16} />
                }, ...prev]);
            }
        } catch (e) {
            console.error("Recipe generation failed", e);
            alert("Sorry, I couldn't find a recipe for that. Please try again.");
        } finally {
            setIsGeneratingRecipe(false);
        }
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecipeListening(false);
    };

    recognition.start();
  };

  // TTS Handler
  const handleSpeakRecipe = async (e: React.MouseEvent, recipeTitle: string, details: string) => {
    e.stopPropagation(); // Prevent card click
    if (speakingRecipe) return; // Prevent multiple clicks
    
    setSpeakingRecipe(recipeTitle);

    try {
      if (!process.env.API_KEY) throw new Error("No API Key");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Here is a delicious option: ${recipeTitle}. It is ${details}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(
          base64ToUint8Array(base64Audio), 
          ctx, 
          24000, 
          1
        );
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setSpeakingRecipe(null);
          ctx.close();
        };
        source.start();
      } else {
        setSpeakingRecipe(null);
      }

    } catch (error) {
      console.error("TTS Error:", error);
      setSpeakingRecipe(null);
    }
  };

  // Derived state for stats
  const { caloriesConsumed, proteinConsumed } = useMemo(() => {
    const cals = meals.reduce((acc, curr) => acc + (parseInt(curr.cals.replace(/[^0-9]/g, '')) || 0), 0);
    // Dummy protein calculation for demo purposes (approx 20% of cals / 4)
    const protein = Math.round((cals * 0.2) / 4); 
    return { caloriesConsumed: cals, proteinConsumed: protein };
  }, [meals]);

  const caloriesLeft = Math.max(0, TARGET_CALORIES - caloriesConsumed);

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Left Column: Stats & Meal Plan */}
      <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1">
        
        {/* Mascots Banner */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-violet-900/10 flex items-center justify-between min-h-[160px]">
            <div className="relative z-10 max-w-[60%]">
                <div className="flex items-center gap-2 mb-2">
                   <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">Team Spirit</span>
                </div>
                <h3 className="font-bold text-2xl mb-2 leading-tight">Keep it up, {userName}!</h3>
                <p className="text-violet-100 text-sm font-medium leading-relaxed">
                   Nutri Girl & Nutri Boy are tracking your progress. You're crushing your calorie goals today!
                </p>
            </div>
            
            <div className="flex items-end gap-[-10px] absolute right-6 -bottom-6 select-none pointer-events-none">
                 {/* Nutri Boy */}
                 <div className="relative z-0 transform translate-x-4 rotate-[-5deg]">
                    <div className="w-24 h-32 rounded-2xl border-4 border-white/20 shadow-lg overflow-hidden bg-blue-500">
                        <img 
                            src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=300&h=400" 
                            alt="Nutri Boy" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                 </div>
                 {/* Nutri Girl */}
                 <div className="relative z-10 transform -translate-x-2 rotate-[5deg] -translate-y-2">
                    <div className="w-24 h-32 rounded-2xl border-4 border-white/20 shadow-lg overflow-hidden bg-pink-500">
                        <img 
                            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=300&h=400" 
                            alt="Nutri Girl" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                 </div>
            </div>
            
             {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/30 rounded-full -ml-20 -mb-20 blur-2xl pointer-events-none"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard 
            title="Calories Left" 
            value={`${caloriesLeft}`} 
            subtext={`of ${TARGET_CALORIES.toLocaleString()} kcal goal`} 
            colorClass="text-violet-600"
          />
          <StatsCard 
            title="Protein" 
            value={`${proteinConsumed}g`} 
            subtext="Target: 140g" 
            colorClass="text-fuchsia-500"
          />
          <StatsCard 
            title="Water Intake" 
            value="1.2L" 
            subtext="Goal: 2.5L" 
            colorClass="text-blue-500"
          />
        </div>

        {/* Meal Plan List */}
        <DailyPlan 
          meals={meals} 
          onAddMeal={handleAddMeal} 
          targetCalories={TARGET_CALORIES} 
        />
      </div>

      {/* Right Column: Voice Agent - Sticky on Desktop */}
      <div className="lg:col-span-5 order-1 lg:order-2" id="voice-orb-container">
        <div className="lg:sticky lg:top-24 flex flex-col gap-6">
          <VoiceOrb session={session} />
          
          {/* Suggested Prompts */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-violet-900/5 border border-white">
            <h3 className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /> Try asking NutriVoice</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-900 transition-all duration-200 text-sm font-bold flex items-center gap-3 border border-transparent hover:border-violet-200 group">
                <div className="bg-white p-2 rounded-xl shadow-sm text-violet-500 group-hover:scale-110 transition-transform"><Apple size={18} /></div>
                "Is avocado toast good for breakfast?"
              </button>
              <button className="w-full text-left p-4 rounded-2xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-900 transition-all duration-200 text-sm font-bold flex items-center gap-3 border border-transparent hover:border-fuchsia-200 group">
                <div className="bg-white p-2 rounded-xl shadow-sm text-fuchsia-500 group-hover:scale-110 transition-transform"><Flame size={18} /></div>
                "How many calories in a greek yogurt?"
              </button>
              <button className="w-full text-left p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 transition-all duration-200 text-sm font-bold flex items-center gap-3 border border-transparent hover:border-blue-200 group">
                 <div className="bg-white p-2 rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform"><Activity size={18} /></div>
                "Suggest a high protein snack."
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMealPlans = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold text-neutral-800">Weekly Meal Plans</h2>
           <p className="text-neutral-500 mt-1">Curated schedules to meet your specific goals.</p>
        </div>
        <button className="text-violet-600 font-bold hover:text-violet-700 text-sm flex items-center gap-1 group bg-violet-50 px-4 py-2 rounded-full">
          View All Plans 
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Plan 1 */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-xl shadow-violet-900/5 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 group relative overflow-hidden cursor-pointer h-full flex flex-col">
             <div className="absolute top-0 right-0 w-40 h-40 bg-violet-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
             <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors shadow-sm">
                    <Activity size={32} strokeWidth={2.5} />
                </div>
                <div className="mb-3">
                    <span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-100">Weight Loss</span>
                </div>
                <h3 className="font-bold text-2xl text-neutral-800 mb-3 group-hover:text-violet-700 transition-colors">Metabolic Reset</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-8 flex-grow font-medium">
                    Boost your metabolism with nutrient-dense foods and timed eating windows designed to burn fat efficiently.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold text-neutral-600 border-t border-neutral-100 pt-6">
                    <span className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100"><Flame size={16} className="text-orange-500"/> 1,500 kcal</span>
                    <span className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100"><Clock size={16} className="text-blue-500"/> 7 Days</span>
                </div>
             </div>
         </div>

         {/* Plan 2 - Featured */}
         <div className="bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl shadow-violet-900/30 hover:shadow-3xl hover:shadow-violet-900/50 transition-all duration-300 group relative overflow-hidden cursor-pointer h-full flex flex-col border border-neutral-800">
             <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-neutral-900 to-neutral-900"></div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-fuchsia-500/30 transition-all duration-500"></div>
             
             <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-2 border border-white/10 shadow-inner">
                        <Zap size={32} strokeWidth={2.5} className="fill-white/20"/>
                    </div>
                    <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-violet-500/30 flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Popular
                    </span>
                </div>
                
                <h3 className="font-bold text-2xl text-white mb-3 tracking-tight">High Protein Power</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-grow font-medium">
                    Designed for muscle recovery and sustained energy throughout the day. Perfect for active lifestyles.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold text-neutral-300 border-t border-white/10 pt-6">
                    <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10"><Flame size={16} className="text-fuchsia-400"/> 2,200 kcal</span>
                    <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10"><Clock size={16} className="text-fuchsia-400"/> 5 Days</span>
                </div>
                
                <button className="mt-6 w-full py-4 bg-white text-neutral-900 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors flex items-center justify-center gap-2">
                  Start Plan <ChevronRight size={16} />
                </button>
             </div>
         </div>

         {/* Plan 3 */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-xl shadow-violet-900/5 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 group relative overflow-hidden cursor-pointer h-full flex flex-col">
             <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
             <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <Leaf size={32} strokeWidth={2.5} />
                </div>
                <div className="mb-3">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">Wellness</span>
                </div>
                <h3 className="font-bold text-2xl text-neutral-800 mb-3 group-hover:text-blue-700 transition-colors">Mediterranean Balance</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-8 flex-grow font-medium">
                    Heart-healthy fats, whole grains, and fresh produce for longevity and mental clarity.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold text-neutral-600 border-t border-neutral-100 pt-6">
                    <span className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100"><Flame size={16} className="text-orange-500"/> 1,800 kcal</span>
                    <span className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100"><Clock size={16} className="text-blue-500"/> 14 Days</span>
                </div>
             </div>
         </div>
      </div>
    </div>
  );

  const renderRecipes = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
       <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold text-neutral-800">Trending Recipes</h2>
           <p className="text-neutral-500 mt-1">Delicious meals tailored to your taste and nutritional needs.</p>
        </div>
        <div className="flex gap-3">
            {/* Voice Search Button */}
            <button 
                onClick={handleRecipeVoiceSearch}
                disabled={isRecipeListening || isGeneratingRecipe}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all
                  ${isRecipeListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : isGeneratingRecipe 
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
                   }`}
            >
              {isGeneratingRecipe ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />} 
              {isRecipeListening ? "Listening..." : isGeneratingRecipe ? "Creating..." : "Ask AI"}
            </button>
            <button className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-50 hover:border-neutral-300 transition-all flex items-center gap-2 shadow-sm">
              <Filter size={16} /> Filters
            </button>
            <button className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2">
              Explore All <ChevronRight size={16} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recipes.map((recipe, i) => {
           // Fix: Assign capitalized variable for JSX component
           const Icon = recipe.icon;
           
           return (
           <div key={i} className="bg-white rounded-[2rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col">
              {/* Image Placeholder area */}
              <div className={`h-48 bg-gradient-to-br ${recipe.color} relative p-6 flex flex-col justify-between overflow-hidden`}>
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div className="flex justify-between items-start z-10">
                     <span className="bg-white/25 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 uppercase tracking-wide shadow-sm">{recipe.tag}</span>
                     
                     {/* TTS Button */}
                     <button 
                        onClick={(e) => handleSpeakRecipe(e, recipe.title, `${recipe.cal} calories. Preparation time ${recipe.time}.`)}
                        className={`backdrop-blur-md p-2 rounded-full text-white transition-all shadow-sm ${speakingRecipe === recipe.title ? 'bg-violet-600 animate-pulse' : 'bg-white/20 hover:bg-white hover:text-violet-600 hover:scale-110 active:scale-95'}`}
                        disabled={speakingRecipe !== null && speakingRecipe !== recipe.title}
                     >
                        {speakingRecipe === recipe.title ? <Loader2 size={16} className="animate-spin"/> : <Volume2 size={16} />}
                     </button>
                 </div>
                 <div className="absolute -bottom-8 -right-8 text-white/20 rotate-12 transform scale-150 transition-transform duration-500 group-hover:scale-[1.65] group-hover:rotate-6">
                    <Icon size={140} />
                 </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-1">
                   <h3 className="font-bold text-lg text-neutral-800 group-hover:text-violet-600 transition-colors line-clamp-1 leading-tight">{recipe.title}</h3>
                </div>
                
                <div className="flex items-center gap-1 mb-6">
                    <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                            <Star key={star} size={12} className="text-amber-400 fill-amber-400" />
                        ))}
                    </div>
                    <span className="text-xs text-neutral-400 ml-2 font-bold">({recipe.reviews})</span>
                </div>
                
                <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                   <div className="flex items-center gap-2">
                      <div className="bg-orange-50 p-1.5 rounded-full text-orange-500">
                          <Flame size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider leading-none mb-0.5">Cals</span>
                        <span className="text-xs font-bold text-neutral-700">{recipe.cal}</span>
                      </div>
                   </div>
                   
                   <div className="w-px h-8 bg-neutral-100"></div>
                   
                   <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-full text-blue-500">
                          <Clock size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider leading-none mb-0.5">Time</span>
                        <span className="text-xs font-bold text-neutral-700">{recipe.time}</span>
                      </div>
                   </div>
                </div>
              </div>
           </div>
           );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-violet-100 selection:text-violet-900">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />
      
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        onLogout={handleLogout}
        history={visitorHistory}
        userName={userName}
        weight={userWeight}
        height={userHeight}
        onUpdateStats={handleUpdateStats}
        caloriesConsumed={caloriesConsumed}
        caloriesLeft={caloriesLeft}
        targetCalories={TARGET_CALORIES}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Intro Section - Only show on Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-between animate-in slide-in-from-left-2 duration-500 gap-6">
             <div className="text-center sm:text-left">
               <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight sm:text-5xl mb-2">
                 Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">{userName}</span>
               </h1>
               <p className="text-lg text-neutral-500 font-medium max-w-lg">
                 Your personal Nutri-Team is ready to help you crush your goals today.
               </p>
             </div>
             
             {/* Enhanced Nutri Coaches Section */}
             <div 
                onClick={() => {
                    if (!session.isConnected) {
                        session.connect();
                    }
                    const orb = document.getElementById('voice-orb-container');
                    if (orb) orb.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative cursor-pointer active:scale-95 transition-transform duration-200"
             >
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative flex items-center gap-5 bg-white p-2.5 pr-8 rounded-full shadow-xl shadow-violet-900/5 border border-white/80 backdrop-blur-sm">
                    <div className="flex -space-x-4">
                        <img 
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120" 
                            alt="Coach Sarah" 
                            className="w-14 h-14 rounded-full border-[3px] border-white object-cover ring-2 ring-violet-50 transition-transform group-hover:-translate-x-1"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120" 
                            alt="Coach Mike" 
                            className="w-14 h-14 rounded-full border-[3px] border-white object-cover ring-2 ring-violet-50 transition-transform z-10"
                        />
                         <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120" 
                            alt="Coach Emma" 
                            className="w-14 h-14 rounded-full border-[3px] border-white object-cover ring-2 ring-violet-50 transition-transform group-hover:translate-x-1 z-20"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-neutral-800 leading-none mb-1.5 flex items-center gap-2">
                           Expert Coaches
                           <span className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">AI</span>
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Active Now
                        </span>
                    </div>
                    <div className="ml-2 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <MessageCircle size={16} fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute" />
                        <ChevronRight size={16} className="group-hover:opacity-0 transition-opacity duration-300 absolute" />
                    </div>
                </div>
             </div>
          </div>
        )}

        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'plans' && renderMealPlans()}
          {activeTab === 'recipes' && renderRecipes()}
        </div>
      </main>
    </div>
  );
};

export default App;