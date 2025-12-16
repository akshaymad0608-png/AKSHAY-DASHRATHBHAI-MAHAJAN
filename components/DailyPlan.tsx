import React, { useState } from 'react';
import { Plus, X, Utensils, CheckCircle2 } from 'lucide-react';

export interface Meal {
  time: string;
  name: string;
  cals: string;
  type: string;
}

interface DailyPlanProps {
  meals: Meal[];
  onAddMeal: (meal: Meal) => void;
  targetCalories: number;
}

export const DailyPlan: React.FC<DailyPlanProps> = ({ meals, onAddMeal, targetCalories }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', cals: '', type: 'Snack' });

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeal.name || !newMeal.cals) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    onAddMeal({ 
      time: currentTime, 
      name: newMeal.name, 
      cals: `${newMeal.cals} kcal`, 
      type: newMeal.type 
    });
    
    setNewMeal({ name: '', cals: '', type: 'Snack' });
    setIsAdding(false);
  };

  const totalCalories = meals.reduce((acc, curr) => {
    const val = parseInt(curr.cals.replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-violet-900/5 border border-violet-100/50 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
           <h2 className="text-xl font-bold text-neutral-800">Today's Meal Plan</h2>
           <p className="text-xs text-violet-600 font-bold mt-1 bg-violet-50 inline-block px-2.5 py-1 rounded-lg">Total: {totalCalories} kcal</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block bg-neutral-50 text-neutral-600 px-3 py-1.5 rounded-full text-xs font-bold border border-neutral-200">
                Target: {targetCalories.toLocaleString()}
            </span>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${isAdding ? 'bg-neutral-100 text-neutral-500 rotate-90' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/30'}`}
                aria-label="Add meal"
            >
                {isAdding ? <X size={20}/> : <Plus size={20}/>}
            </button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 bg-violet-50/50 border-b border-violet-100 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleAddMeal} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                        type="text" 
                        placeholder="Meal Name (e.g. Banana)" 
                        className="w-full px-4 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white font-medium"
                        value={newMeal.name}
                        onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="Cals" 
                            className="w-1/2 px-4 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white font-medium"
                            value={newMeal.cals}
                            onChange={e => setNewMeal({...newMeal, cals: e.target.value})}
                        />
                        <select 
                            className="w-1/2 px-4 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white text-sm text-neutral-600 font-medium"
                            value={newMeal.type}
                            onChange={e => setNewMeal({...newMeal, type: e.target.value})}
                        >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                        </select>
                    </div>
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.99] text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                    <Utensils size={16} />
                    Log Meal
                </button>
            </form>
        </div>
      )}

      <div className="divide-y divide-neutral-100 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
        {meals.length === 0 ? (
            <div className="p-10 text-center text-neutral-400 text-sm flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-2">
                  <Utensils size={20} />
                </div>
                No meals logged yet today.
            </div>
        ) : (
            meals.map((meal, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-violet-50/30 transition-colors group cursor-default">
                <div className="flex items-start gap-4">
                   <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                           meal.type === 'Breakfast' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' :
                           meal.type === 'Lunch' ? 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]' :
                           meal.type === 'Dinner' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]'
                       }`}></div>
                   <div className="flex flex-col gap-0.5">
                       <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{meal.type} • {meal.time}</span>
                       <span className="font-bold text-neutral-800 text-sm">{meal.name}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-neutral-500 text-xs font-bold bg-white border border-neutral-100 px-3 py-1.5 rounded-lg group-hover:border-violet-200 group-hover:text-violet-600 transition-all">{meal.cals}</span>
                    <button className="text-neutral-300 hover:text-violet-500 transition-colors opacity-0 group-hover:opacity-100"><CheckCircle2 size={18} /></button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};