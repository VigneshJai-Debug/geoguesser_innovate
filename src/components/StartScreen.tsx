import React from 'react';
import { Globe, Compass, Sparkles, MapPin } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8 group">
        {/* Soft UI Globe Container */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20 transition-transform duration-300 group-hover:scale-105">
          <Globe className="w-14 h-14 sm:w-16 sm:h-16 text-rose-500 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-rose-500/20 text-rose-400 p-2.5 rounded-xl neu-raised border border-rose-500/30">
          <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 rounded-full neu-pressed text-xs font-bold tracking-widest text-rose-400 uppercase border border-rose-500/20">
        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        ROUND 1 · GEOGRAPHY CHALLENGE
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 uppercase">
        GEOGRAPHY CHALLENGE
      </h1>

      <p className="text-slate-400 max-w-md text-base sm:text-lg mb-10 leading-relaxed font-medium">
        Identify each location clue and work your way down from country to city.
      </p>

      <button
        onClick={onStart}
        className="neu-btn px-12 py-4 text-lg font-black text-white tracking-widest uppercase rounded-2xl cursor-pointer hover:text-rose-400 hover:border-rose-500/40 active:scale-95 transition-all duration-200 flex items-center gap-2.5"
      >
        <MapPin className="w-5 h-5 text-rose-500" />
        <span>BEGIN ROUND 1</span>
      </button>
    </div>
  );
};
