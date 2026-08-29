import { useState, useCallback } from 'react';
import { ROUNDS_DATA, RoundData, StageKey, GeographyLevel, PLAYFUL_WRONG_MESSAGES } from '../data/questions';
import { validateGuess } from './validation';

export type GameScreenState = 'START' | 'PLAYING' | 'COMPLETE';

export interface CompletedLevel {
  stage: StageKey;
  level: GeographyLevel;
}

export function useGameState() {
  const [screen, setScreen] = useState<GameScreenState>('START');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<StageKey>('COUNTRY');
  const [completedLevels, setCompletedLevels] = useState<CompletedLevel[]>([]);
  const [wrongMessage, setWrongMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<GeographyLevel | null>(null);

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

  const startNewGame = useCallback((roundNumber?: number) => {
    let index: number;
    if (typeof roundNumber === 'number' && roundNumber >= 1 && roundNumber <= ROUNDS_DATA.length) {
      index = roundNumber - 1;
    } else {
      index = Math.floor(Math.random() * ROUNDS_DATA.length);
    }
    setCurrentRoundIndex(index);
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
      }
      return true;
    } else {
      // Pick random playful wrong message
      const randomMsg = PLAYFUL_WRONG_MESSAGES[Math.floor(Math.random() * PLAYFUL_WRONG_MESSAGES.length)];
      setWrongMessage(randomMsg);
      return false;
    }
  }, [currentLevel, currentStage, completedLevels]);

  const resetToStart = useCallback(() => {
    setScreen('START');
    setCompletedLevels([]);
    setWrongMessage(null);
    setJustUnlocked(null);
  }, []);

  return {
    screen,
    currentRound,
    currentRoundNumber: currentRound.id,
    currentStage,
    currentLevel,
    completedLevels,
    wrongMessage,
    justUnlocked,
    startNewGame,
    submitGuess,
    resetToStart
  };
}
