import React from 'react';
import { StageKey, RoundData } from '../data/questions';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressTrackerProps {
  currentStage: StageKey;
  completedStages: { stage: StageKey; name: string }[];
  roundData: RoundData;
}

const STAGES: { key: StageKey; label: string }[] = [
  { key: 'COUNTRY', label: 'COUNTRY' },
  { key: 'STATE', label: 'STATE' },
  { key: 'DISTRICT', label: 'DISTRICT' },
  { key: 'CITY', label: 'CITY' },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  completedStages
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="neu-card p-4 sm:p-5 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {STAGES.map((stage) => {
            const completed = completedStages.find((c) => c.stage === stage.key);

            return (
              <div
                key={stage.key}
                className={`flex flex-col p-3 rounded-xl transition-all duration-300 ${
                  completed
                    ? 'neu-pressed bg-slate-100/80 border border-emerald-500/20'
                    : 'neu-flat bg-slate-50/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] sm:text-xs font-black tracking-wider text-slate-700 uppercase">
                    {stage.label}
                  </span>
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 stroke-[2]" />
                  )}
                </div>

                <div className="min-h-[22px] flex items-center">
                  {completed ? (
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate" title={completed.name}>
                      {completed.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600 font-semibold italic">
                      Locked
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

