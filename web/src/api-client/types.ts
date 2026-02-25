import type {
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
  userAnswer: boolean;
  timeSpentSeconds: number;
};

export type QuestionFilterDto = {
  language?: Language;
  categoryId?: string;
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
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
  language: Language;
  categoryId: string;
  difficulty: number;
  illustrationUrl?: string;
  illustrationPrompt?: string;
  categoryIds?: string[];
};

export type UpdateQuestionDto = Partial<CreateQuestionDto> & {
  status?: QuestionStatus;
};

export type QuestionQueryDto = {
  page?: number;
  limit?: number;
  isTrue?: string;
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

export type CreateCollectionDto = {
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  type?: 'featured' | 'seasonal' | 'thematic';
  questionIds: string[];
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
};

export type UpdateCollectionDto = Partial<CreateCollectionDto> & {
  status?: 'draft' | 'published';
};

export type CollectionQueryDto = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
};

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
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
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
  hardest: { id: string; correctRate: number }[];
  easiest: { id: string; correctRate: number }[];
  mostShown: { id: string; timesShown: number }[];
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

// ── Reference DTOs ──

export type NicknameAdjective = {
  id: string;
  textRu: string;
  textEn: string;
  isActive: boolean;
};

export type NicknameAnimal = {
  id: string;
  textRu: string;
  textEn: string;
  emoji: string;
  isActive: boolean;
};

export type AvatarEmojiItem = {
  id: string;
  emoji: string;
  category: string;
  isActive: boolean;
};

export type CreateAdjectiveDto = {
  textRu: string;
  textEn: string;
  isActive?: boolean;
};

export type UpdateAdjectiveDto = Partial<CreateAdjectiveDto>;

export type CreateAnimalDto = {
  textRu: string;
  textEn: string;
  emoji: string;
  isActive?: boolean;
};

export type UpdateAnimalDto = Partial<CreateAnimalDto>;

export type CreateEmojiDto = {
  emoji: string;
  category?: string;
  isActive?: boolean;
};

export type UpdateEmojiDto = Partial<CreateEmojiDto>;

// ── Client Options ──

export type ApiClientOptions = {
  deviceId?: string;
  accessToken?: string;
  onTokenExpired?: () => void;
};
