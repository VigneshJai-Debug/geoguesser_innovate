import React, { useState } from 'react';
import { GeographyLevel, StageKey } from '../data/questions';
import { ImageOff, HelpCircle, Eye } from 'lucide-react';

interface ActiveClueImageProps {
  currentLevel: GeographyLevel;
}

export const ActiveClueImage: React.FC<ActiveClueImageProps> = ({ currentLevel }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto mb-5 px-3 sm:px-4">
      <div className="neu-card p-3.5 sm:p-5 rounded-3xl transition-all duration-500 ring-1 ring-rose-500/40">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="px-3 py-1 rounded-full neu-pressed text-[11px] sm:text-xs font-black text-rose-400 uppercase tracking-wider">
            {currentLevel.label} CLUE
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-rose-300 neu-pressed px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
            Identify this {currentLevel.label}
          </span>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl neu-inset bg-black/40 aspect-[4/3] sm:aspect-video max-h-[360px] flex items-center justify-center border border-white/5">
          {!hasError ? (
            <img
              key={currentLevel.image}
              src={currentLevel.image}
              alt={`${currentLevel.label} clue`}
              onLoad={() => setLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-full h-full object-cover rounded-2xl transition-opacity duration-500 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ImageOff className="w-8 h-8 mb-2 stroke-[1.5] text-slate-500" />
              <p className="text-xs sm:text-sm font-bold text-slate-300">{currentLevel.label} Clue Image</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{currentLevel.image}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PreviousCluesProps {
  completedLevels: { stage: StageKey; level: GeographyLevel }[];
}

export const PreviousClues: React.FC<PreviousCluesProps> = ({ completedLevels }) => {
  const [open, setOpen] = useState(true);

  if (completedLevels.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-2 mb-8 px-3 sm:px-4">
      <div className="neu-card p-4 rounded-3xl">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-1 px-1 cursor-pointer select-none text-left"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-500 stroke-[2.5]" />
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
              DISCOVERED CLUES ({completedLevels.length})
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 neu-pressed px-2.5 py-0.5 rounded-lg">
            {open ? 'Hide' : 'Show'}
          </span>
        </button>

        {open && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5 animate-fade-in">
            {completedLevels.map((item) => (
              <div
                key={item.stage}
                className="neu-flat p-2.5 rounded-2xl flex flex-col bg-slate-900/60 border border-white/5"
              >
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    {item.level.label}
                  </span>
                  <span className="text-[11px] font-extrabold text-white truncate max-w-[90px]" title={item.level.name}>
                    {item.level.name}
                  </span>
                </div>
                <div className="relative w-full aspect-video rounded-xl neu-inset overflow-hidden bg-black/40">
                  <img
                    src={item.level.image}
                    alt={`${item.level.label}: ${item.level.name}`}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
