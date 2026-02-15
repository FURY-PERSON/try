import type { GameType } from '../constants/game-types';
import type { QuestionStatus } from '../constants/question-status';
import type { Language } from '../constants/languages';

export type AnagramData = {
  word: string;
  shuffled: string;
};

export type ComposeWordsData = {
  letters: string[];
  validWords: string[];
};

export type WordChainData = {
  startWord: string;
  endWord: string;
  steps: string[];
};

export type WordSearchData = {
  grid: string[][];
  words: string[];
};

export type GuessWordData = {
  word: string;
};

export type QuestionData =
  | AnagramData
  | ComposeWordsData
  | WordChainData
  | WordSearchData
  | GuessWordData;

export type Question = {
  id: string;
  type: GameType;
  language: Language;
  categoryId: string;
  difficulty: number;
  status: QuestionStatus;
  questionData: QuestionData;
  fact: string;
  factSource: string;
  factSourceUrl: string | null;
  illustrationUrl: string | null;
  illustrationPrompt: string | null;
  timesShown: number;
  timesCorrect: number;
  avgTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionWithCategory = Question & {
  category: {
    id: string;
    name: string;
    nameEn: string;
    slug: string;
  };
};
