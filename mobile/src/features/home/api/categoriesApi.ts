import { apiClient } from '@/services/api';

export type CategoryDetail = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  descriptionEn: string;
  imageUrl: string | null;
  totalCount: number;
  availableCount: number;
  lastResult: {
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string;
  } | null;
};

export const categoriesApi = {
  async getById(id: string): Promise<CategoryDetail> {
    const response = await apiClient.get<{ data: CategoryDetail }>(
      `/v1/categories/${id}`,
    );
    return response.data.data;
  },
};
