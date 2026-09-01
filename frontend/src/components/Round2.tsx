import React, { useState, useRef } from 'react';
import { ArrowRight, AlertCircle, Lock, KeyRound, Loader2, Download, HelpCircle } from 'lucide-react';
import { apiFetch } from '../api/client';
import { TimerBadge } from './TimerBadge';
import cipherRawData from '../data/cipher.txt?raw';

interface Round2Props {
  timeRemainingMs: number;
  onComplete: () => void;
  onExpire: () => void;
}

export const Round2: React.FC<Round2Props> = ({
  timeRemainingMs,
  onComplete,
  onExpire,
}) => {
  const [clueRevealed, setClueRevealed] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClueDownload = () => {
    // 1. Reveal answer submission section
    setClueRevealed(true);

    // 2. Directly trigger file download for clue.png
    const link = document.createElement('a');
    link.href = '/images/cipher/clue.png';
    link.download = 'clue.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Focus answer input shortly after
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch<{
        correct: boolean;
        message?: string;
        completed?: boolean;
        timedOut?: boolean;
      }>('/api/events/complete', {
        method: 'POST',
        body: JSON.stringify({ eventNumber: 6, answer: answerInput }),
      });

      if (res.correct && res.completed) {
        onComplete();
      } else if (res.timedOut) {
        onExpire();
      } else {
        // Playful minimal response
        setErrorMessage('Not quite. Look closer.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Not quite. Look closer.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 animate-fade-in flex flex-col items-center">
      {/* ============================================================ */}
      {/* HIDDEN CIPHER CLUE FOR DEVELOPER TOOLS / DOM INSPECT ELEMENT */}
      {/* ============================================================ */}
      <div
        id="cipher-source-clue"
        className="cipher-source-clue"
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        {cipherRawData}
      </div>

      {/* Top Round Indicator & Timer Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-widest text-rose-400 uppercase px-3.5 py-1.5 rounded-full neu-pressed inline-flex items-center gap-1.5 border border-rose-500/20">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            ROUND 2 · CIPHER CHALLENGE
          </span>
        </div>
        <TimerBadge initialTimeRemainingMs={timeRemainingMs} onExpire={onExpire} />
      </div>

      {/* Primary Meme Card */}
      <div className="w-full neu-card p-5 sm:p-7 rounded-3xl mb-6 text-center flex flex-col items-center">
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl neu-inset bg-black/40 mb-5 p-2 flex items-center justify-center border border-white/5">
          <img
            src="/images/cipher/meme.png"
            alt="Cipher Puzzle Meme"
            className="w-full h-auto max-h-[380px] object-contain rounded-xl"
            onError={() => {
              console.warn('meme.png not found at /images/cipher/meme.png');
            }}
          />
        </div>

        {/* Subtle Line */}
        <p className="text-sm sm:text-base font-semibold text-slate-300 mb-6 italic">
          Something doesn't quite add up.
        </p>

        {/* Clue Download Button */}
        <button
          type="button"
          onClick={handleClueDownload}
          className="neu-btn px-8 py-3.5 rounded-2xl text-sm font-black tracking-wider uppercase text-white flex items-center justify-center gap-2 cursor-pointer hover:text-rose-400 hover:border-rose-500/40 active:scale-95 transition-all duration-200"
        >
          {clueRevealed ? (
            <>
              <Download className="w-4 h-4 text-rose-500 stroke-[2.5]" />
              <span>DOWNLOAD CLUE AGAIN</span>
            </>
          ) : (
            <>
              <HelpCircle className="w-4 h-4 text-rose-500 stroke-[2.5]" />
              <span>NEED A CLUE?</span>
            </>
          )}
        </button>
      </div>

      {/* Answer Submission Section (Revealed after clicking "NEED A CLUE?") */}
      {clueRevealed && (
        <div className="w-full max-w-xl neu-card p-6 sm:p-8 rounded-3xl text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-rose-500" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
              ENTER THE FINAL ANSWER
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className={`relative transition-transform duration-200 ${shake ? 'animate-shake' : ''}`}>
              <input
                ref={inputRef}
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Enter answer"
                className="w-full text-center text-lg sm:text-xl font-bold text-white placeholder-slate-500 py-4 px-6 rounded-2xl neu-inset focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-transparent"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-rose-300 py-2.5 px-4 rounded-xl neu-pressed bg-rose-950/40 border border-rose-500/40">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 stroke-[2.5]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-center mt-2">
              <button
                type="submit"
                disabled={!answerInput.trim() || isSubmitting}
                className={`neu-btn px-10 py-4 rounded-2xl text-base font-black tracking-wider uppercase text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                  !answerInput.trim() || isSubmitting
                    ? 'opacity-40 cursor-not-allowed shadow-none'
                    : 'hover:text-rose-400 hover:border-rose-500/40 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    <span>VALIDATING...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT ANSWER</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
