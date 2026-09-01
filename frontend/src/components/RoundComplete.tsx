import React, { useEffect } from 'react';
import { RoundData } from '../data/questions';
import { Award, UserCheck, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoundCompleteProps {
  roundData: RoundData;
  onHome?: () => void;
}

export const RoundComplete: React.FC<RoundCompleteProps> = ({ roundData, onHome }) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#f43f5e', '#ffffff', '#94a3b8', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  }, []);

  const hierarchy = [
    { label: 'Country', item: roundData.country },
    { label: 'State / Region', item: roundData.state },
    { label: 'District', item: roundData.district },
    { label: 'City', item: roundData.city },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 text-center animate-fade-in">
      {/* Celebration Header */}
      <div className="mb-8">
        <div className="inline-flex p-4 rounded-3xl neu-raised text-rose-500 border border-rose-500/30 mb-4">
          <Award className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-2">
          CONGRATULATIONS
        </h1>
        <p className="text-lg sm:text-xl font-medium text-slate-400">
          You completed the location.
        </p>
      </div>

      {/* Completed Hierarchy Summary */}
      <div className="neu-card p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto mb-10">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">
          DISCOVERED GEOGRAPHY
        </h3>
        <div className="flex flex-col gap-2.5">
          {hierarchy.map((h, i) => (
            <div
              key={h.label}
              className="flex items-center justify-between p-3.5 rounded-xl neu-flat bg-slate-900/60 border border-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full neu-pressed text-[11px] font-bold text-rose-400 flex items-center justify-center border border-rose-500/20">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {h.label}
                </span>
              </div>
              <span className="text-base font-extrabold text-white">
                {h.item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All 4 Unlocked Images */}
      <div className="mb-10">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6">
          UNLOCKED EXPEDITION GALLERY
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {hierarchy.map((h) => (
            <div key={h.label} className="neu-card p-4 rounded-2xl flex flex-col text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {h.label}
                </span>
                <span className="text-xs font-bold text-white">
                  {h.item.name}
                </span>
              </div>
              <div className="relative w-full aspect-video rounded-xl neu-inset overflow-hidden bg-black/40">
                <img
                  src={h.item.image}
                  alt={`${h.label} - ${h.item.name}`}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* External Progression Instructions */}
      <div className="neu-pressed p-6 sm:p-8 rounded-3xl max-w-lg mx-auto bg-slate-900/40 border border-white/5 mb-8">
        <div className="flex flex-col items-center gap-3">
          <div className="p-2.5 rounded-xl neu-flat text-rose-500 border border-rose-500/20">
            <UserCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-200 leading-relaxed">
            Please contact a Club Member<br />
            to proceed to the next round.
          </p>
        </div>
      </div>

      {/* Return to Home Screen Button */}
      {onHome && (
        <div className="flex justify-center">
          <button
            onClick={onHome}
            className="neu-btn px-8 py-3.5 rounded-2xl text-sm font-black tracking-wider uppercase text-white flex items-center gap-2.5 cursor-pointer hover:text-rose-400 hover:border-rose-500/40 active:scale-95 transition-all duration-200"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
    </div>
  );
};
