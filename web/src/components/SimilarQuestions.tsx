import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { SimilarQuestionDialog } from '@/components/SimilarQuestionDialog';
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
  const queryClient = useQueryClient();
  const trimmed = statement.trim();
  const debouncedStatement = useDebouncedValue(trimmed, 300);
  const [selectedItem, setSelectedItem] = useState<SimilarQuestion | null>(null);

  const { data, isFetching } = useQuery({
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
  const isEnabled = trimmed.length >= 10;
  // True while debounce hasn't fired yet or a network request is in flight
  const isSearching = trimmed !== debouncedStatement || isFetching;

  if (!isEnabled) return null;

  if (isSearching) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-3 flex items-center gap-2">
        <div className="animate-spin h-3.5 w-3.5 border-b-2 border-text-secondary rounded-full flex-shrink-0" />
        <p className="text-xs text-text-secondary">Поиск похожих утверждений...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-3">
        <p className="text-xs text-text-secondary">Совпадения не найдены</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-orange/30 bg-orange/5 p-3">
      <p className="text-xs font-medium text-orange mb-2">
        Найдены похожие утверждения ({results.length})
      </p>
      <div className="space-y-2">
        {results.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-start gap-2 cursor-pointer hover:bg-orange/10 rounded-lg transition-colors p-1 -m-1"
            onClick={() => setSelectedItem(item)}
          >
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
      <SimilarQuestionDialog
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'questions', 'similar'] });
        }}
      />
    </div>
  );
}
