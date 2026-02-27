import type { AxiosInstance } from 'axios';
import type {
  Question,
  QuestionWithCategory,
  DailySet,
  DailySetWithQuestions,
  Category,
  Collection,
  CollectionWithQuestions,
  ApiResponse,
  PaginatedResponse,
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
} from '../types';

export function createAdminEndpoints(http: AxiosInstance) {
  return {
    // ── Auth ──
    auth: {
      login(dto: LoginDto) {
        return http.post<ApiResponse<AuthTokens>>('/admin/auth/login', dto);
      },
      refresh(dto: RefreshTokenDto) {
        return http.post<ApiResponse<{ accessToken: string }>>('/admin/auth/refresh', dto);
      },
    },

    // ── Questions ──
    questions: {
      list(params?: QuestionQueryDto) {
        return http.get<PaginatedResponse<QuestionWithCategory>>('/admin/questions', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<QuestionWithCategory>>(`/admin/questions/${id}`);
      },
      create(dto: CreateQuestionDto) {
        return http.post<ApiResponse<Question>>('/admin/questions', dto);
      },
      update(id: string, dto: UpdateQuestionDto) {
        return http.patch<ApiResponse<Question>>(`/admin/questions/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/questions/${id}`);
      },
      approve(id: string) {
        return http.patch<ApiResponse<Question>>(`/admin/questions/${id}/approve`);
      },
      reject(id: string) {
        return http.patch<ApiResponse<Question>>(`/admin/questions/${id}/reject`);
      },
      bulkApprove(ids: string[]) {
        return http.post<ApiResponse<{ approved: number }>>('/admin/questions/bulk-approve', {
          ids,
        });
      },
      bulkReject(ids: string[]) {
        return http.post<ApiResponse<{ rejected: number }>>('/admin/questions/bulk-reject', {
          ids,
        });
      },
      bulkDelete(ids: string[]) {
        return http.post<ApiResponse<{ deleted: number }>>('/admin/questions/bulk-delete', {
          ids,
        });
      },
    },

    // ── Daily Sets ──
    dailySets: {
      list(params?: DailySetQueryDto) {
        return http.get<PaginatedResponse<DailySet>>('/admin/daily-sets', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<DailySetWithQuestions>>(`/admin/daily-sets/${id}`);
      },
      create(dto: CreateDailySetDto) {
        return http.post<ApiResponse<DailySet>>('/admin/daily-sets', dto);
      },
      update(id: string, dto: UpdateDailySetDto) {
        return http.patch<ApiResponse<DailySet>>(`/admin/daily-sets/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/daily-sets/${id}`);
      },
    },

    // ── Categories ──
    categories: {
      list() {
        return http.get<ApiResponse<Category[]>>('/admin/categories');
      },
      create(dto: CreateCategoryDto) {
        return http.post<ApiResponse<Category>>('/admin/categories', dto);
      },
      update(id: string, dto: UpdateCategoryDto) {
        return http.patch<ApiResponse<Category>>(`/admin/categories/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/categories/${id}`);
      },
    },

    // ── Collections ──
    collections: {
      list(params?: CollectionQueryDto) {
        return http.get<PaginatedResponse<Collection>>('/admin/collections', { params });
      },
      getById(id: string) {
        return http.get<ApiResponse<CollectionWithQuestions>>(`/admin/collections/${id}`);
      },
      create(dto: CreateCollectionDto) {
        return http.post<ApiResponse<Collection>>('/admin/collections', dto);
      },
      update(id: string, dto: UpdateCollectionDto) {
        return http.patch<ApiResponse<Collection>>(`/admin/collections/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/collections/${id}`);
      },
    },

    // ── Stats ──
    stats: {
      getDashboard() {
        return http.get<ApiResponse<DashboardStats>>('/admin/stats/dashboard');
      },
      getQuestions() {
        return http.get<ApiResponse<QuestionStats>>('/admin/stats/questions');
      },
      getUserAnalytics() {
        return http.get<ApiResponse<UserAnalytics>>('/admin/stats/user-analytics');
      },
    },

    // ── AI ──
    ai: {
      generateQuestions(dto: GenerateQuestionsDto) {
        return http.post<ApiResponse<GenerateQuestionsResult>>(
          '/admin/ai/generate-questions',
          dto,
        );
      },
      generateIllustration(dto: GenerateIllustrationDto) {
        return http.post<ApiResponse<GenerateIllustrationResult>>(
          '/admin/ai/generate-illustration',
          dto,
        );
      },
    },

    // ── Reference: Adjectives ──
    adjectives: {
      list() {
        return http.get<ApiResponse<NicknameAdjective[]>>('/admin/reference/adjectives');
      },
      create(dto: CreateAdjectiveDto) {
        return http.post<ApiResponse<NicknameAdjective>>('/admin/reference/adjectives', dto);
      },
      update(id: string, dto: UpdateAdjectiveDto) {
        return http.patch<ApiResponse<NicknameAdjective>>(`/admin/reference/adjectives/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/reference/adjectives/${id}`);
      },
    },

    // ── Reference: Animals ──
    animals: {
      list() {
        return http.get<ApiResponse<NicknameAnimal[]>>('/admin/reference/animals');
      },
      create(dto: CreateAnimalDto) {
        return http.post<ApiResponse<NicknameAnimal>>('/admin/reference/animals', dto);
      },
      update(id: string, dto: UpdateAnimalDto) {
        return http.patch<ApiResponse<NicknameAnimal>>(`/admin/reference/animals/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/reference/animals/${id}`);
      },
    },

    // ── Reference: Emojis ──
    emojis: {
      list() {
        return http.get<ApiResponse<AvatarEmojiItem[]>>('/admin/reference/emojis');
      },
      create(dto: CreateEmojiDto) {
        return http.post<ApiResponse<AvatarEmojiItem>>('/admin/reference/emojis', dto);
      },
      update(id: string, dto: UpdateEmojiDto) {
        return http.patch<ApiResponse<AvatarEmojiItem>>(`/admin/reference/emojis/${id}`, dto);
      },
      delete(id: string) {
        return http.delete(`/admin/reference/emojis/${id}`);
      },
    },

    // ── Notifications ──
    notifications: {
      send(dto: SendNotificationDto) {
        return http.post<ApiResponse<SendNotificationResult>>(
          '/admin/notifications/send',
          dto,
        );
      },
      history(params?: { page?: number; limit?: number }) {
        return http.get<ApiResponse<NotificationHistoryResponse>>(
          '/admin/notifications/history',
          { params },
        );
      },
    },

    // ── Upload ──
    upload: {
      image(file: File | Blob) {
        const formData = new FormData();
        formData.append('file', file);
        return http.post<ApiResponse<UploadResult>>('/admin/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      },
    },
  };
}
