import { useState, useCallback, useRef } from 'react';
import { haptics } from '@/utils/haptics';
import { calculateGameScore } from '../utils';
import type { GameStatus, GameResult } from '../types';

type ChainState = {
  startWord: string;
  endWord: string;
  steps: number;
  chain: string[];
  currentWord: string;
  status: GameStatus;
  hintUsed: boolean;
};

export const useChainGame = (startWord: string, endWord: string, steps: number) => {
  const startTimeRef = useRef(Date.now());

  const [state, setState] = useState<ChainState>({
    startWord: startWord.toUpperCase(),
    endWord: endWord.toUpperCase(),
    steps,
    chain: [startWord.toUpperCase()],
    currentWord: '',
    status: 'playing',
    hintUsed: false,
  });

  const setCurrentWord = useCallback((word: string) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      return { ...prev, currentWord: word.toUpperCase() };
    });
  }, []);

  const submitStep = useCallback((): boolean => {
    const word = state.currentWord.toUpperCase();
    const lastWord = state.chain[state.chain.length - 1] ?? '';

    // Check that exactly one letter differs
    if (word.length !== lastWord.length) {
      haptics.error();
      return false;
    }

    let diffCount = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== lastWord[i]) diffCount++;
    }

    if (diffCount !== 1) {
      haptics.error();
      return false;
    }

    haptics.success();
    const newChain = [...state.chain, word];
    const isComplete = word === state.endWord;

    setState((prev) => ({
      ...prev,
      chain: newChain,
      currentWord: '',
      status: isComplete ? 'correct' : 'playing',
    }));

    return true;
  }, [state.currentWord, state.chain, state.endWord]);

  const getResult = useCallback((): GameResult => {
    const timeSpent = Date.now() - startTimeRef.current;
    const correct = state.status === 'correct';
    return {
      gameType: 'chain',
      correct,
      score: calculateGameScore(correct, timeSpent, state.hintUsed),
      timeSpentMs: timeSpent,
    };
  }, [state.status, state.hintUsed]);

  return {
    startWord: state.startWord,
    endWord: state.endWord,
    chain: state.chain,
    currentWord: state.currentWord,
    status: state.status,
    stepsRemaining: state.steps - state.chain.length + 1,
    setCurrentWord,
    submitStep,
    getResult,
  };
};
