export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error: string;
};
