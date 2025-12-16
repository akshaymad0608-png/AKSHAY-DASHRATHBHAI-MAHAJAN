import React, { useState, useEffect, useRef } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtext: string;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtext, colorClass }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Trigger animation if value has changed
    if (prevValueRef.current !== value) {
      setIsAnimating(true);
      prevValueRef.current = value;
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Animation duration matches the CSS transition

      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100/50 flex flex-col gap-2 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
      <div 
        className={`text-3xl font-extrabold ${colorClass} tracking-tight transition-all duration-300 transform origin-left ${
          isAnimating ? 'scale-110 opacity-80' : 'scale-100 opacity-100'
        }`}
      >
        {value}
      </div>
      <p className="text-neutral-400 text-xs font-medium">{subtext}</p>
    </div>
  );
};