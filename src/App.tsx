import { useState } from 'react';

import { useGameState } from './game/gameState';
import { StartScreen } from './components/StartScreen';
import { ProgressTracker } from './components/ProgressTracker';
import { ActiveClueImage, PreviousClues } from './components/ClueImage';
import { GuessInput } from './components/GuessInput';
import { RoundComplete } from './components/RoundComplete';
import { Compass, AlertTriangle } from 'lucide-react';

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

  const [headerAlert, setHeaderAlert] = useState(false);

  const handleHeaderClick = () => {
    if (screen === 'PLAYING') {
      setHeaderAlert(true);
      setTimeout(() => setHeaderAlert(false), 3000);
    } else if (screen === 'COMPLETE') {
      resetToStart();
    }
  };

  return (
    <div className="min-h-screen bg-[#e6ebf0] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none" 
          onClick={handleHeaderClick}
        >
          <div className="w-10 h-10 rounded-2xl neu-flat flex items-center justify-center text-slate-800">
            <Compass className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">GEO QUEST</h1>
            <p className="text-[11px] font-extrabold tracking-wider text-slate-600 uppercase">Soft UI Edition</p>
          </div>
        </div>

        {/* In-game non-navigable indicator / warning */}
        {screen === 'PLAYING' && (
          <div className="flex items-center">
            {headerAlert ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 px-4 py-2 rounded-xl neu-pressed bg-amber-100/80 animate-fade-in border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Cannot move back while round is going on. Complete the round!</span>
              </div>
            ) : (
              <div className="neu-pressed px-3.5 py-1.5 rounded-full text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Active Round in Progress
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto pb-10">
        {screen === 'START' && (
          <StartScreen onStart={() => startNewGame()} />
        )}

        {screen === 'PLAYING' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* 1. Progress Tracker */}
            <ProgressTracker
              currentStage={currentStage}
              completedStages={completedLevels.map(c => ({ stage: c.stage, name: c.level.name }))}
              roundData={currentRound}
            />

            {/* 2. Active Stage Clue Image (Current target to identify) */}
            <ActiveClueImage currentLevel={currentLevel} />

            {/* 3. Active Guess Input (Immediately below active image for phone ergonomics) */}
            <GuessInput
              roundNumber={currentRoundNumber}
              stageKey={currentStage}
              stageLabel={currentLevel.label}
              placeholder={currentLevel.placeholder}
              onSubmitGuess={submitGuess}
              wrongMessage={wrongMessage}
              justCorrectName={justUnlocked ? justUnlocked.name : null}
            />

            {/* 4. Previously Identified Clues (Placed underneath guess box, collapsible) */}
            <PreviousClues completedLevels={completedLevels} />
          </div>
        )}

        {screen === 'COMPLETE' && (
          <RoundComplete roundData={currentRound} onHome={resetToStart} />
        )}
      </main>



      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
        PRODINNO VITC-Innovate To Escape
      </footer>
    </div>
  );
}



