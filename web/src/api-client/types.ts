import type {
  GameType,
  Language,
  QuestionStatus,
  UserLanguagePreference,
} from '../shared';

// ── Request DTOs ──

export type RegisterUserDto = {
  deviceId: string;
};

export type UpdateUserDto = {
  nickname?: string;
  language?: UserLanguagePreference;
  pushToken?: string | null;
  pushEnabled?: boolean;
};

export type AnswerQuestionDto = {
  result: 'correct' | 'incorrect';
  timeSpentSeconds: number;
};

export type QuestionFilterDto = {
  type?: GameType;
  language?: Language;
  categoryId?: string;
  difficulty?: number;
};

export type SubmitDailySetDto = {
  results: {
    questionId: string;
    result: 'correct' | 'incorrect';
    timeSpentSeconds: number;
  }[];
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RefreshTokenDto = {
  refreshToken: string;
};

export type CreateQuestionDto = {
  type: GameType;
  language: Language;
  categoryId: string;
  difficulty: number;
  questionData: Record<string, unknown>;
  fact: string;
  factSource: string;
  factSourceUrl?: string;
  illustrationUrl?: string;
  illustrationPrompt?: string;
};

export type UpdateQuestionDto = Partial<CreateQuestionDto> & {
  status?: QuestionStatus;
};

export type QuestionQueryDto = {
  page?: number;
  limit?: number;
  type?: GameType;
  language?: Language;
  categoryId?: string;
  status?: QuestionStatus;
  difficulty?: number;
  search?: string;
};

export type CreateDailySetDto = {
  date: string;
  theme: string;
  themeEn: string;
  questionIds: string[];
  status?: 'draft' | 'scheduled';
};

export type UpdateDailySetDto = Partial<CreateDailySetDto>;

export type DailySetQueryDto = {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
};

export type CreateCategoryDto = {
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export type GenerateQuestionsDto = {
  category: string;
  difficulty: number;
  language: Language;
  count: number;
  additionalPrompt?: string;
};

export type GenerateIllustrationDto = {
  questionId: string;
  style?: string;
};

// ── Response Types ──

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AnswerResult = {
  correct: boolean;
  score: number;
  fact: string;
  factSource: string;
  factSourceUrl?: string;
};

export type DashboardStats = {
  totalUsers: number;
  activeToday: number;
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  totalDailySets: number;
  publishedSets: number;
};

export type QuestionStats = {
  hardest: { id: string; type: GameType; correctRate: number }[];
  easiest: { id: string; type: GameType; correctRate: number }[];
  mostShown: { id: string; type: GameType; timesShown: number }[];
};

export type GenerateQuestionsResult = {
  generated: number;
  saved: number;
  questions: Record<string, unknown>[];
};

export type GenerateIllustrationResult = {
  question: Record<string, unknown>;
  illustrationUrl: string;
};

export type UploadResult = {
  url: string;
};

// ── Client Options ──

export type ApiClientOptions = {
  deviceId?: string;
  accessToken?: string;
  onTokenExpired?: () => void;
};
