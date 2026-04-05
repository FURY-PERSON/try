import type { AxiosInstance } from 'axios';
import type {
  Question,
  QuestionWithCategory,
  DailySet,
  DailySetWithQuestions,
  Category,
  Collection,
  CollectionWithItems,
  ApiResponse,
  PaginatedResponse,
  SupportTicket,
} from '../../shared';
import type {
  LoginDto,
  RefreshTokenDto,
  AuthTokens,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionQueryDto,
  CreateDailySetDto,
  UpdateDailySetDto,
  DailySetQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionQueryDto,
  GenerateQuestionsDto,
  GenerateIllustrationDto,
  GenerateQuestionsResult,
  GenerateIllustrationResult,
  SimilarQuestion,
  DashboardStats,
  UserAnalytics,
  QuestionStats,
  UploadResult,
  SendNotificationDto,
  SendNotificationResult,
  NotificationHistoryResponse,
  NicknameAdjective,
  CreateAdjectiveDto,
  UpdateAdjectiveDto,
  NicknameAnimal,
  CreateAnimalDto,
  UpdateAnimalDto,
  AvatarEmojiItem,
  CreateEmojiDto,
  UpdateEmojiDto,
  FeatureFlag,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from '../types';

export function createAdminEndpoints(http: AxiosInstance) {
  return {
    // ── Auth ──
    auth: {
      login(dto: LoginDto) {
        return http.post<ApiResponse<AuthTokens>>('/api/admin/auth/login', dto);
      },
      refresh(dto: RefreshTokenDto) {
        return http.post<ApiResponse<{ accessToken: string }>>('/api/admin/auth/refresh', dto);
      },
    },

    // ── Questions ──
    questions: {
      list(params?: QuestionQueryDto) {
        return http.get<PaginatedResponse<QuestionWithCategory>>('/api/admin/questions', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<QuestionWithCategory>>(`/api/admin/questions/${id}`);
      },
      create(dto: CreateQuestionDto) {
        return http.post<ApiResponse<Question>>('/api/admin/questions', dto);
      },
      update(id: string, dto: UpdateQuestionDto) {
        return http.patch<ApiResponse<Question>>(`/api/admin/questions/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/questions/${id}`);
      },
      approve(id: string) {
        return http.patch<ApiResponse<Question>>(`/api/admin/questions/${id}/approve`);
      },
      reject(id: string) {
        return http.patch<ApiResponse<Question>>(`/api/admin/questions/${id}/reject`);
      },
      bulkApprove(ids: string[]) {
        return http.post<ApiResponse<{ approved: number }>>('/api/admin/questions/bulk-approve', {
          ids,
        });
      },
      bulkReject(ids: string[]) {
        return http.post<ApiResponse<{ rejected: number }>>('/api/admin/questions/bulk-reject', {
          ids,
        });
      },
      bulkDelete(ids: string[]) {
        return http.post<ApiResponse<{ deleted: number }>>('/api/admin/questions/bulk-delete', {
          ids,
        });
      },
      similar(params: { q: string; limit?: number; excludeId?: string }) {
        return http.get<ApiResponse<SimilarQuestion[]>>('/api/admin/questions/similar', { params });
      },
    },

    // ── Daily Sets ──
    dailySets: {
      list(params?: DailySetQueryDto) {
        return http.get<PaginatedResponse<DailySet>>('/api/admin/daily-sets', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<DailySetWithQuestions>>(`/api/admin/daily-sets/${id}`);
      },
      create(dto: CreateDailySetDto) {
        return http.post<ApiResponse<DailySet>>('/api/admin/daily-sets', dto);
      },
      update(id: string, dto: UpdateDailySetDto) {
        return http.patch<ApiResponse<DailySet>>(`/api/admin/daily-sets/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/daily-sets/${id}`);
      },
    },

    // ── Categories ──
    categories: {
      list() {
        return http.get<ApiResponse<Category[]>>('/api/admin/categories');
      },
      create(dto: CreateCategoryDto) {
        return http.post<ApiResponse<Category>>('/api/admin/categories', dto);
      },
      update(id: string, dto: UpdateCategoryDto) {
        return http.patch<ApiResponse<Category>>(`/api/admin/categories/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/categories/${id}`);
      },
    },

    // ── Collections ──
    collections: {
      list(params?: CollectionQueryDto) {
        return http.get<PaginatedResponse<Collection>>('/api/admin/collections', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<CollectionWithItems>>(`/api/admin/collections/${id}`);
      },
      create(dto: CreateCollectionDto) {
        return http.post<ApiResponse<Collection>>('/api/admin/collections', dto);
      },
      update(id: string, dto: UpdateCollectionDto) {
        return http.patch<ApiResponse<Collection>>(`/api/admin/collections/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/collections/${id}`);
      },
    },

    // ── Stats ──
    stats: {
      getDashboard() {
        return http.get<ApiResponse<DashboardStats>>('/api/admin/stats/dashboard');
      },
      getQuestions() {
        return http.get<ApiResponse<QuestionStats>>('/api/admin/stats/questions');
      },
      getUserAnalytics() {
        return http.get<ApiResponse<UserAnalytics>>('/api/admin/stats/user-analytics');
      },
    },

    // ── AI ──
    ai: {
      generateQuestions(dto: GenerateQuestionsDto) {
        return http.post<ApiResponse<GenerateQuestionsResult>>(
          '/api/admin/ai/generate-questions',
          dto,
        );
      },
      generateIllustration(dto: GenerateIllustrationDto) {
        return http.post<ApiResponse<GenerateIllustrationResult>>(
          '/api/admin/ai/generate-illustration',
          dto,
        );
      },
    },

    // ── Reference: Adjectives ──
    adjectives: {
      list() {
        return http.get<ApiResponse<NicknameAdjective[]>>('/api/admin/reference/adjectives');
      },
      create(dto: CreateAdjectiveDto) {
        return http.post<ApiResponse<NicknameAdjective>>('/api/admin/reference/adjectives', dto);
      },
      update(id: string, dto: UpdateAdjectiveDto) {
        return http.patch<ApiResponse<NicknameAdjective>>(`/api/admin/reference/adjectives/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/reference/adjectives/${id}`);
      },
    },

    // ── Reference: Animals ──
    animals: {
      list() {
        return http.get<ApiResponse<NicknameAnimal[]>>('/api/admin/reference/animals');
      },
      create(dto: CreateAnimalDto) {
        return http.post<ApiResponse<NicknameAnimal>>('/api/admin/reference/animals', dto);
      },
      update(id: string, dto: UpdateAnimalDto) {
        return http.patch<ApiResponse<NicknameAnimal>>(`/api/admin/reference/animals/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/reference/animals/${id}`);
      },
    },

    // ── Reference: Emojis ──
    emojis: {
      list() {
        return http.get<ApiResponse<AvatarEmojiItem[]>>('/api/admin/reference/emojis');
      },
      create(dto: CreateEmojiDto) {
        return http.post<ApiResponse<AvatarEmojiItem>>('/api/admin/reference/emojis', dto);
      },
      update(id: string, dto: UpdateEmojiDto) {
        return http.patch<ApiResponse<AvatarEmojiItem>>(`/api/admin/reference/emojis/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/api/admin/reference/emojis/${id}`);
      },
    },

    // ── Notifications ──
    notifications: {
      send(dto: SendNotificationDto) {
        return http.post<ApiResponse<SendNotificationResult>>(
          '/api/admin/notifications/send',
          dto,
        );
      },
      history(params?: { page?: number; limit?: number }) {
        return http.get<ApiResponse<NotificationHistoryResponse>>(
          '/api/admin/notifications/history',
          { params },
        );
      },
    },

    // ── Upload ──
    upload: {
      image(file: File | Blob) {
        const formData = new FormData();
        formData.append('file', file);
        return http.post<ApiResponse<UploadResult>>('/api/admin/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      },
    },

    // ── Support ──
    support: {
      list(params?: { page?: number; limit?: number; status?: string }) {
        return http.get<PaginatedResponse<SupportTicket>>('/api/admin/support', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<SupportTicket>>(`/api/admin/support/${id}`);
      },
      update(id: string, dto: { status: 'open' | 'closed' }) {
        return http.patch<ApiResponse<SupportTicket>>(`/api/admin/support/${id}`, dto);
      },
    },

    // ── Logs ──
    logs: {
      list(params?: { page?: number; limit?: number; type?: string }) {
        return http.get<PaginatedResponse<{ id: string; type: string; message: string; meta: Record<string, unknown> | null; deviceId: string | null; createdAt: string }>>('/api/admin/logs', { params });
      },
      types() {
        return http.get<ApiResponse<{ type: string; count: number }[]>>('/api/admin/logs/types');
      },
    },

    // ── Game Config ──
    gameConfig: {
      getStreakBonus() {
        return http.get<ApiResponse<{ enabled: boolean; tiers: { minStreak: number; bonusPercent: number }[] }>>('/api/admin/game-config/streak-bonus');
      },
      updateStreakBonus(dto: { enabled: boolean; tiers: { minStreak: number; bonusPercent: number }[] }) {
        return http.put<ApiResponse<{ enabled: boolean; tiers: { minStreak: number; bonusPercent: number }[] }>>('/api/admin/game-config/streak-bonus', dto);
      },
    },

    // ── Feature Flags ──
    featureFlags: {
      list() {
        return http.get<ApiResponse<FeatureFlag[]>>('/api/admin/feature-flags');
      },
      getByKey(key: string) {
        return http.get<ApiResponse<FeatureFlag>>(`/api/admin/feature-flags/${key}`);
      },
      create(dto: CreateFeatureFlagDto) {
        return http.post<ApiResponse<FeatureFlag>>('/api/admin/feature-flags', dto);
      },
      update(key: string, dto: UpdateFeatureFlagDto) {
        return http.patch<ApiResponse<FeatureFlag>>(`/api/admin/feature-flags/${key}`, dto);
      },
      toggle(key: string) {
        return http.patch<ApiResponse<FeatureFlag>>(`/api/admin/feature-flags/${key}/toggle`);
      },
      delete(key: string) {
        return http.delete<void>(`/api/admin/feature-flags/${key}`);
      },
    },
  };
}
