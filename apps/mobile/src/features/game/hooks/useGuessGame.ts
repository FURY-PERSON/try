import { useState, useCallback, useRef } from 'react';
import { haptics } from '@/utils/haptics';
import { calculateGameScore } from '../utils';
import type { GameStatus, LetterTileState, GameResult } from '../types';

type GuessState = {
  targetWord: string;
  attempts: string[];
  currentAttempt: string;
  results: LetterTileState[][];
  status: GameStatus;
  usedLetters: Record<string, LetterTileState>;
  hintUsed: boolean;
};

export const useGuessGame = (targetWord: string, maxAttempts: number = 6) => {
  const startTimeRef = useRef(Date.now());
  const wordLength = targetWord.length;

  const [state, setState] = useState<GuessState>({
    targetWord: targetWord.toUpperCase(),
    attempts: [],
    currentAttempt: '',
    results: [],
    status: 'playing',
    usedLetters: {},
    hintUsed: false,
  });

  const addLetter = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      if (prev.currentAttempt.length >= wordLength) return prev;
      haptics.light();
      return { ...prev, currentAttempt: prev.currentAttempt + letter.toUpperCase() };
    });
  }, [wordLength]);

  const removeLetter = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      if (prev.currentAttempt.length === 0) return prev;
      return { ...prev, currentAttempt: prev.currentAttempt.slice(0, -1) };
    });
  }, []);

  const checkAttempt = useCallback((): GameResult | null => {
    if (state.currentAttempt.length !== wordLength) return null;
    if (state.status !== 'playing') return null;

    const attempt = state.currentAttempt.toUpperCase();
    const target = state.targetWord;

    // Calculate letter states
    const result: LetterTileState[] = new Array(wordLength).fill('incorrect') as LetterTileState[];
    const targetChars = target.split('');
    const attemptChars = attempt.split('');
    const used = new Array(wordLength).fill(false) as boolean[];

    // First pass: correct positions
    for (let i = 0; i < wordLength; i++) {
      if (attemptChars[i] === targetChars[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }

    // Second pass: misplaced
    for (let i = 0; i < wordLength; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < wordLength; j++) {
        if (!used[j] && attemptChars[i] === targetChars[j]) {
          result[i] = 'misplaced';
          used[j] = true;
          break;
        }
      }
    }

    const isCorrect = attempt === target;
    const newAttempts = [...state.attempts, attempt];
    const newResults = [...state.results, result];
    const isLastAttempt = newAttempts.length >= maxAttempts;
    const gameOver = isCorrect || isLastAttempt;

    // Update used letters
    const newUsedLetters = { ...state.usedLetters };
    for (let i = 0; i < wordLength; i++) {
      const letter = attemptChars[i] ?? '';
      const currentState = newUsedLetters[letter];
      const newState = result[i] ?? 'incorrect';
      if (newState === 'correct' || !currentState) {
        newUsedLetters[letter] = newState;
      } else if (newState === 'misplaced' && currentState !== 'correct') {
        newUsedLetters[letter] = newState;
      }
    }

    if (isCorrect) haptics.success();
    else if (isLastAttempt) haptics.error();
    else haptics.medium();

    setState((prev) => ({
      ...prev,
      attempts: newAttempts,
      currentAttempt: '',
      results: newResults,
      usedLetters: newUsedLetters,
      status: gameOver ? (isCorrect ? 'correct' : 'incorrect') : 'playing',
    }));

    if (gameOver) {
      const timeSpent = Date.now() - startTimeRef.current;
      return {
        gameType: 'guess',
        correct: isCorrect,
        score: calculateGameScore(isCorrect, timeSpent, state.hintUsed),
        timeSpentMs: timeSpent,
      };
    }

    return null;
  }, [state, wordLength, maxAttempts]);

  const useHint = useCallback(() => {
    if (state.hintUsed || state.status !== 'playing') return;

    // Reveal a random unrevealed letter
    const target = state.targetWord;
    const revealed = new Set<number>();

    for (const result of state.results) {
      result.forEach((s, i) => {
        if (s === 'correct') revealed.add(i);
      });
    }

    const unrevealed: number[] = [];
    for (let i = 0; i < wordLength; i++) {
      if (!revealed.has(i)) unrevealed.push(i);
    }

    if (unrevealed.length === 0) return;

    const hintIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)] ?? 0;
    const hintLetter = target[hintIndex] ?? '';

    // Fill current attempt to just this letter
    let newAttempt = state.currentAttempt;
    while (newAttempt.length < hintIndex) {
      newAttempt += '_';
    }
    newAttempt =
      newAttempt.substring(0, hintIndex) + hintLetter + newAttempt.substring(hintIndex + 1);

    setState((prev) => ({
      ...prev,
      currentAttempt: newAttempt,
      hintUsed: true,
    }));
  }, [state, wordLength]);

  const canCheck = state.currentAttempt.length === wordLength && state.status === 'playing';

  return {
    attempts: state.attempts,
    currentAttempt: state.currentAttempt,
    results: state.results,
    status: state.status,
    usedLetters: state.usedLetters,
    hintUsed: state.hintUsed,
    canCheck,
    addLetter,
    removeLetter,
    checkAttempt,
    useHint,
    maxAttempts,
    wordLength,
  };
};
