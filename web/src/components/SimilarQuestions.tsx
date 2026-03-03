import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import type { SimilarQuestion } from '@/api-client/types';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

type SimilarQuestionsProps = {
  statement: string;
  excludeId?: string;
};

export function SimilarQuestions({ statement, excludeId }: SimilarQuestionsProps) {
  const trimmed = statement.trim();
  const debouncedStatement = useDebouncedValue(trimmed, 300);

  const { data } = useQuery({
    queryKey: ['admin', 'questions', 'similar', debouncedStatement, excludeId],
    queryFn: () =>
      api.admin.questions.similar({
        q: debouncedStatement,
        limit: 10,
        excludeId,
      }),
    enabled: debouncedStatement.length >= 10,
    staleTime: 30_000,
  });

  const results: SimilarQuestion[] = data?.data.data ?? [];

  if (debouncedStatement.length < 10 || results.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-orange/30 bg-orange/5 p-3">
      <p className="text-xs font-medium text-orange mb-2">
        Найдены похожие утверждения ({results.length})
      </p>
      <div className="space-y-2">
        {results.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-start gap-2">
            <Badge
              variant={
                item.similarity >= 60
                  ? 'danger'
                  : item.similarity >= 35
                    ? 'warning'
                    : 'default'
              }
              className="flex-shrink-0 mt-0.5"
            >
              {item.similarity}%
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary line-clamp-2">{item.statement}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.categoryIcon && item.categoryName && (
                  <span className="text-xs text-text-secondary">
                    {item.categoryIcon} {item.categoryName}
                  </span>
                )}
                <span className="text-xs text-text-secondary">
                  {item.type === 'question' ? 'Вопрос' : 'Подборка'}
                </span>
                {item.status && (
                  <span className="text-xs text-text-secondary">
                    ({item.status})
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
