import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle, XCircle, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DIFFICULTY_OPTIONS, IS_TRUE_OPTIONS } from '@/shared';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SimilarQuestions } from '@/components/SimilarQuestions';

const editFormSchema = z.object({
  statement: z.string().min(10, 'Минимум 10 символов'),
  statementEn: z.string().optional(),
  isTrue: z.enum(['true', 'false']),
  explanation: z.string().min(10, 'Минимум 10 символов'),
  explanationEn: z.string().optional(),
  source: z.string().min(1, 'Введите источник'),
  sourceEn: z.string().optional(),
  sourceUrl: z.union([z.string().url('Некорректный URL'), z.literal('')]).optional(),
  sourceUrlEn: z.union([z.string().url('Некорректный URL'), z.literal('')]).optional(),
  categoryId: z.string().min(1, 'Выберите категорию'),
  difficulty: z.coerce.number().min(1).max(5),
});

type EditFormData = z.infer<typeof editFormSchema>;

type RandomModerationModalProps = {
  open: boolean;
  onClose: () => void;
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export function RandomModerationModal({ open, onClose }: RandomModerationModalProps) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  // Total count query (limit=1 just to get meta.total)
  const { data: countData } = useQuery({
    queryKey: ['admin', 'questions', 'moderation-count'],
    queryFn: () => api.admin.questions.list({ status: 'moderation' as any, limit: 1, page: 1 }),
    enabled: open,
    staleTime: 0,
  });
  const totalOnModeration = countData?.data.meta?.total ?? 0;

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
    enabled: open,
  });
  const categories = categoriesData?.data.data ?? [];

  // Fetch ~5 random-page items per category to ensure diversity
  const categoryQueries = useQueries({
    queries: categories.map((cat: any) => {
      const catTotal = 9999; // upper bound; we just pick a random page each session
      const perCat = 5;
      const maxPage = Math.max(1, Math.floor(catTotal / perCat));
      const randomPage = Math.floor(Math.random() * Math.min(maxPage, 20)) + 1;
      return {
        queryKey: ['admin', 'questions', 'moderation-cat', cat.id],
        queryFn: () =>
          api.admin.questions.list({
            status: 'moderation' as any,
            categoryId: cat.id,
            limit: perCat,
            page: randomPage,
          }),
        enabled: open && categories.length > 0,
        staleTime: 0,
      };
    }),
  });

  const isLoadingQuestions =
    categories.length === 0 || categoryQueries.some((q) => q.isLoading);

  const combinedQuestions = useMemo(() => {
    if (categoryQueries.some((q) => q.isLoading)) return [];
    const seen = new Set<string>();
    const all = categoryQueries.flatMap((q) => q.data?.data.data ?? []);
    return all.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }, [categoryQueries]);

  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      setShuffledQuestions([]);
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Only initialise once — ignore re-fetches triggered by invalidation after approve/reject
    setShuffledQuestions((prev) => {
      if (prev.length > 0) return prev;
      return combinedQuestions.length > 0 ? shuffleArray(combinedQuestions) : prev;
    });
  }, [open, combinedQuestions]);

  const currentQuestion = shuffledQuestions[currentIndex] ?? null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    if (!currentQuestion) return;
    const existingAdditional = (currentQuestion.categories ?? [])
      .filter((qc: any) => qc.categoryId !== currentQuestion.categoryId)
      .map((qc: any) => qc.categoryId);
    setAdditionalCategoryIds(existingAdditional);
    reset({
      statement: currentQuestion.statement,
      statementEn: currentQuestion.statementEn ?? '',
      isTrue: currentQuestion.isTrue ? 'true' : 'false',
      explanation: currentQuestion.explanation,
      explanationEn: currentQuestion.explanationEn ?? '',
      source: currentQuestion.source,
      sourceEn: currentQuestion.sourceEn ?? '',
      sourceUrl: currentQuestion.sourceUrl ?? '',
      sourceUrlEn: currentQuestion.sourceUrlEn ?? '',
      categoryId: currentQuestion.categoryId,
      difficulty: currentQuestion.difficulty,
    });
  }, [currentQuestion, reset]);

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: EditFormData }) =>
      api.admin.questions.update(id, {
        statement: dto.statement,
        statementEn: dto.statementEn || undefined,
        isTrue: dto.isTrue === 'true',
        explanation: dto.explanation,
        explanationEn: dto.explanationEn || undefined,
        source: dto.source,
        sourceEn: dto.sourceEn || undefined,
        sourceUrl: dto.sourceUrl || undefined,
        sourceUrlEn: dto.sourceUrlEn || undefined,
        language: 'ru',
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        categoryIds: additionalCategoryIds.length > 0 ? additionalCategoryIds : undefined,
      }),
    onError: () => toast.error('Ошибка обновления'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.admin.questions.approve(id),
    onSuccess: () => {
      toast.success('Одобрено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка одобрения'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.admin.questions.reject(id),
    onSuccess: () => {
      toast.success('Отклонено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка отклонения'),
  });

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= shuffledQuestions.length) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, shuffledQuestions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.questions.delete(id),
    onSuccess: () => {
      toast.success('Удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      goNext();
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const handleApprove = useCallback(() => {
    if (!currentQuestion) return;
    const id = currentQuestion.id;
    void handleSubmit(async (data) => {
      try {
        await updateMutation.mutateAsync({ id, dto: data });
      } catch {
        return;
      }
      await approveMutation.mutateAsync(id);
      goNext();
    })();
  }, [currentQuestion, handleSubmit, updateMutation, approveMutation, goNext]);

  const handleReject = useCallback(() => {
    if (!currentQuestion) return;
    const id = currentQuestion.id;
    void handleSubmit(async (data) => {
      try {
        await updateMutation.mutateAsync({ id, dto: data });
      } catch {
        return;
      }
      await rejectMutation.mutateAsync(id);
      goNext();
    })();
  }, [currentQuestion, handleSubmit, updateMutation, rejectMutation, goNext]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isPending =
    updateMutation.isPending || approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  const statementValue = watch('statement') ?? '';

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 gap-4">
      {/* Reject button */}
      <button
        onClick={handleReject}
        disabled={isPending || done || !currentQuestion}
        className="flex-shrink-0 w-24 h-40 lg:w-32 lg:h-48 rounded-2xl bg-red/40 border-2 border-red text-red flex flex-col items-center justify-center gap-3 hover:bg-red/55 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <XCircle className="w-8 h-8 lg:w-10 lg:h-10" />
        <span className="font-semibold text-sm lg:text-base">Отклонить</span>
      </button>

      {/* Modal card */}
      <div
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-text-primary">Модерация</h2>
            {shuffledQuestions.length > 0 && !done && (
              <span className="text-sm text-text-secondary">
                {currentIndex + 1} из {shuffledQuestions.length}
              </span>
            )}
            {totalOnModeration > 0 && (
              <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">
                всего на модерации: {totalOnModeration}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <button
                onClick={goPrev}
                disabled={isPending}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {!done && currentQuestion && (
              <button
                onClick={goNext}
                disabled={isPending}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-40"
                title="Пропустить"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {!done && currentQuestion && (
              <button
                onClick={() => {
                  if (confirm('Удалить утверждение?')) {
                    deleteMutation.mutate(currentQuestion.id);
                  }
                }}
                disabled={isPending}
                className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors disabled:opacity-40"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {shuffledQuestions.length > 0 && (
          <div className="h-1 bg-surface-secondary flex-shrink-0">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentIndex + (done ? 1 : 0)) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingQuestions ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : done ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-semibold text-text-primary">Модерация завершена!</p>
              <p className="text-sm text-text-secondary">
                Обработано {shuffledQuestions.length} утверждений
              </p>
              <Button onClick={onClose} className="mt-2">
                Закрыть
              </Button>
            </div>
          ) : shuffledQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-base font-medium text-text-primary">Нет утверждений на модерации</p>
              <Button variant="secondary" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          ) : currentQuestion ? (
            <form className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                  id="mod-statement"
                  label="Текст утверждения (RU)"
                  rows={3}
                  error={errors.statement?.message}
                  {...register('statement')}
                />
                <Textarea
                  id="mod-statementEn"
                  label="Statement (EN)"
                  rows={3}
                  error={errors.statementEn?.message}
                  {...register('statementEn')}
                />
              </div>
              <SimilarQuestions
                statement={statementValue}
                excludeId={currentQuestion.id}
              />
              <Select
                id="mod-isTrue"
                label="Факт или Фейк?"
                options={IS_TRUE_OPTIONS}
                error={errors.isTrue?.message}
                {...register('isTrue')}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                  id="mod-explanation"
                  label="Объяснение (RU)"
                  rows={10}
                  error={errors.explanation?.message}
                  {...register('explanation')}
                />
                <Textarea
                  id="mod-explanationEn"
                  label="Explanation (EN)"
                  rows={10}
                  error={errors.explanationEn?.message}
                  {...register('explanationEn')}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  id="mod-source"
                  label="Источник (RU)"
                  error={errors.source?.message}
                  {...register('source')}
                />
                <Input
                  id="mod-sourceEn"
                  label="Source (EN)"
                  error={errors.sourceEn?.message}
                  {...register('sourceEn')}
                />
                <Input
                  id="mod-sourceUrl"
                  label="URL источника (RU)"
                  error={errors.sourceUrl?.message}
                  {...register('sourceUrl')}
                />
                <Input
                  id="mod-sourceUrlEn"
                  label="Source URL (EN)"
                  error={errors.sourceUrlEn?.message}
                  {...register('sourceUrlEn')}
                />
              </div>
              <Select
                id="mod-difficulty"
                label="Сложность"
                options={DIFFICULTY_OPTIONS}
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
              <Select
                id="mod-categoryId"
                label="Основная категория"
                options={categories.map((c: any) => ({
                  value: c.id,
                  label: `${c.icon} ${c.name}`,
                }))}
                error={errors.categoryId?.message}
                {...register('categoryId')}
              />
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Дополнительные категории
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleAdditionalCategory(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          additionalCategoryIds.includes(c.id)
                            ? 'bg-blue/10 border-blue text-blue'
                            : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
                        }`}
                      >
                        {c.icon} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : null}
        </div>
      </div>

      {/* Approve button */}
      <button
        onClick={handleApprove}
        disabled={isPending || done || !currentQuestion}
        className="flex-shrink-0 w-24 h-40 lg:w-32 lg:h-48 rounded-2xl bg-green-500/40 border-2 border-green-500 text-green-700 flex flex-col items-center justify-center gap-3 hover:bg-green-500/55 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <CheckCircle className="w-8 h-8 lg:w-10 lg:h-10" />
        <span className="font-semibold text-sm lg:text-base">Одобрить</span>
      </button>
    </div>,
    document.body,
  );
}
