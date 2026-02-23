export type DailySetQuestion = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl: string | null;
  language: string;
  categoryId: string;
  difficulty: number;
  illustrationUrl: string | null;
  sortOrder: number;
  category?: {
    id: string;
    name: string;
    nameEn: string;
    slug: string;
  };
};

export type DailySetWithQuestions = {
  id: string | null;
  date: string;
  theme: string | null;
  themeEn: string | null;
  status: string;
  questions: DailySetQuestion[];
  completed?: boolean;
  isLocked?: boolean;
  unlocksAt?: string | null;
  userEntry?: {
    score: number;
    correctAnswers: number;
    totalTimeSeconds: number;
  } | null;
};
