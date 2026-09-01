import { useState, useCallback, useEffect } from 'react';
import { ROUNDS_DATA, RoundData, StageKey, GeographyLevel, PLAYFUL_WRONG_MESSAGES } from '../data/questions';
import { validateGuess } from './validation';

export type GameScreenState = 'START' | 'PLAYING' | 'COMPLETE';

export interface CompletedLevel {
  stage: StageKey;
  level: GeographyLevel;
}

interface UseGameStateOptions {
  assignedQuestionId?: number | null;
  onRoundComplete?: () => void;
}

export function useGameState(options?: UseGameStateOptions) {
  const { assignedQuestionId, onRoundComplete } = options || {};

  const [screen, setScreen] = useState<GameScreenState>('PLAYING');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(() => {
    if (typeof assignedQuestionId === 'number' && assignedQuestionId >= 1 && assignedQuestionId <= ROUNDS_DATA.length) {
      return assignedQuestionId - 1;
    }
    return 0;
  });

  const [currentStage, setCurrentStage] = useState<StageKey>('COUNTRY');
  const [completedLevels, setCompletedLevels] = useState<CompletedLevel[]>([]);
  const [wrongMessage, setWrongMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<GeographyLevel | null>(null);

  // Sync assigned question if it updates from backend
  useEffect(() => {
    if (typeof assignedQuestionId === 'number' && assignedQuestionId >= 1 && assignedQuestionId <= ROUNDS_DATA.length) {
      setCurrentRoundIndex(assignedQuestionId - 1);
    }
  }, [assignedQuestionId]);

  const currentRound: RoundData = ROUNDS_DATA[currentRoundIndex] || ROUNDS_DATA[0];

  const getStageLevel = useCallback((stage: StageKey, round: RoundData): GeographyLevel => {
    switch (stage) {
      case 'COUNTRY': return round.country;
      case 'STATE': return round.state;
      case 'DISTRICT': return round.district;
      case 'CITY': return round.city;
    }
  }, []);

  const currentLevel = getStageLevel(currentStage, currentRound);

  const startNewGame = useCallback(() => {
    setCurrentStage('COUNTRY');
    setCompletedLevels([]);
    setWrongMessage(null);
    setJustUnlocked(null);
    setScreen('PLAYING');
  }, []);

  const submitGuess = useCallback((guess: string): boolean => {
    setWrongMessage(null);
    const target = currentLevel;

    const isCorrect = validateGuess(guess, target.name, target.aliases);

    if (isCorrect) {
      const newCompleted = [...completedLevels, { stage: currentStage, level: target }];
      setCompletedLevels(newCompleted);
      setJustUnlocked(target);

      // Advance stage
      if (currentStage === 'COUNTRY') {
        setCurrentStage('STATE');
      } else if (currentStage === 'STATE') {
        setCurrentStage('DISTRICT');
      } else if (currentStage === 'DISTRICT') {
        setCurrentStage('CITY');
      } else if (currentStage === 'CITY') {
        setScreen('COMPLETE');
        if (onRoundComplete) {
          onRoundComplete();
        }
      }
      return true;
    } else {
      // Pick random playful wrong message
      const randomMsg = PLAYFUL_WRONG_MESSAGES[Math.floor(Math.random() * PLAYFUL_WRONG_MESSAGES.length)];
      setWrongMessage(randomMsg);
      return false;
    }
  }, [currentLevel, currentStage, completedLevels, onRoundComplete]);

  const resetToStart = useCallback(() => {
    setScreen('START');
    setCurrentStage('COUNTRY');
    setCompletedLevels([]);
    setWrongMessage(null);
    setJustUnlocked(null);
  }, []);

  return {
    screen,
    setScreen,
    currentRound,
    currentRoundNumber: currentRound.id,
    currentStage,
    currentLevel,
    completedLevels,
    wrongMessage,
    justUnlocked,
    startNewGame,
    submitGuess,
    resetToStart,
  };
}
