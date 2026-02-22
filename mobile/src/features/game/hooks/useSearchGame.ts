import { useState, useCallback, useRef } from 'react';
import { haptics } from '@/utils/haptics';
import { calculateGameScore } from '../utils';
import type { GameStatus, GameResult } from '../types';

type SearchState = {
  grid: string[][];
  targetWords: string[];
  foundWords: string[];
  selectedCells: { row: number; col: number }[];
  status: GameStatus;
  hintUsed: boolean;
};

export const useSearchGame = (grid: string[][], targetWords: string[]) => {
  const startTimeRef = useRef(Date.now());

  const [state, setState] = useState<SearchState>({
    grid,
    targetWords: targetWords.map((w) => w.toUpperCase()),
    foundWords: [],
    selectedCells: [],
    status: 'playing',
    hintUsed: false,
  });

  const selectCell = useCallback((row: number, col: number) => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      haptics.light();

      const isAlreadySelected = prev.selectedCells.some(
        (c) => c.row === row && c.col === col,
      );

      if (isAlreadySelected) {
        return {
          ...prev,
          selectedCells: prev.selectedCells.filter(
            (c) => !(c.row === row && c.col === col),
          ),
        };
      }

      return {
        ...prev,
        selectedCells: [...prev.selectedCells, { row, col }],
      };
    });
  }, []);

  const checkSelection = useCallback((): boolean => {
    const word = state.selectedCells
      .map((c) => state.grid[c.row]?.[c.col] ?? '')
      .join('')
      .toUpperCase();

    const isTarget = state.targetWords.includes(word);
    const alreadyFound = state.foundWords.includes(word);

    if (isTarget && !alreadyFound) {
      haptics.success();
      const newFound = [...state.foundWords, word];
      const allFound = newFound.length === state.targetWords.length;

      setState((prev) => ({
        ...prev,
        foundWords: newFound,
        selectedCells: [],
        status: allFound ? 'correct' : 'playing',
      }));
      return true;
    }

    haptics.error();
    setState((prev) => ({ ...prev, selectedCells: [] }));
    return false;
  }, [state.selectedCells, state.grid, state.targetWords, state.foundWords]);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedCells: [] }));
  }, []);

  const getResult = useCallback((): GameResult => {
    const timeSpent = Date.now() - startTimeRef.current;
    const correct = state.foundWords.length === state.targetWords.length;
    return {
      gameType: 'search',
      correct,
      score: calculateGameScore(correct, timeSpent, state.hintUsed),
      timeSpentMs: timeSpent,
    };
  }, [state.foundWords.length, state.targetWords.length, state.hintUsed]);

  return {
    grid: state.grid,
    targetWords: state.targetWords,
    foundWords: state.foundWords,
    selectedCells: state.selectedCells,
    status: state.status,
    selectCell,
    checkSelection,
    clearSelection,
    getResult,
  };
};
