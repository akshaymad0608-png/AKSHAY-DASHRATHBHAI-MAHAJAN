import React, { useState, useEffect } from 'react';
import { X, User, Scale, Ruler, History, Calendar, LogOut, ChevronRight, Edit2, Check, Save, Flame, Target } from 'lucide-react';

interface HistoryItem {
  action: string;
  date: string;
  icon: React.ReactNode;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  history: HistoryItem[];
  userName: string;
  weight: string;
  height: string;
  onUpdateStats: (weight: string, height: string) => void;
  caloriesConsumed: number;
  caloriesLeft: number;
  targetCalories: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, onClose, onLogout, history, userName,
  weight, height, onUpdateStats,
  caloriesConsumed, caloriesLeft, targetCalories
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localWeight, setLocalWeight] = useState(weight);
  const [localHeight, setLocalHeight] = useState(height);

  useEffect(() => {
    if(isOpen) {
        setLocalWeight(weight);
        setLocalHeight(height);
        setIsEditing(false);
    }
  }, [isOpen, weight, height]);

  const handleSave = () => {
    onUpdateStats(localWeight, localHeight);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  const progressPercentage = Math.min(100, Math.round((caloriesConsumed / targetCalories) * 100));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl shadow-violet-900/20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-8 pb-12 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1">
                    <img 
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover border-4 border-neutral-900" 
                    />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{userName}</h2>
                    <p className="text-neutral-400 text-sm">Premium Member</p>
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 -mt-6 bg-white rounded-t-[2rem]">
            
            {/* Daily Progress Section */}
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Daily Progress
            </h3>
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm mb-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-2">
                             <div className="bg-orange-100 text-orange-500 p-1.5 rounded-lg">
                                 <Flame size={18} fill="currentColor" className="opacity-90"/>
                             </div>
                             <div>
                                 <p className="text-xs text-neutral-500 font-bold uppercase tracking-wide">Calories</p>
                                 <p className="text-lg font-extrabold text-neutral-800 leading-none">{caloriesConsumed} <span className="text-neutral-400 text-xs font-medium">/ {targetCalories}</span></p>
                             </div>
                        </div>
                        <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">{progressPercentage}%</span>
                    </div>
                    
                    <div className="w-full bg-neutral-100 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-50">
                        <div className="flex items-center gap-2">
                             <Target size={14} className="text-neutral-400" />
                             <span className="text-xs font-bold text-neutral-500">Goal: {targetCalories}</span>
                        </div>
                         <div className="flex items-center gap-2 justify-end">
                             <span className="text-xs font-bold text-emerald-500">{caloriesLeft} left</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Stats Section */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    Body Metrics
                </h3>
                <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isEditing ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                >
                    {isEditing ? <><Check size={14}/> Save</> : <><Edit2 size={12}/> Edit</>}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2 text-violet-400 mb-1">
                        <Scale size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Weight</span>
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={localWeight}
                                onChange={(e) => setLocalWeight(e.target.value)}
                                className="w-full bg-white border border-violet-200 rounded-lg px-2 py-1 text-xl font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                autoFocus
                            />
                            <span className="text-sm text-neutral-500 font-medium">kg</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-extrabold text-neutral-800">{localWeight} <span className="text-sm text-neutral-500 font-medium">kg</span></span>
                    )}
                </div>
                <div className="bg-fuchsia-50 p-5 rounded-2xl border border-fuchsia-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
                        <Ruler size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Height</span>
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={localHeight}
                                onChange={(e) => setLocalHeight(e.target.value)}
                                className="w-full bg-white border border-fuchsia-200 rounded-lg px-2 py-1 text-xl font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                            />
                            <span className="text-sm text-neutral-500 font-medium">cm</span>
                        </div>
                    ) : (
                        <span className="text-2xl font-extrabold text-neutral-800">{localHeight} <span className="text-sm text-neutral-500 font-medium">cm</span></span>
                    )}
                </div>
            </div>

            {isEditing && (
                 <button 
                    onClick={handleSave}
                    className="w-full mb-8 bg-neutral-900 text-white font-bold py-3 rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    <Save size={16} /> Save Changes
                </button>
            )}

            {/* History Section */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History size={14} /> Visitor History
                </h3>
                <div className="space-y-3">
                    {history.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-full text-neutral-500">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-neutral-800">{item.action}</p>
                                    <p className="text-xs text-neutral-400 font-medium">{item.date}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-neutral-300" />
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-center text-neutral-400 text-sm py-4">No recent history</div>
                    )}
                </div>
            </div>

            {/* Logout */}
            <button 
                onClick={onLogout}
                className="w-full border border-red-100 bg-red-50 text-red-500 font-bold py-3.5 rounded-xl hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
            >
                <LogOut size={18} /> Sign Out
            </button>
        </div>
      </div>
    </div>
  );
};