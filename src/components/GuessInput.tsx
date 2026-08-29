import React, { useState, useEffect, useRef } from 'react';
import { StageKey } from '../data/questions';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

interface GuessInputProps {
  roundNumber: number;
  stageKey: StageKey;
  stageLabel: string;
  placeholder: string;
  onSubmitGuess: (guess: string) => boolean;
  wrongMessage: string | null;
  justCorrectName: string | null;
}

export const GuessInput: React.FC<GuessInputProps> = ({
  roundNumber,
  stageLabel,
  placeholder,
  onSubmitGuess,
  wrongMessage,
  justCorrectName,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever stage changes or on mount
  useEffect(() => {
    setInputVal('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [stageLabel]);

  // Shake effect when wrong
  useEffect(() => {
    if (wrongMessage) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [wrongMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const correct = onSubmitGuess(inputVal);
    if (correct) {
      setInputVal('');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 mb-4">
      <div className="neu-card p-4 sm:p-7 rounded-3xl text-center">
        {/* Stage Header */}
        <div className="mb-1">
          <span className="text-[11px] sm:text-xs font-black tracking-widest text-slate-700 uppercase px-3 py-1 rounded-full neu-pressed inline-block">
            ROUND {roundNumber}
          </span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 mb-4">
          GUESS THE {stageLabel.toUpperCase()}
        </h2>


        {/* Temporary Correct Banner before moving */}
        {justCorrectName && (
          <div className="mb-6 p-4 rounded-2xl neu-pressed bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex items-center justify-center gap-2 animate-bounce">
            <Check className="w-5 h-5 text-emerald-600 font-extrabold stroke-[2.5]" />
            <span className="text-sm font-bold tracking-wide">
              CORRECT — <span className="font-black text-slate-900">{justCorrectName}</span>
            </span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className={`relative transition-transform duration-200 ${shake ? 'animate-shake' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={placeholder}
              className="w-full text-center text-lg sm:text-xl font-bold text-slate-900 placeholder-slate-500 py-4 px-6 rounded-2xl neu-inset focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all bg-transparent"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Playful Wrong Message (inline, high contrast) */}
          {wrongMessage && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-900 py-2.5 px-4 rounded-xl neu-pressed bg-amber-50/80 border border-amber-300/60">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 stroke-[2.5]" />
              <span>{wrongMessage}</span>
            </div>
          )}

          <div className="flex justify-center mt-2">
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`neu-btn px-8 py-3.5 rounded-2xl text-base font-black tracking-wider uppercase text-slate-900 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                !inputVal.trim()
                  ? 'opacity-40 cursor-not-allowed shadow-none'
                  : 'hover:text-emerald-700 active:scale-95'
              }`}
            >
              <span>SUBMIT</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

