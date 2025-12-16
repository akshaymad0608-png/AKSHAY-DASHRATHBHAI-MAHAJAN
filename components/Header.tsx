import React from 'react';
import { Leaf, LogIn } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'plans' | 'recipes';
  onTabChange: (tab: 'dashboard' | 'plans' | 'recipes') => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, isLoggedIn, onOpenLogin, onOpenProfile }) => {
  const getLinkClass = (tab: string) => {
    const isActive = activeTab === tab;
    return `cursor-pointer inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-all duration-200 ${
      isActive 
        ? 'border-violet-500 text-violet-700' 
        : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
    }`;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
              onClick={() => onTabChange('dashboard')}
            >
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white p-2.5 rounded-xl shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
                <Leaf size={24} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-neutral-800">Nutri<span className="text-violet-600">Voice</span></span>
            </div>
            <nav className="hidden md:ml-12 md:flex md:space-x-8 h-20">
              <a onClick={() => onTabChange('dashboard')} className={getLinkClass('dashboard')}>
                Dashboard
              </a>
              <a onClick={() => onTabChange('plans')} className={getLinkClass('plans')}>
                Meal Plans
              </a>
              <a onClick={() => onTabChange('recipes')} className={getLinkClass('recipes')}>
                Recipes
              </a>
            </nav>
          </div>
          <div className="flex items-center">
            {isLoggedIn ? (
              <button 
                onClick={onOpenProfile}
                className="bg-white border border-neutral-200 text-neutral-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=50&h=50" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                My Profile
              </button>
            ) : (
              <button 
                onClick={onOpenLogin}
                className="bg-neutral-900 text-white hover:bg-violet-600 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-neutral-900/20 hover:shadow-violet-600/30 active:scale-95 flex items-center gap-2"
              >
                Sign In <LogIn size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};