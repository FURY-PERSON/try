import type { AxiosInstance } from 'axios';
import type {
  Question,
  QuestionWithCategory,
  DailySet,
  DailySetWithQuestions,
  Category,
  ApiResponse,
  PaginatedResponse,
} from '@wordpulse/shared';
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
  GenerateQuestionsDto,
  GenerateIllustrationDto,
  GenerateQuestionsResult,
  GenerateIllustrationResult,
  DashboardStats,
  QuestionStats,
  UploadResult,
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

    // ── Stats ──
    stats: {
      getDashboard() {
        return http.get<ApiResponse<DashboardStats>>('/admin/stats/dashboard');
      },
      getQuestions() {
        return http.get<ApiResponse<QuestionStats>>('/admin/stats/questions');
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
