import type { DailySetStatus } from '../constants/daily-set-status';
import type { Question } from './question';

export type DailySet = {
  id: string;
  date: string;
  theme: string;
  themeEn: string;
  status: DailySetStatus;
  createdAt: string;
  updatedAt: string;
};

export type DailySetWithQuestions = DailySet & {
  questions: {
    sortOrder: number;
    question: Question;
  }[];
};
