import React, { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle, FileText } from 'lucide-react';
import { apiFetch } from '../api/client';
import { TimerBadge } from './TimerBadge';
import { event3Questions } from '../data/event3_questions';

interface Event3Props {
  timeRemainingMs: number;
  onComplete: () => void;
  onExpire: () => void;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'TIMED_OUT';
}

export const Event3LastBroadcast: React.FC<Event3Props> = ({
  timeRemainingMs,
  onComplete,
  onExpire,
  status
}) => {
  const [answers, setAnswers] = useState<number[]>(new Array(event3Questions.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOptionSelect = (qIndex: number, optIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const allAnswered = answers.every(a => a !== -1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiFetch('/api/events/complete', {
        method: 'POST',
        body: JSON.stringify({
          eventNumber: 3,
          answers,
        }),
      });

      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit investigation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status !== 'ACTIVE') {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fade-in text-center">
        <div className="neu-card p-8 rounded-3xl flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">INVESTIGATION CONCLUDED</h2>
          <p className="text-slate-300">
            Your final accusation and evidence have been logged. The case is now closed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 animate-fade-in flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-widest text-rose-400 uppercase px-3.5 py-1.5 rounded-full neu-pressed inline-flex items-center gap-1.5 border border-rose-500/20">
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            EVENT 3 · INVESTIGATION
          </span>
        </div>
        <TimerBadge initialTimeRemainingMs={timeRemainingMs} onExpire={onExpire} />
      </div>

      <div className="w-full neu-card p-6 sm:p-10 rounded-3xl mb-6">
        <div className="text-center border-b border-white/5 pb-8 mb-8">
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
            THE LAST BROADCAST
          </h2>
          <p className="text-rose-500 font-bold tracking-widest text-sm uppercase mb-6">
            INVESTIGATION FORM
          </p>
          <div className="inline-block neu-inset px-6 py-3 rounded-xl border border-white/5 text-left mb-6">
            <p className="text-slate-300 font-mono text-xs mb-1">
              <span className="text-rose-400 font-bold">CASE:</span> FILE 17-B — BLACKWOOD MANOR
            </p>
            <p className="text-slate-300 font-mono text-xs">
              <span className="text-rose-400 font-bold">DATE:</span> 17 October 2026 | Blackwood Island, Scotland
            </p>
          </div>

          <div className="text-slate-300 text-sm leading-relaxed text-left space-y-4 max-w-2xl mx-auto">
            <p>
              Elias Vane is dead. His study was locked. The storm has cut Blackwood Island off from the outside world, and the evidence raises more questions than answers.
            </p>
            <p>
              Your team has been assigned to investigate the case and determine what really happened.
            </p>
            <p>
              Work together. Examine the evidence carefully. Question every alibi. Connect the clues.
              Throughout this investigation, you will answer questions based on the case briefing and evidence presented to you. At the end, your team must submit its final accusation and determine what really happened.
            </p>
            <p className="font-bold text-white italic">
              Every deduction matters. Choose carefully.<br />
              The clock is ticking, detectives.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          {event3Questions.map((q, qIndex) => (
            <div key={q.id} className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white">
                <span className="text-rose-500 mr-2">Q{qIndex + 1}.</span>
                {q.question}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => handleOptionSelect(qIndex, optIndex)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                      answers[qIndex] === optIndex
                        ? 'neu-pressed border-rose-500/50 text-white bg-rose-950/20'
                        : 'neu-inset border-white/5 text-slate-300 hover:border-rose-500/30 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-xs text-slate-500 mr-3">
                      {String.fromCharCode(65 + optIndex)}.
                    </span>
                    <span className="font-medium text-sm">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {errorMessage && (
            <div className="text-center font-bold text-rose-400 bg-rose-950/40 p-4 rounded-xl border border-rose-500/20">
              {errorMessage}
            </div>
          )}

          <div className="pt-6 border-t border-white/5 flex flex-col items-center">
            <button
              type="submit"
              disabled={!allAnswered || isSubmitting}
              className={`neu-btn w-full sm:w-auto px-12 py-5 rounded-2xl text-base font-black tracking-wider uppercase text-white flex items-center justify-center gap-3 transition-all duration-200 ${
                !allAnswered || isSubmitting
                  ? 'opacity-40 cursor-not-allowed shadow-none'
                  : 'hover:text-rose-400 hover:border-rose-500/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                  SUBMITTING...
                </>
              ) : (
                <>
                  SUBMIT INVESTIGATION
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
            {!allAnswered && (
              <p className="text-slate-500 text-xs mt-4 font-semibold uppercase tracking-wider">
                Answer all questions to submit
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
