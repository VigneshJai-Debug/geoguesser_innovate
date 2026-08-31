import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface TimerBadgeProps {
  initialTimeRemainingMs: number;
  onExpire?: () => void;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({
  initialTimeRemainingMs,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor(initialTimeRemainingMs / 1000))
  );

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor(initialTimeRemainingMs / 1000)));
  }, [initialTimeRemainingMs]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsLeft < 300; // less than 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
        isUrgent
          ? 'neu-pressed bg-rose-950/50 text-rose-300 border border-rose-500/50 animate-pulse'
          : 'neu-pressed bg-slate-900/60 text-slate-200 border border-white/5'
      }`}
      title="Round timer (30 minute limit)"
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 stroke-[2.5]" />
      ) : (
        <Timer className="w-4 h-4 text-rose-500 stroke-[2]" />
      )}
      <div className="flex items-center gap-1.5 font-mono text-sm font-black tracking-wider">
        <span className="text-[10px] uppercase font-sans tracking-widest text-slate-400 mr-0.5">
          TIME LEFT:
        </span>
        <span className={isUrgent ? 'text-rose-300 font-extrabold' : 'text-white font-extrabold'}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
