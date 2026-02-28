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
  notInDailySet?: string;
};

export type CreateDailySetDto = {
  date: string;
  theme: string;
  themeEn: string;
  questionIds: string[];
  status?: 'draft' | 'scheduled' | 'published';
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

export type CreateCollectionItemDto = {
  statement: string;
  isTrue: boolean;
  explanation: string;
  source?: string;
  sourceUrl?: string;
  difficulty?: number;
  language?: string;
  sortOrder?: number;
};

export type CreateCollectionDto = {
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  type?: 'featured' | 'seasonal' | 'thematic';
  items: CreateCollectionItemDto[];
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
};

export type UpdateCollectionDto = Partial<Omit<CreateCollectionDto, 'items'>> & {
  items?: CreateCollectionItemDto[];
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

export type CategoryQuestionCount = {
  categoryId: string;
  categoryName: string;
  icon: string;
  count: number;
};

export type DifficultyCount = {
  difficulty: number;
  count: number;
};

export type DashboardStats = {
  totalUsers: number;
  activeToday: number;
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  totalDailySets: number;
  publishedSets: number;
  questionsByCategory: CategoryQuestionCount[];
  questionsByDifficulty: DifficultyCount[];
};

export type DateCount = {
  date: string;
  count: number;
};

export type TopPlayer = {
  id: string;
  nickname: string | null;
  avatarEmoji: string | null;
  totalScore: number;
  totalCorrectAnswers: number;
  totalGamesPlayed: number;
  bestAnswerStreak: number;
};

export type UserAnalytics = {
  dau: DateCount[];
  newUsers: DateCount[];
  topPlayers: TopPlayer[];
  overallAccuracy: number;
  totalAnswers: number;
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

// ── Notifications ──

export type SendNotificationDto = {
  title: string;
  body: string;
  target?: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  target: string;
  totalSent: number;
  totalFailed: number;
  status: string;
  createdAt: string;
};

export type SendNotificationResult = {
  sent: number;
  failed: number;
  total: number;
  notificationId: string;
};

export type NotificationHistoryResponse = {
  items: NotificationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ── Feature Flags ──

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  payload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeatureFlagDto = {
  key: string;
  name: string;
  description?: string;
  isEnabled?: boolean;
  payload?: Record<string, unknown>;
};

export type UpdateFeatureFlagDto = {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  payload?: Record<string, unknown>;
};

// ── Client Options ──

export type ApiClientOptions = {
  deviceId?: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefreshed?: (accessToken: string) => void;
  onTokenExpired?: () => void;
};
