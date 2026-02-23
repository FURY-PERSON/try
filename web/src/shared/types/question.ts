import type { QuestionStatus } from '../constants/question-status';
import type { Language } from '../constants/languages';

export type Question = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl: string | null;
  language: Language;
  categoryId: string;
  difficulty: number;
  status: QuestionStatus;
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
  categories?: {
    id: string;
    category: {
      id: string;
      name: string;
      nameEn: string;
      icon: string;
    };
  }[];
};
