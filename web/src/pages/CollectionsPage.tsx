import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Library, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Collection, CollectionWithItems } from '@/shared';
import type { CreateCollectionItemDto } from '@/api-client/types';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmojiPickerInput } from '@/components/ui/EmojiPickerInput';
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
import { PageSizeSelect } from '@/components/ui/PageSizeSelect';
import { SimilarQuestions } from '@/components/SimilarQuestions';

// ─── Collection form schema ───────────────────────────────────────────────────

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

// ─── Question form schema ─────────────────────────────────────────────────────

const questionSchema = z.object({
  statement: z.string().min(5, 'Минимум 5 символов'),
  statementEn: z.string().optional(),
  isTrue: z.enum(['true', 'false']),
  explanation: z.string().min(5, 'Минимум 5 символов'),
  explanationEn: z.string().optional(),
  source: z.string().optional(),
  sourceEn: z.string().optional(),
  sourceUrl: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  sourceUrlEn: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  difficulty: z.coerce.number().min(1).max(5),
});

type QuestionFormData = z.infer<typeof questionSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'thematic', label: 'Тематическая' },
  { value: 'featured', label: 'Рекомендуемая' },
  { value: 'seasonal', label: 'Сезонная' },
];

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 — Очень лёгкий' },
  { value: '2', label: '2 — Лёгкий' },
  { value: '3', label: '3 — Средний' },
  { value: '4', label: '4 — Сложный' },
  { value: '5', label: '5 — Очень сложный' },
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

// ─── QuestionEditor — список вопросов внутри формы подборки ──────────────────

