import React, { useState } from 'react';
import { GeographyLevel, StageKey } from '../data/questions';
import { ImageOff, Sparkles } from 'lucide-react';

interface ClueImageSectionProps {
  completedLevels: { stage: StageKey; level: GeographyLevel }[];
  justUnlocked: GeographyLevel | null;
}

export const ClueImageSection: React.FC<ClueImageSectionProps> = ({
  completedLevels
}) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (completedLevels.length === 0) {
    return null;
  }

  const handleImageLoad = (imgSrc: string) => {
    setLoadedImages((prev) => ({ ...prev, [imgSrc]: true }));
  };

  const handleImageError = (imgSrc: string) => {
    setImageErrors((prev) => ({ ...prev, [imgSrc]: true }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="flex flex-col gap-6">
        {completedLevels.map((item, index) => {
          const isLatest = index === completedLevels.length - 1;
          const hasError = imageErrors[item.level.image];

          return (
            <div
              key={item.stage}
              className={`neu-card p-4 sm:p-6 rounded-3xl transition-all duration-700 ease-out transform ${
                isLatest ? 'scale-100 ring-2 ring-emerald-500/20' : 'scale-[0.98] opacity-95'
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full neu-pressed text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {item.level.label}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {item.level.name}
                  </span>
                </div>
                {isLatest && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 neu-pressed px-2.5 py-0.5 rounded-full animate-fade-in">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Unlocked
                  </span>
                )}
              </div>

              <div className="relative w-full overflow-hidden rounded-2xl neu-inset bg-slate-200/50 aspect-video max-h-[420px] flex items-center justify-center">
                {!hasError ? (
                  <img
                    src={item.level.image}
                    alt={`${item.level.label}: ${item.level.name}`}
                    onLoad={() => handleImageLoad(item.level.image)}
                    onError={() => handleImageError(item.level.image)}
                    className={`w-full h-full object-cover rounded-2xl transition-opacity duration-700 ${
                      loadedImages[item.level.image] ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <ImageOff className="w-10 h-10 mb-2 stroke-[1.5] text-slate-400" />
                    <p className="text-sm font-medium">{item.level.label} Clue Image</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{item.level.image}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

