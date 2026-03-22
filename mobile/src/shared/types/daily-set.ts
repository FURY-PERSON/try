export type DailySetQuestion = {
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
  language: string;
  categoryId: string;
  difficulty: number;
  illustrationUrl: string | null;
  sortOrder: number;
  category?: {
    name: string;
    nameEn: string;
  };
};

export type DailySetProgress = {
  answeredQuestionIds: string[];
  results: Array<{ questionId: string; correct: boolean }>;
  currentIndex: number;
};

export type DailySetWithQuestions = {
  id: string | null;
  date: string;
  theme: string | null;
  themeEn: string | null;
  status: string;
  factOfDayQuestionId?: string | null;
  questions: DailySetQuestion[];
  completed?: boolean;
  isLocked?: boolean;
  unlocksAt?: string | null;
  userEntry?: {
    score: number;
    correctAnswers: number;
    totalTimeSeconds: number;
  } | null;
  progress?: DailySetProgress | null;
};
