import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, XCircle, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { QUESTION_STATUS, QUESTION_STATUS_LABELS } from '@/shared';
import type { QuestionStatus, Language } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSizeSelect } from '@/components/ui/PageSizeSelect';

const IS_TRUE_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'true', label: 'Факты' },
  { value: 'false', label: 'Фейки' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: QUESTION_STATUS.DRAFT, label: 'Черновик' },
  { value: QUESTION_STATUS.MODERATION, label: 'На модерации' },
  { value: QUESTION_STATUS.APPROVED, label: 'Одобрен' },
  { value: QUESTION_STATUS.REJECTED, label: 'Отклонён' },
];

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  moderation: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Элементарная',
  2: 'Лёгкая',
  3: 'Средняя',
  4: 'Сложная',
  5: 'Экспертная',
};

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Все языки' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Все сложности' },
  { value: '1', label: '1 — Элементарная' },
  { value: '2', label: '2 — Лёгкая' },
  { value: '3', label: '3 — Средняя' },
  { value: '4', label: '4 — Сложная' },
  { value: '5', label: '5 — Экспертная' },
];

export function QuestionsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [isTrueFilter, setIsTrueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });
  const categories = categoriesData?.data.data ?? [];
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Все категории' },
      ...categories.map((c: any) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
    ],
    [categories],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', { page, limit, search, isTrue: isTrueFilter, status: statusFilter, language: languageFilter, difficulty: difficultyFilter, categoryId: categoryFilter }],
    queryFn: () =>
      api.admin.questions.list({
        page,
        limit,
        search: search || undefined,
        isTrue: (isTrueFilter || undefined) as string | undefined,
        status: (statusFilter || undefined) as QuestionStatus | undefined,
        language: (languageFilter || undefined) as Language | undefined,
        difficulty: difficultyFilter ? Number(difficultyFilter) : undefined,
        categoryId: categoryFilter || undefined,
      }),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => api.admin.questions.bulkApprove(ids),
    onSuccess: () => {
      toast.success(`Одобрено: ${selected.length} утверждений`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка при одобрении'),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => api.admin.questions.bulkReject(ids),
    onSuccess: () => {
      toast.success(`Отклонено: ${selected.length} утверждений`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка при отклонении'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.admin.questions.bulkDelete(ids),
    onSuccess: () => {
      toast.success(`Удалено: ${selected.length} утверждений`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => api.admin.questions.delete(id),
    onSuccess: () => {
      toast.success('Утверждение удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const questions = data?.data.data ?? [];
  const meta = data?.data.meta;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === questions.length) {
      setSelected([]);
    } else {
      setSelected(questions.map((q: any) => q.id));
    }
  };

  return (
    <div>
      <PageHeader
        title="Утверждения"
        description={meta ? `Всего: ${meta.total}` : undefined}
        actions={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={bulkApproveMutation.isPending}
                  onClick={() => bulkApproveMutation.mutate(selected)}
                >
                  <CheckCircle className="w-4 h-4" />
                  Одобрить ({selected.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={bulkRejectMutation.isPending}
                  onClick={() => bulkRejectMutation.mutate(selected)}
                >
                  <XCircle className="w-4 h-4" />
                  Отклонить ({selected.length})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={bulkDeleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Удалить ${selected.length} утверждений?`)) {
                      bulkDeleteMutation.mutate(selected);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить ({selected.length})
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate('/questions/create')}>
              <Plus className="w-4 h-4" />
              Добавить
            </Button>
            <Button size="sm" onClick={() => navigate('/questions/generate')}>
              <Plus className="w-4 h-4" />
              Генерировать
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>
          </div>
          <Select
            options={IS_TRUE_OPTIONS}
            value={isTrueFilter}
            onChange={(e) => { setIsTrueFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-44"
          />
          <Select
            options={LANGUAGE_OPTIONS}
            value={languageFilter}
            onChange={(e) => { setLanguageFilter(e.target.value); setPage(1); }}
            className="w-36"
          />
          <Select
            options={DIFFICULTY_OPTIONS}
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="Нет утверждений"
            description="Попробуйте изменить фильтры или сгенерировать новые утверждения с помощью AI"
            action={
              <Button size="sm" onClick={() => navigate('/questions/generate')}>
                Генерировать утверждения
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <div className="py-2.5 px-2.5 -my-2 -mx-2">
                      <input
                        type="checkbox"
                        checked={selected.length === questions.length && questions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </div>
                  </TableHead>
                  <TableHead>Утверждение</TableHead>
                  <TableHead className="w-24">Факт/Фейк</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Сложность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Показов</TableHead>
                  <TableHead>% правильных</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q: any) => {
                  const additionalCategories = q.categories?.filter(
                    (qc: any) => qc.categoryId !== q.categoryId,
                  ) ?? [];
                  return (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/questions/${q.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="py-2.5 px-2.5 -my-2 -mx-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(q.id)}
                            onChange={() => toggleSelect(q.id)}
                            className="rounded"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm truncate">{q.statement}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={q.isTrue ? 'success' : 'danger'}>
                          {q.isTrue ? 'Факт' : 'Фейк'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-text-secondary">{q.category?.name ?? '—'}</span>
                          {additionalCategories.map((qc: any) => (
                            <Badge key={qc.id} variant="default" className="text-xs">
                              {qc.category?.icon} {qc.category?.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {q.difficulty} — {DIFFICULTY_LABELS[q.difficulty as number] ?? '?'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[q.status] ?? 'default'}>
                          {QUESTION_STATUS_LABELS[q.status] ?? q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {q.timesShown}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {q.timesShown > 0
                          ? `${Math.round((q.timesCorrect / q.timesShown) * 100)}%`
                          : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (confirm('Удалить утверждение?')) {
                              deleteOneMutation.mutate(q.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex items-center gap-4">
                {meta && (
                  <p className="text-sm text-text-secondary">
                    Страница {meta.page} из {meta.totalPages}
                  </p>
                )}
                <PageSizeSelect
                  value={limit}
                  onChange={(size) => { setLimit(size); setPage(1); }}
                />
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
