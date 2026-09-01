import React, { useEffect } from 'react';
import { Trophy, ClockAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalScreenProps {
  round1Score: number;
  round2Score: number;
  totalScore: number;
  round2Status: 'COMPLETED' | 'TIMED_OUT' | 'EXPIRED';
}

export const FinalScreen: React.FC<FinalScreenProps> = ({
  round1Score,
  round2Score,
  totalScore,
  round2Status,
}) => {
  const isCompleted = round2Status === 'COMPLETED';

  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f43f5e', '#ffffff', '#94a3b8', '#f59e0b'],
        });
      } catch {
        // ignore
      }
    }
  }, [isCompleted]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 text-center animate-fade-in">
      {/* Icon */}
      <div className="mb-6">
        <div
          className={`inline-flex p-5 rounded-3xl neu-raised border ${
            isCompleted
              ? 'text-rose-500 border-rose-500/30'
              : 'text-amber-500 border-amber-500/30'
          }`}
        >
          {isCompleted ? (
            <Trophy className="w-14 h-14 stroke-[1.5]" />
          ) : (
            <ClockAlert className="w-14 h-14 stroke-[1.5]" />
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-2">
        {isCompleted ? 'CONGRATULATIONS' : "TIME'S UP"}
      </h1>

      <p className="text-base sm:text-lg font-medium text-slate-400 mb-8">
        You have completed all available challenges.
      </p>

      {/* Score Breakdown Card */}
      <div className="neu-card p-6 sm:p-8 rounded-3xl max-w-md mx-auto mb-8 text-left">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 text-center">
          FINAL EVENT SCORES
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl neu-flat bg-slate-900/60 border border-white/5">
            <span className="text-xs font-extrabold text-slate-300 uppercase">
              Round 1 (Geography)
            </span>
            <span className="text-base font-black text-white">
              {round1Score} pts
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl neu-flat bg-slate-900/60 border border-white/5">
            <span className="text-xs font-extrabold text-slate-300 uppercase">
              Round 2 (Cipher)
            </span>
            <span className="text-base font-black text-white">
              {round2Score} pts
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl neu-pressed bg-rose-950/40 border border-rose-500/40 mt-2">
            <span className="text-sm font-black text-rose-300 uppercase tracking-wider">
              TOTAL SCORE
            </span>
            <span className="text-2xl font-black text-rose-400">
              {totalScore} pts
            </span>
          </div>
        </div>
      </div>

      {/* Results Will Be Published Notice */}
      <div className="neu-pressed p-6 rounded-3xl max-w-md mx-auto bg-slate-900/40 border border-white/5">
        <div className="flex items-center justify-center gap-2 text-slate-200">
          <Sparkles className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-base sm:text-lg font-black tracking-tight">
            Results will be published soon.
          </p>
        </div>
      </div>
    </div>
  );
};
