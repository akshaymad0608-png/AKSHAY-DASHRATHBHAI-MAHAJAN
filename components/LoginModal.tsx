import React, { useState } from 'react';
import { X, Mail, Lock, ArrowRight, User } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignUp: (name: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSignUp }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      if (isSignUp) {
        onSignUp(name || 'New User');
      } else {
        onLogin();
      }
    }, 1000);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl shadow-violet-900/20 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors bg-neutral-50 p-2 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-neutral-500 text-sm">
            {isSignUp ? "Join NutriVoice for personalized AI coaching." : "Sign in to sync your diet plans and history."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-neutral-400" size={18} />
                <input 
                  type="text" 
                  required={isSignUp}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-neutral-800"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-neutral-400" size={18} />
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-neutral-800"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-neutral-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-neutral-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 hover:bg-violet-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-neutral-900/20 hover:shadow-violet-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : (
              <>
                {isSignUp ? "Create Account" : "Sign In"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-500 font-medium">
          {isSignUp ? "Already have an account?" : "Don't have an account?"} <span onClick={toggleMode} className="text-violet-600 cursor-pointer hover:underline">{isSignUp ? "Sign In" : "Sign up"}</span>
        </p>
      </div>
    </div>
  );
};