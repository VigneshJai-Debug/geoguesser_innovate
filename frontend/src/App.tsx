import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { apiFetch } from './api/client';
import { LoginScreen } from './components/LoginScreen';
import { StartScreen } from './components/StartScreen';
import { ProgressTracker } from './components/ProgressTracker';
import { ActiveClueImage, PreviousClues } from './components/ClueImage';
import { GuessInput } from './components/GuessInput';
import { RoundEndScreen } from './components/RoundEndScreen';
import { FinalScreen } from './components/FinalScreen';
import { Round2 } from './components/Round2';
import { Event1ForgottenHill } from './components/Event1ForgottenHill';
import { Event3LastBroadcast } from './components/Event3LastBroadcast';
import { TimerBadge } from './components/TimerBadge';
import { useGameState } from './game/gameState';
import { ShieldAlert, LogOut, Loader2, Sparkles } from 'lucide-react';

interface EventProgressData {
  id: string;
  eventNumber: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'TIMED_OUT';
  assignedQuestionId: number | null;
  completionNumber: number | null;
  score: number;
  startedAt: string;
  completedAt: string | null;
  timeRemainingMs: number;
  submissionBlobUrl?: string | null;
  verificationStatus?: string | null;
}

interface GameStateData {
  activeEventNumber: number;
  eventOpen: boolean;
  eventProgress: EventProgressData[];
  totalScore: number;
}

