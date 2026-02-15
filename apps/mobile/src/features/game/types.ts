export type GameStatus = 'idle' | 'playing' | 'checking' | 'correct' | 'incorrect' | 'completed';

export type LetterTileState = 'default' | 'selected' | 'correct' | 'incorrect' | 'hint' | 'misplaced';

export type GameResult = {
  gameType: string;
  correct: boolean;
  score: number;
  timeSpentMs: number;
};

export type DailySetProgress = {
  currentGameIndex: number;
  totalGames: number;
  results: GameResult[];
  completed: boolean;
};

export type AnagramGameData = {
  scrambledLetters: string[];
  correctWord: string;
  hint?: string;
};

export type ComposeGameData = {
  availableLetters: string[];
  targetWords: string[];
  foundWords: string[];
};

export type ChainGameData = {
  startWord: string;
  endWord: string;
  steps: number;
  currentChain: string[];
};

export type SearchGameData = {
  grid: string[][];
  targetWords: string[];
  foundWords: string[];
};

export type GuessGameData = {
  wordLength: number;
  maxAttempts: number;
  attempts: string[];
  results: LetterTileState[][];
};
