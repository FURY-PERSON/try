import { useState, useCallback, useRef } from 'react';
import { shuffleArray, calculateGameScore } from '../utils';
import { haptics } from '@/utils/haptics';
import type { GameStatus, AnagramGameData, GameResult } from '../types';

type AnagramState = {
  scrambled: string[];
  answer: string[];
  status: GameStatus;
  hintUsed: boolean;
};

export const useAnagramGame = (data: AnagramGameData) => {
  const startTimeRef = useRef(Date.now());
  const [state, setState] = useState<AnagramState>({
    scrambled: shuffleArray(data.scrambledLetters),
    answer: [],
    status: 'playing',
    hintUsed: false,
  });

  const selectLetter = useCallback((index: number) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      const letter = prev.scrambled[index];
      if (!letter) return prev;

      haptics.light();
      const newScrambled = [...prev.scrambled];
      newScrambled.splice(index, 1);

      return {
        ...prev,
        scrambled: newScrambled,
        answer: [...prev.answer, letter],
      };
    });
  }, []);

  const removeLetter = useCallback((index: number) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      const letter = prev.answer[index];
      if (!letter) return prev;

      haptics.light();
      const newAnswer = [...prev.answer];
      newAnswer.splice(index, 1);

      return {
        ...prev,
        answer: newAnswer,
        scrambled: [...prev.scrambled, letter],
      };
    });
  }, []);

  const checkAnswer = useCallback((): GameResult => {
    const playerAnswer = state.answer.join('').toLowerCase();
    const correct = playerAnswer === data.correctWord.toLowerCase();
    const timeSpent = Date.now() - startTimeRef.current;
    const score = calculateGameScore(correct, timeSpent, state.hintUsed);

    if (correct) {
      haptics.success();
    } else {
      haptics.error();
    }

    setState((prev) => ({
      ...prev,
      status: correct ? 'correct' : 'incorrect',
    }));

    return {
      gameType: 'anagram',
      correct,
      score,
      timeSpentMs: timeSpent,
    };
  }, [state.answer, state.hintUsed, data.correctWord]);

  const useHint = useCallback(() => {
    if (state.hintUsed || state.status !== 'playing') return;

    const correctLetters = data.correctWord.split('');
    const nextIndex = state.answer.length;
    const nextLetter = correctLetters[nextIndex];
    if (!nextLetter) return;

    const scrambledIndex = state.scrambled.findIndex(
      (l) => l.toLowerCase() === nextLetter.toLowerCase(),
    );
    if (scrambledIndex === -1) return;

    setState((prev) => ({
      ...prev,
      hintUsed: true,
    }));

    selectLetter(scrambledIndex);
  }, [state.hintUsed, state.status, state.answer.length, state.scrambled, data.correctWord, selectLetter]);

  const canCheck = state.answer.length === data.correctWord.length && state.status === 'playing';

  return {
    scrambled: state.scrambled,
    answer: state.answer,
    status: state.status,
    hintUsed: state.hintUsed,
    canCheck,
    selectLetter,
    removeLetter,
    checkAnswer,
    useHint,
  };
};
