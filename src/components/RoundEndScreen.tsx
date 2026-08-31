import React, { useEffect } from 'react';
import { Award, ClockAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoundEndScreenProps {
  roundNumber: number;
  status: 'COMPLETED' | 'TIMED_OUT';
  score: number;
  completionNumber?: number | null;
  isFinalRound?: boolean;
}

export const RoundEndScreen: React.FC<RoundEndScreenProps> = ({
  roundNumber,
  status,
  score,
  completionNumber,
  isFinalRound = false,
}) => {
  const isCompleted = status === 'COMPLETED';

  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f43f5e', '#ffffff', '#94a3b8', '#f59e0b'],
        });
      } catch {
        // ignore in canvas-less env
      }
    }
  }, [isCompleted]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 text-center animate-fade-in">
      {/* Icon Badge */}
      <div className="mb-6">
        <div
          className={`inline-flex p-4 rounded-3xl neu-raised border ${
            isCompleted
              ? 'text-rose-500 border-rose-500/30'
              : 'text-amber-500 border-amber-500/30'
          }`}
        >
          {isCompleted ? (
            <Award className="w-12 h-12 stroke-[1.5]" />
          ) : (
            <ClockAlert className="w-12 h-12 stroke-[1.5]" />
          )}
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-2">
        {isCompleted ? 'ROUND COMPLETE' : "TIME'S UP"}
      </h1>

      <p className="text-base sm:text-lg font-medium text-slate-400 mb-8">
        {isCompleted ? 'Challenge successfully solved.' : 'This round has ended.'}
      </p>

      {/* Score Summary Card */}
      <div className="neu-card p-6 sm:p-8 rounded-3xl max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between py-2.5 border-b border-white/5 mb-4">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
            ROUND
          </span>
          <span className="text-xs font-extrabold text-rose-400 uppercase px-3 py-1 rounded-full neu-pressed border border-rose-500/20">
            ROUND {roundNumber}
          </span>
        </div>

        {isCompleted && completionNumber && (
          <div className="flex items-center justify-between py-2.5 border-b border-white/5 mb-4">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              COMPLETION ORDER
            </span>
            <span className="text-base font-extrabold text-white">
              #{completionNumber}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
            POINTS EARNED
          </span>
          <span
            className={`text-2xl sm:text-3xl font-black ${
              isCompleted && score > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {score} {score === 1 ? 'pt' : 'pts'}
          </span>
        </div>
      </div>

      {/* Next Status Notice */}
      <div className="neu-pressed p-6 rounded-3xl max-w-md mx-auto bg-slate-900/40 border border-white/5">
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <p className="text-base sm:text-lg font-extrabold tracking-tight">
            {isFinalRound ? 'Results will be published soon.' : 'Next round will start soon.'}
          </p>
        </div>
      </div>
    </div>
  );
};
