import React from 'react';
import { Globe, Compass, Sparkles } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="relative mb-8 group">
        {/* Soft UI Globe Container */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl neu-flat flex items-center justify-center text-slate-700 transition-transform duration-300 group-hover:scale-105">
          <Globe className="w-14 h-14 sm:w-16 sm:h-16 text-slate-700 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-emerald-500/10 text-emerald-600 p-2 rounded-xl neu-raised">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full neu-pressed text-xs font-semibold tracking-wider text-slate-500 uppercase">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
        Interactive Geography Exploration
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
        GEOGRAPHY CHALLENGE
      </h1>

      <p className="text-slate-600 max-w-md text-base sm:text-lg mb-10 leading-relaxed font-normal">
        Identify each location and work your way down from country to city.
      </p>

      <button
        onClick={onStart}
        className="neu-btn px-10 py-4 text-lg font-bold text-slate-800 tracking-wider uppercase rounded-2xl cursor-pointer hover:text-emerald-700 active:scale-95 transition-all duration-200"
      >
        START
      </button>
    </div>
  );
};