function QuestionEditor({
  items,
  onChange,
}: {
  items: CreateCollectionItemDto[];
  onChange: (items: CreateCollectionItemDto[]) => void;
}) {
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditingIndex(null);
    setQuestionDialogOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setQuestionDialogOpen(true);
  };

  const closeDialog = () => {
    setQuestionDialogOpen(false);
    setEditingIndex(null);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleSave = (data: QuestionFormData) => {
    const item: CreateCollectionItemDto = {
      statement: data.statement,
      statementEn: data.statementEn || undefined,
      isTrue: data.isTrue === 'true',
      explanation: data.explanation,
      explanationEn: data.explanationEn || undefined,
      source: data.source || undefined,
      sourceEn: data.sourceEn || undefined,
      sourceUrl: data.sourceUrl || undefined,
      sourceUrlEn: data.sourceUrlEn || undefined,
      difficulty: data.difficulty,
      sortOrder: editingIndex !== null ? (items[editingIndex]?.sortOrder ?? items.length + 1) : items.length + 1,
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = item;
      onChange(updated);
    } else {
      onChange([...items, item]);
    }
    closeDialog();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-primary">
          Вопросы ({items.length})
        </label>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить вопрос
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-4 border border-dashed border-border rounded-lg">
          Вопросов пока нет — нажмите «Добавить вопрос»
        </p>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="px-3 py-2">
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${item.isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.isTrue ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-text-primary line-clamp-2 cursor-pointer select-none"
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    {item.statement}
                  </p>
                  {expandedIndex === i && (
                    <p className="text-xs text-text-secondary mt-1">{item.explanation}</p>
                  )}
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-text-secondary">Сложность: {item.difficulty}</span>
                    {item.statementEn && (
                      <span className="text-xs font-medium text-blue bg-blue/10 px-1.5 py-0.5 rounded">EN</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(i)}
                    className="p-1 rounded text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 rounded text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestionDialogControlled
        open={questionDialogOpen}
        editingIndex={editingIndex}
        editingItem={editingIndex !== null ? (items[editingIndex] ?? null) : null}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </div>
  );
}

// QuestionDialogControlled pre-fills the form when editing
function QuestionDialogControlled({
  open,
  editingIndex,
  editingItem,
  onClose,
  onSave,
}: {
  open: boolean;
  editingIndex: number | null;
  editingItem: CreateCollectionItemDto | null;
  onClose: () => void;
  onSave: (data: QuestionFormData) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: { difficulty: 3, isTrue: 'false' },
  });

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      reset({
        statement: editingItem.statement,
        statementEn: editingItem.statementEn ?? '',
        isTrue: editingItem.isTrue ? 'true' : 'false',
        explanation: editingItem.explanation,
        explanationEn: editingItem.explanationEn ?? '',
        source: editingItem.source ?? '',
        sourceEn: editingItem.sourceEn ?? '',
        sourceUrl: editingItem.sourceUrl ?? '',
        sourceUrlEn: editingItem.sourceUrlEn ?? '',
        difficulty: editingItem.difficulty ?? 3,
      });
    } else {
      reset({ statement: '', statementEn: '', isTrue: 'false', explanation: '', explanationEn: '', source: '', sourceEn: '', sourceUrl: '', sourceUrlEn: '', difficulty: 3 });
    }
  }, [open, editingItem, reset]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-surface rounded-2xl p-6 w-full max-w-4xl shadow-xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">
              {editingIndex !== null ? `Редактировать вопрос #${editingIndex + 1}` : 'Новый вопрос'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => { e.stopPropagation(); void handleSubmit(onSave)(e); }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Textarea
                id="q-statement"
                label="Утверждение (RU)"
                placeholder="Человек использует только 10% мозга"
                error={errors.statement?.message}
                rows={2}
                {...register('statement')}
              />
              <Textarea
                id="q-statementEn"
                label="Statement (EN)"
                placeholder="Humans only use 10% of their brain"
                error={errors.statementEn?.message}
                rows={2}
                {...register('statementEn')}
              />
            </div>
            <SimilarQuestions statement={watch('statement') ?? ''} />

            <div className="grid grid-cols-2 gap-3">
              <Select
                id="q-isTrue"
                label="Ответ"
                options={[
                  { value: 'false', label: '✗ Ложь' },
                  { value: 'true', label: '✓ Правда' },
                ]}
                error={errors.isTrue?.message}
                {...register('isTrue')}
              />
              <Select
                id="q-difficulty"
                label="Сложность"
                options={DIFFICULTY_OPTIONS}
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Textarea
                id="q-explanation"
                label="Объяснение (RU)"
                placeholder="На самом деле мозг задействован полностью..."
                error={errors.explanation?.message}
                rows={2}
                {...register('explanation')}
              />
              <Textarea
                id="q-explanationEn"
                label="Explanation (EN)"
                placeholder="In fact, the brain is fully engaged..."
                error={errors.explanationEn?.message}
                rows={2}
                {...register('explanationEn')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Input
                id="q-source"
                label="Источник (RU)"
                placeholder="Википедия"
                {...register('source')}
              />
              <Input
                id="q-sourceEn"
                label="Source (EN)"
                placeholder="Wikipedia"
                {...register('sourceEn')}
              />
              <Input
                id="q-sourceUrl"
                label="URL источника (RU)"
                placeholder="https://..."
                error={errors.sourceUrl?.message}
                {...register('sourceUrl')}
              />
              <Input
                id="q-sourceUrlEn"
                label="Source URL (EN)"
                placeholder="https://..."
                error={errors.sourceUrlEn?.message}
                {...register('sourceUrlEn')}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit">
                {editingIndex !== null ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithItems | null>(null);
  const [collectionItems, setCollectionItems] = useState<CreateCollectionItemDto[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'collections', { page, limit, status: statusFilter, type: typeFilter }],
    queryFn: () =>
      api.admin.collections.list({
        page,
        limit,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      }),
  });

  const collections = data?.data.data ?? [];
  const meta = data?.data.meta;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
  });

  const iconValue = watch('icon');

  const createMutation = useMutation({
    mutationFn: (payload: CollectionFormData & { items: CreateCollectionItemDto[] }) =>
      api.admin.collections.create({
        ...payload,
        startDate: payload.startDate || undefined,
        endDate: payload.endDate || undefined,
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
      data: Partial<CollectionFormData> & { items?: CreateCollectionItemDto[]; status?: 'draft' | 'published' };
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
    setCollectionItems([]);
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
      setCollectionItems(
        full.questions.map((item) => ({
          statement: item.statement,
          statementEn: item.statementEn || undefined,
          isTrue: item.isTrue,
          explanation: item.explanation,
          explanationEn: item.explanationEn || undefined,
          source: item.source || undefined,
          sourceEn: item.sourceEn || undefined,
          sourceUrl: item.sourceUrl || undefined,
          sourceUrlEn: item.sourceUrlEn || undefined,
          difficulty: item.difficulty,
          language: item.language,
          sortOrder: item.sortOrder,
        })),
      );
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
    setCollectionItems([]);
    reset();
  };

  const onSubmit = (data: CollectionFormData) => {
    if (collectionItems.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    if (editingCollection) {
      updateMutation.mutate({
        id: editingCollection.id,
        data: { ...data, items: collectionItems },
      });
    } else {
      createMutation.mutate({ ...data, items: collectionItems });
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
                <TableRow
                  key={col.id}
                  className="cursor-pointer hover:bg-surface-secondary/50"
                  onClick={() => openEdit(col)}
                >
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
      {meta && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              {page} / {meta.totalPages}
            </span>
            <PageSizeSelect
              value={limit}
              onChange={(size) => { setLimit(size); setPage(1); }}
            />
          </div>
          {meta.totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </Button>
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
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingCollection ? 'Редактировать подборку' : 'Новая подборка'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
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
            <EmojiPickerInput
              value={iconValue ?? ''}
              onChange={(emoji) => setValue('icon', emoji, { shouldValidate: true })}
              label="Иконка"
              error={errors.icon?.message}
              placeholder="💊"
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

          {/* Inline Question Editor */}
          <div className="border-t border-border pt-4">
            <QuestionEditor items={collectionItems} onChange={setCollectionItems} />
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
