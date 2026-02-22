import { useState, useCallback, useRef } from 'react';
import { haptics } from '@/utils/haptics';
import { calculateGameScore } from '../utils';
import type { GameStatus, GameResult } from '../types';

type ComposeState = {
  availableLetters: string[];
  targetWords: string[];
  foundWords: string[];
  currentWord: string;
  status: GameStatus;
  hintUsed: boolean;
};

export const useComposeGame = (availableLetters: string[], targetWords: string[]) => {
  const startTimeRef = useRef(Date.now());

  const [state, setState] = useState<ComposeState>({
    availableLetters,
    targetWords: targetWords.map((w) => w.toUpperCase()),
    foundWords: [],
    currentWord: '',
    status: 'playing',
    hintUsed: false,
  });

  const addLetter = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      haptics.light();
      return { ...prev, currentWord: prev.currentWord + letter.toUpperCase() };
    });
  }, []);

  const removeLetter = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'playing' || prev.currentWord.length === 0) return prev;
      return { ...prev, currentWord: prev.currentWord.slice(0, -1) };
    });
  }, []);

  const clearWord = useCallback(() => {
    setState((prev) => ({ ...prev, currentWord: '' }));
  }, []);

  const submitWord = useCallback((): boolean => {
    const word = state.currentWord.toUpperCase();
    if (word.length === 0) return false;

    const isTarget = state.targetWords.includes(word);
    const alreadyFound = state.foundWords.includes(word);

    if (isTarget && !alreadyFound) {
      haptics.success();
      const newFound = [...state.foundWords, word];
      const allFound = newFound.length === state.targetWords.length;

      setState((prev) => ({
        ...prev,
        foundWords: newFound,
        currentWord: '',
        status: allFound ? 'correct' : 'playing',
      }));
      return true;
    }

    haptics.error();
    setState((prev) => ({ ...prev, currentWord: '' }));
    return false;
  }, [state.currentWord, state.targetWords, state.foundWords]);

  const getResult = useCallback((): GameResult => {
    const timeSpent = Date.now() - startTimeRef.current;
    const correct = state.foundWords.length === state.targetWords.length;
    return {
      gameType: 'compose',
      correct,
      score: calculateGameScore(correct, timeSpent, state.hintUsed),
      timeSpentMs: timeSpent,
    };
  }, [state.foundWords.length, state.targetWords.length, state.hintUsed]);

  const useHint = useCallback(() => {
    if (state.hintUsed) return;
    const remaining = state.targetWords.filter((w) => !state.foundWords.includes(w));
    if (remaining.length === 0) return;

    const hintWord = remaining[0];
    if (!hintWord) return;
    const firstLetter = hintWord[0] ?? '';

    setState((prev) => ({
      ...prev,
      currentWord: firstLetter,
      hintUsed: true,
    }));
  }, [state.hintUsed, state.targetWords, state.foundWords]);

  return {
    availableLetters: state.availableLetters,
    targetWords: state.targetWords,
    foundWords: state.foundWords,
    currentWord: state.currentWord,
    status: state.status,
    hintUsed: state.hintUsed,
    addLetter,
    removeLetter,
    clearWord,
    submitWord,
    getResult,
    useHint,
  };
};
