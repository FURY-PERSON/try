import type { QuestionStatus } from '../constants/question-status';
import type { Language } from '../constants/languages';

export type Question = {
  id: string;
  statement: string;
  statementEn: string;
  isTrue: boolean;
  explanation: string;
  explanationEn: string;
  source: string;
  sourceEn: string;
  sourceUrl: string | null;
  sourceUrlEn: string | null;
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
};
