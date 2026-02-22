import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { GAME_TYPES, QUESTION_STATUS } from '@/shared';
import type { GameType, QuestionStatus } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const GAME_TYPE_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: GAME_TYPES.ANAGRAM, label: 'Анаграмма' },
  { value: GAME_TYPES.COMPOSE_WORDS, label: 'Составь слова' },
  { value: GAME_TYPES.WORD_CHAIN, label: 'Цепочка слов' },
  { value: GAME_TYPES.WORD_SEARCH, label: 'Поиск слов' },
  { value: GAME_TYPES.GUESS_WORD, label: 'Угадай слово' },
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

const GAME_TYPE_LABELS: Record<string, string> = {
  anagram: 'Анаграмма',
  compose_words: 'Составь слова',
  word_chain: 'Цепочка',
  word_search: 'Поиск слов',
  guess_word: 'Угадай слово',
};

export function QuestionsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', { page, search, type: typeFilter, status: statusFilter }],
    queryFn: () =>
      api.admin.questions.list({
        page,
        limit: 20,
        search: search || undefined,
        type: (typeFilter || undefined) as GameType | undefined,
        status: (statusFilter || undefined) as QuestionStatus | undefined,
      }),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => api.admin.questions.bulkApprove(ids),
    onSuccess: () => {
      toast.success(`Одобрено: ${selected.length} вопросов`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка при одобрении'),
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
      setSelected(questions.map((q) => q.id));
    }
  };

  return (
    <div>
      <PageHeader
        title="Вопросы"
        description={meta ? `Всего: ${meta.total}` : undefined}
        actions={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                loading={bulkApproveMutation.isPending}
                onClick={() => bulkApproveMutation.mutate(selected)}
              >
                <CheckCircle className="w-4 h-4" />
                Одобрить ({selected.length})
              </Button>
            )}
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
            options={GAME_TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
            title="Нет вопросов"
            description="Попробуйте изменить фильтры или сгенерировать новые вопросы с помощью AI"
            action={
              <Button size="sm" onClick={() => navigate('/questions/generate')}>
                Генерировать вопросы
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === questions.length && questions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Сложность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Показов</TableHead>
                  <TableHead>% правильных</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/questions/${q.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">
                        {GAME_TYPE_LABELS[q.type] ?? q.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {q.category?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{q.difficulty}/5</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[q.status] ?? 'default'}>
                        {q.status}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  Страница {meta.page} из {meta.totalPages}
                </p>
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
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
