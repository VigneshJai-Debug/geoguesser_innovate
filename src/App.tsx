import { useGameState } from './game/gameState';

import { StartScreen } from './components/StartScreen';
import { ProgressTracker } from './components/ProgressTracker';
import { ClueImageSection } from './components/ClueImage';
import { GuessInput } from './components/GuessInput';
import { RoundComplete } from './components/RoundComplete';
import { Compass, RotateCcw } from 'lucide-react';

export default function App() {
  const {
    screen,
    currentRound,
    currentRoundNumber,
    currentStage,
    currentLevel,
    completedLevels,
    wrongMessage,
    justUnlocked,
    startNewGame,
    submitGuess,
    resetToStart,
  } = useGameState();

  return (
    <div className="min-h-screen bg-[#e6ebf0] text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation / Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={resetToStart}>
          <div className="w-10 h-10 rounded-2xl neu-flat flex items-center justify-center text-slate-700">
            <Compass className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800">GEO QUEST</h1>
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Soft UI Edition</p>
          </div>
        </div>

        {screen !== 'START' && (
          <button
            onClick={resetToStart}
            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-slate-600 flex items-center gap-2 hover:text-slate-900 cursor-pointer"
            title="Back to Home"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto pb-12">
        {screen === 'START' && (
          <StartScreen onStart={() => startNewGame()} />
        )}

        {screen === 'PLAYING' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Progress Tracker */}
            <ProgressTracker
              currentStage={currentStage}
              completedStages={completedLevels.map(c => ({ stage: c.stage, name: c.level.name }))}
              roundData={currentRound}
            />

            {/* Unlocked Images Gallery */}
            <ClueImageSection
              completedLevels={completedLevels}
              justUnlocked={justUnlocked}
            />

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
          </div>
        )}

        {screen === 'COMPLETE' && (
          <RoundComplete roundData={currentRound} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs font-medium text-slate-400">
        Fully Static Geography Exploration • No Backend • No Tracking
      </footer>
    </div>
  );
}

