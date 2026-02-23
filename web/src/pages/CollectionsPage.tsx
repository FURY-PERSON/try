import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Library, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Collection, CollectionWithQuestions, QuestionWithCategory } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const collectionSchema = z.object({
  title: z.string().min(1, 'Введите название'),
  titleEn: z.string().min(1, 'Введите название (EN)'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['featured', 'seasonal', 'thematic']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortOrder: z.coerce.number().min(0),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

const TYPE_OPTIONS = [
  { value: 'thematic', label: 'Тематическая' },
  { value: 'featured', label: 'Рекомендуемая' },
  { value: 'seasonal', label: 'Сезонная' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликована' },
];

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: 'featured', label: 'Рекомендуемая' },
  { value: 'seasonal', label: 'Сезонная' },
  { value: 'thematic', label: 'Тематическая' },
];

const TYPE_LABELS: Record<string, string> = {
  featured: 'Рекомендуемая',
  seasonal: 'Сезонная',
  thematic: 'Тематическая',
};

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithQuestions | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'collections', { page, status: statusFilter, type: typeFilter }],
    queryFn: () =>
      api.admin.collections.list({
        page,
        limit: 20,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      }),
  });

  const collections = data?.data.data ?? [];
  const meta = data?.data.meta;

  // Load approved questions for the picker
  const { data: questionsData } = useQuery({
    queryKey: ['admin', 'questions', 'approved-for-picker'],
    queryFn: () => api.admin.questions.list({ status: 'approved', limit: 200 }),
    enabled: dialogOpen,
  });

  const allQuestions: QuestionWithCategory[] = questionsData?.data.data ?? [];

  const filteredQuestions = allQuestions.filter((q) => {
    if (!questionSearch) return true;
    const search = questionSearch.toLowerCase();
    return (
      q.statement.toLowerCase().includes(search) ||
      q.category?.name?.toLowerCase().includes(search)
    );
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CollectionFormData & { questionIds: string[] }) =>
      api.admin.collections.create({
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Подборка создана');
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CollectionFormData> & { questionIds?: string[]; status?: 'draft' | 'published' };
    }) =>
      api.admin.collections.update(id, {
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Подборка обновлена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
      closeDialog();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.collections.delete(id),
    onSuccess: () => {
      toast.success('Подборка удалена');
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' }) =>
      api.admin.collections.update(id, { status }),
    onSuccess: () => {
      toast.success('Статус обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
    },
    onError: () => toast.error('Ошибка обновления статуса'),
  });

  const openCreate = () => {
    setEditingCollection(null);
    setSelectedQuestionIds([]);
    setQuestionSearch('');
    reset({
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      icon: '📚',
      type: 'thematic',
      startDate: '',
      endDate: '',
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = async (col: Collection) => {
    try {
      const res = await api.admin.collections.getById(col.id);
      const full = res.data.data;
      setEditingCollection(full);
      setSelectedQuestionIds(full.questions.map((q) => q.question.id));
      setQuestionSearch('');
      reset({
        title: full.title,
        titleEn: full.titleEn,
        description: full.description,
        descriptionEn: full.descriptionEn,
        icon: full.icon,
        type: full.type,
        startDate: full.startDate ? full.startDate.split('T')[0] : '',
        endDate: full.endDate ? full.endDate.split('T')[0] : '',
        sortOrder: full.sortOrder,
      });
      setDialogOpen(true);
    } catch {
      toast.error('Ошибка загрузки подборки');
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCollection(null);
    setSelectedQuestionIds([]);
    reset();
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id],
    );
  };

  const onSubmit = (data: CollectionFormData) => {
    if (selectedQuestionIds.length === 0) {
      toast.error('Выберите хотя бы один вопрос');
      return;
    }

    if (editingCollection) {
      updateMutation.mutate({
        id: editingCollection.id,
        data: { ...data, questionIds: selectedQuestionIds },
      });
    } else {
      createMutation.mutate({ ...data, questionIds: selectedQuestionIds });
    }
  };

  return (
    <div>
      <PageHeader
        title="Подборки"
        description={meta ? `Всего: ${meta.total}` : undefined}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Нет подборок"
            description="Создайте первую тематическую подборку"
            action={
              <Button size="sm" onClick={openCreate}>
                Создать подборку
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Вопросов</TableHead>
                <TableHead>Даты</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((col) => (
                <TableRow key={col.id}>
                  <TableCell className="text-2xl">{col.icon}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{col.title}</span>
                      <span className="block text-xs text-text-secondary">{col.titleEn}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        col.type === 'featured'
                          ? 'warning'
                          : col.type === 'seasonal'
                            ? 'primary'
                            : 'default'
                      }
                    >
                      {TYPE_LABELS[col.type] ?? col.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={col.status === 'published' ? 'success' : 'default'}>
                      {col.status === 'published' ? 'Опубликована' : 'Черновик'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{col._count.questions}</TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {col.startDate
                      ? format(new Date(col.startDate), 'dd MMM yyyy', { locale: ru })
                      : '—'}
                    {' → '}
                    {col.endDate
                      ? format(new Date(col.endDate), 'dd MMM yyyy', { locale: ru })
                      : '∞'}
                  </TableCell>
                  <TableCell className="text-text-secondary">{col.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          togglePublish.mutate({
                            id: col.id,
                            status: col.status === 'published' ? 'draft' : 'published',
                          })
                        }
                        className="p-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                        title={col.status === 'published' ? 'Снять' : 'Опубликовать'}
                      >
                        {col.status === 'published' ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => openEdit(col)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить подборку?')) deleteMutation.mutate(col.id);
                        }}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Назад
          </Button>
          <span className="text-sm text-text-secondary self-center">
            {page} / {meta.totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд →
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingCollection ? 'Редактировать подборку' : 'Новая подборка'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="title"
              label="Название (RU)"
              placeholder="Мифы о здоровье"
              error={errors.title?.message}
              {...register('title')}
            />
            <Input
              id="titleEn"
              label="Название (EN)"
              placeholder="Health Myths"
              error={errors.titleEn?.message}
              {...register('titleEn')}
            />
          </div>

          <Textarea
            id="description"
            label="Описание (RU)"
            placeholder="Опишите подборку..."
            {...register('description')}
          />
          <Textarea
            id="descriptionEn"
            label="Описание (EN)"
            placeholder="Describe the collection..."
            {...register('descriptionEn')}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              id="icon"
              label="Иконка"
              placeholder="💊"
              error={errors.icon?.message}
              {...register('icon')}
            />
            <Select
              id="type"
              label="Тип"
              options={TYPE_OPTIONS}
              error={errors.type?.message}
              {...register('type')}
            />
            <Input
              id="sortOrder"
              label="Порядок"
              type="number"
              min={0}
              error={errors.sortOrder?.message}
              {...register('sortOrder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="startDate" label="Дата начала" type="date" {...register('startDate')} />
            <Input id="endDate" label="Дата окончания" type="date" {...register('endDate')} />
          </div>

          {/* Question Picker */}
          <div>
            <label className="text-sm font-medium text-text-primary">
              Вопросы ({selectedQuestionIds.length} выбрано)
            </label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Поиск вопросов..."
                className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {questionSearch && (
                <button
                  type="button"
                  onClick={() => setQuestionSearch('')}
                  className="absolute right-3 top-2.5 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selected questions shown first */}
            {selectedQuestionIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedQuestionIds.map((id) => {
                  const q = allQuestions.find((q) => q.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                      onClick={() => toggleQuestion(id)}
                    >
                      {q ? q.statement.slice(0, 40) + (q.statement.length > 40 ? '…' : '') : id}
                      <X className="w-3 h-3" />
                    </span>
                  );
                })}
              </div>
            )}

            <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg">
              {filteredQuestions.length === 0 ? (
                <p className="p-3 text-sm text-text-secondary text-center">
                  {allQuestions.length === 0 ? 'Загрузка вопросов...' : 'Ничего не найдено'}
                </p>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-surface-secondary border-b border-border last:border-0 ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestion(q.id)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-2">{q.statement}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {q.category?.name ?? '—'} · Сложность: {q.difficulty}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCollection ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
