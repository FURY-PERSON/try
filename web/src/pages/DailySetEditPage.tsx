import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CARDS_PER_DAILY_SET } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

const editSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  theme: z.string().min(1, 'Введите тему'),
  themeEn: z.string().min(1, 'Введите тему (EN)'),
  status: z.enum(['draft', 'scheduled', 'published']),
});

type EditFormData = z.infer<typeof editSchema>;

import { IS_TRUE_FILTER_OPTIONS } from '@/shared';

export function DailySetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrueFilter, setIsTrueFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [usedFilter, setUsedFilter] = useState<'new' | 'all'>('new');

  const { data: setData, isLoading: setLoading } = useQuery({
    queryKey: ['admin', 'daily-sets', id],
    queryFn: () => api.admin.dailySets.getById(id!),
    enabled: !!id,
  });

  // TODO: W-8 — Implement server-side search with pagination instead of loading 500 questions at once
  const { data: questionsData } = useQuery({
    queryKey: ['admin', 'questions', { status: 'approved', limit: 500, notInDailySet: usedFilter === 'new' ? 'true' : undefined }],
    queryFn: () => api.admin.questions.list({
      status: 'approved',
      limit: 500,
      notInDailySet: usedFilter === 'new' ? 'true' : undefined,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });

  const dailySet = setData?.data.data;
  const approvedQuestions = questionsData?.data.data ?? [];
  const categories = categoriesData?.data.data ?? [];

  // Combine approved questions with already-selected questions from the daily set
  const allKnownQuestions = [...approvedQuestions];
  if (dailySet?.questions) {
    for (const dsq of dailySet.questions) {
      if (!allKnownQuestions.find((q: any) => q.id === (dsq as any).question?.id)) {
        allKnownQuestions.push((dsq as any).question);
      }
    }
  }

  const filteredQuestions = useMemo(
    () => allKnownQuestions
      .filter((q: any) => q && !selectedQuestionIds.includes(q.id))
      .filter((q: any) => !searchQuery || q.statement?.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((q: any) => !isTrueFilter || String(q.isTrue) === isTrueFilter)
      .filter((q: any) => !categoryFilter || q.categoryId === categoryFilter || q.category?.id === categoryFilter),
    [allKnownQuestions, selectedQuestionIds, searchQuery, isTrueFilter, categoryFilter],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: 'draft',
    },
  });

  useEffect(() => {
    if (dailySet) {
      reset({
        date: dailySet.date.split('T')[0],
        theme: dailySet.theme,
        themeEn: dailySet.themeEn,
        status: dailySet.status as 'draft' | 'scheduled' | 'published',
      });
      setSelectedQuestionIds(
        dailySet.questions.map((dsq: any) => dsq.question?.id ?? dsq.questionId),
      );
    }
  }, [dailySet, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      api.admin.dailySets.update(id!, {
        ...data,
        questionIds: selectedQuestionIds,
      }),
    onSuccess: () => {
      toast.success('Набор обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-sets'] });
      navigate('/daily-sets');
    },
    onError: () => toast.error('Ошибка обновления набора'),
  });

  const onSubmit = (data: EditFormData) => {
    if (selectedQuestionIds.length !== CARDS_PER_DAILY_SET) {
      toast.error(`Необходимо выбрать ровно ${CARDS_PER_DAILY_SET} утверждений`);
      return;
    }
    updateMutation.mutate(data);
  };

  const addQuestion = (qId: string) => {
    if (selectedQuestionIds.length >= CARDS_PER_DAILY_SET) return;
    if (selectedQuestionIds.includes(qId)) return;
    setSelectedQuestionIds((prev) => [...prev, qId]);
  };

  const removeQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) => prev.filter((id) => id !== qId));
  };

  if (setLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!dailySet) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Набор не найден</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/daily-sets')}>
          К списку наборов
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/daily-sets')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <PageHeader title="Редактировать ежедневный набор" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Основная информация</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Input
              id="date"
              label="Дата"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />
            <Input
              id="theme"
              label="Тема (RU)"
              placeholder="Например: Космос и вселенная"
              error={errors.theme?.message}
              {...register('theme')}
            />
            <Input
              id="themeEn"
              label="Тема (EN)"
              placeholder="e.g. Space and Universe"
              error={errors.themeEn?.message}
              {...register('themeEn')}
            />
            <Select
              id="status"
              label="Статус"
              options={[
                { value: 'draft', label: 'Черновик' },
                { value: 'scheduled', label: 'Запланировать' },
                { value: 'published', label: 'Опубликовать' },
              ]}
              {...register('status')}
            />

            <div className="pt-4">
              <p className="text-sm font-medium text-text-primary mb-2">
                Выбранные утверждения ({selectedQuestionIds.length}/{CARDS_PER_DAILY_SET})
              </p>
              {selectedQuestionIds.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Выберите утверждения из списка справа
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedQuestionIds.map((qId, index) => {
                    const q = allKnownQuestions.find((aq: any) => aq.id === qId);
                    return (
                      <div
                        key={qId}
                        className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono text-text-secondary shrink-0">
                            #{index + 1}
                          </span>
                          <Badge variant={q?.isTrue ? 'success' : 'danger'} className="shrink-0">
                            {q?.isTrue ? 'Факт' : 'Фейк'}
                          </Badge>
                          <span className="text-xs text-text-secondary truncate">
                            {q?.statement?.slice(0, 40) ?? qId.slice(0, 8)}...
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qId)}
                          className="p-1 text-text-secondary hover:text-red transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={updateMutation.isPending}
              disabled={selectedQuestionIds.length !== CARDS_PER_DAILY_SET}
            >
              Сохранить набор
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Одобренные утверждения</CardTitle>

          {/* Used filter */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setUsedFilter('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                usedFilter === 'new'
                  ? 'bg-blue/10 border-blue text-blue'
                  : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              Новые (без набора)
            </button>
            <button
              type="button"
              onClick={() => setUsedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                usedFilter === 'all'
                  ? 'bg-blue/10 border-blue text-blue'
                  : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
              }`}
            >
              Все одобренные
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту..."
              className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-2">
            <select
              value={isTrueFilter}
              onChange={(e) => setIsTrueFilter(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            >
              {IS_TRUE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            >
              <option value="">Все категории</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-text-secondary mt-2">
            Найдено: {filteredQuestions.length}
          </p>

          {/* TODO: W-5 / W-13 — Add virtualization with @tanstack/react-virtual for 500+ item lists */}
          <div className="mt-2 space-y-2 max-h-[500px] overflow-auto">
            {filteredQuestions.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                {approvedQuestions.length === 0 ? 'Нет одобренных утверждений' : 'Ничего не найдено'}
              </p>
            ) : (
              filteredQuestions.map((q: any) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg hover:bg-surface-secondary/80 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={q.isTrue ? 'success' : 'danger'}>
                        {q.isTrue ? 'Факт' : 'Фейк'}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        {q.category?.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary truncate max-w-[250px]">
                      {q.statement?.slice(0, 80)}...
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={selectedQuestionIds.length >= CARDS_PER_DAILY_SET}
                    onClick={() => addQuestion(q.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