export default function App() {
  const { team, isLoading: authLoading, logout } = useAuth();

  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [geoStarted, setGeoStarted] = useState(false);

  // Fetch full game state
  const loadGameState = useCallback(async () => {
    if (!team) return;
    try {
      setIsGameLoading(true);
      const data = await apiFetch<GameStateData>('/api/events/state');
      setGameState(data);

      // Auto-enter the active event if team hasn't started it yet
      const currentProgress = data.eventProgress.find(
        (p) => p.eventNumber === data.activeEventNumber
      );
      if (!currentProgress) {
        const enterRes = await apiFetch<{ progress: EventProgressData }>('/api/events/enter', {
          method: 'POST',
        });
        if (enterRes.progress) {
          setGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              eventProgress: [
                ...prev.eventProgress.filter((p) => p.eventNumber !== data.activeEventNumber),
                enterRes.progress,
              ],
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load game state:', err);
    } finally {
      setIsGameLoading(false);
    }
  }, [team]);

  useEffect(() => {
    if (team) {
      loadGameState();
    } else {
      setGameState(null);
      setGeoStarted(false);
    }
  }, [team, loadGameState]);

  // Active event number and current progress
  const activeEventNumber = gameState?.activeEventNumber ?? 1;
  const currentProgress = gameState?.eventProgress.find(
    (p) => p.eventNumber === activeEventNumber
  );

  // Per-event progress records
  const r1Progress = gameState?.eventProgress.find((p) => p.eventNumber === 1);
  const r2Progress = gameState?.eventProgress.find((p) => p.eventNumber === 2);
  const r3Progress = gameState?.eventProgress.find((p) => p.eventNumber === 3);
  const r6Progress = gameState?.eventProgress.find((p) => p.eventNumber === 6);

  // GeoGuesser completion handler (Event 2)
  const handleGeoGuesserComplete = useCallback(async () => {
    try {
      await apiFetch('/api/events/complete', {
        method: 'POST',
        body: JSON.stringify({ eventNumber: 2, correct: true }),
      });
      await loadGameState();
    } catch (err) {
      console.error('Failed to submit GeoGuesser completion:', err);
      await loadGameState();
    }
  }, [loadGameState]);

  // Timer expiration handler
  const handleTimerExpire = useCallback(async () => {
    await loadGameState();
  }, [loadGameState]);

  // Local Geography game state hook for Event 2
  const assignedQuestionId = r2Progress?.assignedQuestionId || 1;
  const {
    screen: geoScreen,
    currentRound,
    currentRoundNumber,
    currentStage,
    currentLevel,
    completedLevels,
    wrongMessage,
    justUnlocked,
    startNewGame,
    submitGuess,
  } = useGameState({
    assignedQuestionId,
    onRoundComplete: handleGeoGuesserComplete,
  });

  // 1. Loading screen
  if (authLoading || (team && isGameLoading && !gameState)) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl neu-flat flex items-center justify-center text-rose-500 mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
          INITIALIZING ESCAPE ROOM...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated -> Login Screen
  if (!team) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col selection:bg-rose-600 selection:text-white">
        <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>INNOVATE TO ESCAPE</span>
              </h1>
              <p className="text-[11px] font-extrabold tracking-widest text-rose-500 uppercase">PRODINNO · technoVIT</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto pb-10">
          <LoginScreen />
        </main>

        <footer className="w-full py-4 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
          PRODINNO · technoVIT · VIT CHENNAI — INNOVATE TO ESCAPE
        </footer>
      </div>
    );
  }

  // 3. Authenticated Game Flow
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col selection:bg-rose-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5">
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-11 h-11 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
              INNOVATE TO ESCAPE
            </h1>
            <p className="text-[11px] font-extrabold tracking-widest text-rose-500 uppercase">PRODINNO · technoVIT</p>
          </div>
        </div>

        {/* Team Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="neu-pressed px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black text-slate-200 tracking-wider uppercase border border-rose-500/20">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-white font-extrabold">{team.teamName}</span>
          </div>

          <button
            onClick={() => logout()}
            title="Log Out"
            className="neu-btn p-2.5 rounded-2xl text-slate-400 hover:text-rose-400 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto pb-10 px-2 sm:px-4">
        {/* ======================================================== */}
        {/* EVENT 1 FLOW (Forgotten Hill) */}
        {/* ======================================================== */}
        {activeEventNumber === 1 && r1Progress && (
          <Event1ForgottenHill
            timeRemainingMs={currentProgress?.timeRemainingMs || 30 * 60 * 1000}
            onComplete={loadGameState}
            onExpire={handleTimerExpire}
            status={r1Progress.status}
          />
        )}

        {/* ======================================================== */}
        {/* EVENT 2 FLOW (GeoGuesser) */}
        {/* ======================================================== */}
        {activeEventNumber === 2 && (
          <>
            {/* If Event 2 is Finished (COMPLETED or TIMED_OUT) */}
            {r2Progress && r2Progress.status !== 'ACTIVE' ? (
              <RoundEndScreen
                roundNumber={2}
                status={r2Progress.status}
                score={r2Progress.score}
                completionNumber={r2Progress.completionNumber}
                isFinalRound={false}
              />
            ) : (
              /* Round 1 is ACTIVE */
              <>
                {!round1Started && geoScreen === 'START' ? (
                  <StartScreen
                    onStart={() => {
                      setRound1Started(true);
                      startNewGame();
                    }}
                  />
                ) : (
                  <div className="w-full flex flex-col items-center animate-fade-in mt-4">
                    {/* Live Countdown Timer Badge */}
                    <div className="mb-4">
                      <TimerBadge
                        initialTimeRemainingMs={currentProgress?.timeRemainingMs || 30 * 60 * 1000}
                        onExpire={handleTimerExpire}
                      />
                    </div>

                    {/* Progress Tracker */}
                    <ProgressTracker
                      currentStage={currentStage}
                      completedStages={completedLevels.map((c) => ({ stage: c.stage, name: c.level.name }))}
                      roundData={currentRound}
                    />

                    {/* Active Clue Image */}
                    <ActiveClueImage currentLevel={currentLevel} />

                    {/* Active Guess Input */}
                    <GuessInput
                      roundNumber={currentRoundNumber}
                      stageKey={currentStage}
                      stageLabel={currentLevel.label}
                      placeholder={currentLevel.placeholder}
                      onSubmitGuess={submitGuess}
                      wrongMessage={wrongMessage}
                      justCorrectName={justUnlocked ? justUnlocked.name : null}
                    />

                    {/* Previous Clues */}
                    <PreviousClues completedLevels={completedLevels} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* EVENT 3 FLOW (The Last Broadcast) */}
        {/* ======================================================== */}
        {activeEventNumber === 3 && r3Progress && (
          <Event3LastBroadcast
            timeRemainingMs={currentProgress?.timeRemainingMs || 30 * 60 * 1000}
            onComplete={loadGameState}
            onExpire={handleTimerExpire}
            status={r3Progress.status}
          />
        )}

        {/* ======================================================== */}
        {/* EVENT 6 FLOW (Cipher) */}
        {/* ======================================================== */}
        {activeEventNumber === 6 && (
          <>
            {/* If Event 6 is Finished (COMPLETED or TIMED_OUT) -> FINAL SCREEN */}
            {r6Progress && r6Progress.status !== 'ACTIVE' ? (
              <FinalScreen
                round1Score={r2Progress?.score || 0} // GeoGuesser score
                round2Score={r6Progress.score || 0} // Cipher score
                totalScore={(r2Progress?.score || 0) + (r6Progress.score || 0)}
                round2Status={r6Progress.status}
              />
            ) : (
              /* Round 2 is ACTIVE */
              <div className="mt-4">
                <Round2
                  timeRemainingMs={currentProgress?.timeRemainingMs || 30 * 60 * 1000}
                  onComplete={loadGameState}
                  onExpire={handleTimerExpire}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
        PRODINNO · technoVIT · VIT CHENNAI — INNOVATE TO ESCAPE
      </footer>
    </div>
  );
}
