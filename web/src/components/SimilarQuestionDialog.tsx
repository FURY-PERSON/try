import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatusPicker } from '@/components/StatusPicker';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { FactFakePicker } from '@/components/FactFakePicker';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { SimilarQuestion } from '@/api-client/types';

const editSchema = z.object({
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
  status: z.enum(['draft', 'moderation', 'approved', 'rejected']),
});

type EditFormData = z.infer<typeof editSchema>;

type SimilarQuestionDialogProps = {
  open: boolean;
  onClose: () => void;
  item: SimilarQuestion | null;
  onSaved?: () => void;
};

export function SimilarQuestionDialog({ open, onClose, item, onSaved }: SimilarQuestionDialogProps) {
  const queryClient = useQueryClient();
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  const { data: questionData, isLoading } = useQuery({
    queryKey: ['admin', 'questions', item?.id],
    queryFn: () => api.admin.questions.getById(item!.id),
    enabled: open && item?.type === 'question' && !!item?.id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
    enabled: open && item?.type === 'question',
  });
  const categories = categoriesData?.data.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const question = questionData?.data.data;

  useEffect(() => {
    if (!open || !question || item?.type !== 'question') return;
    const existingAdditional = (question.categories ?? [])
      .filter((qc: any) => qc.categoryId !== question.categoryId)
      .map((qc: any) => qc.categoryId);
    setAdditionalCategoryIds(existingAdditional);
    reset({
      statement: question.statement,
      statementEn: question.statementEn ?? '',
      isTrue: question.isTrue ? 'true' : 'false',
      explanation: question.explanation,
      explanationEn: question.explanationEn ?? '',
      source: question.source,
      sourceEn: question.sourceEn ?? '',
      sourceUrl: question.sourceUrl ?? '',
      sourceUrlEn: question.sourceUrlEn ?? '',
      categoryId: question.categoryId,
      difficulty: question.difficulty,
      status: question.status as 'draft' | 'moderation' | 'approved' | 'rejected',
    });
  }, [open, question, item?.type, reset]);

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.questions.delete(item!.id),
    onSuccess: () => {
      toast.success('Утверждение удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', 'similar'] });
      onSaved?.();
      onClose();
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: EditFormData) =>
      api.admin.questions.update(item!.id, {
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
        status: dto.status,
        categoryIds: additionalCategoryIds.length > 0 ? additionalCategoryIds : undefined,
      }),
    onSuccess: () => {
      toast.success('Утверждение обновлено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', 'similar'] });
      onSaved?.();
      onClose();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  if (item.type === 'collection') {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-surface rounded-2xl p-6 w-full max-w-lg shadow-xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">Элемент подборки</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-text-primary leading-relaxed">{item.statement}</p>
              <div className="flex items-center gap-2">
                {item.categoryIcon && item.categoryName && (
                  <Badge variant="default">
                    {item.categoryIcon} {item.categoryName}
                  </Badge>
                )}
                {item.status && <Badge variant="default">{item.status}</Badge>}
              </div>
              <p className="text-xs text-text-secondary bg-surface-secondary rounded-lg p-3">
                Это элемент подборки. Откройте подборку для редактирования.
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-surface rounded-2xl p-6 w-full max-w-4xl shadow-xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-base font-semibold text-text-primary">Редактировать утверждение</h2>
            <div className="flex items-center gap-2">
              {question && (
                <>
                  <Button
                    type="button"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Удалить утверждение?')) deleteMutation.mutate();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </Button>
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Отмена
                  </Button>
                  <Button type="submit" form="sim-edit-form" loading={updateMutation.isPending}>
                    Сохранить
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue" />
            </div>
          ) : !question ? (
            <p className="text-sm text-text-secondary py-8 text-center">Не удалось загрузить утверждение</p>
          ) : (
            <form
              id="sim-edit-form"
              onSubmit={(e) => {
                e.stopPropagation();
                void handleSubmit((data) => updateMutation.mutate(data))(e);
              }}
              className="space-y-4 overflow-y-auto pr-1 flex-1"
            >
              <StatusPicker
                value={watch('status')}
                onChange={(s) => setValue('status', s, { shouldDirty: true })}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                  id="sim-edit-statement"
                  label="Текст утверждения (RU)"
                  rows={3}
                  error={errors.statement?.message}
                  {...register('statement')}
                />
                <Textarea
                  id="sim-edit-statementEn"
                  label="Statement (EN)"
                  rows={3}
                  error={errors.statementEn?.message}
                  {...register('statementEn')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Факт или Фейк?</label>
                <FactFakePicker
                  value={watch('isTrue')}
                  onChange={(v) => setValue('isTrue', v, { shouldDirty: true })}
                />
                {errors.isTrue && <p className="mt-1 text-xs text-red">{errors.isTrue.message}</p>}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                  id="sim-edit-explanation"
                  label="Объяснение (RU)"
                  rows={9}
                  error={errors.explanation?.message}
                  {...register('explanation')}
                />
                <Textarea
                  id="sim-edit-explanationEn"
                  label="Explanation (EN)"
                  rows={9}
                  error={errors.explanationEn?.message}
                  {...register('explanationEn')}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  id="sim-edit-source"
                  label="Источник (RU)"
                  error={errors.source?.message}
                  {...register('source')}
                />
                <Input
                  id="sim-edit-sourceEn"
                  label="Source (EN)"
                  error={errors.sourceEn?.message}
                  {...register('sourceEn')}
                />
                <Input
                  id="sim-edit-sourceUrl"
                  label="URL источника (RU)"
                  error={errors.sourceUrl?.message}
                  {...register('sourceUrl')}
                />
                <Input
                  id="sim-edit-sourceUrlEn"
                  label="Source URL (EN)"
                  error={errors.sourceUrlEn?.message}
                  {...register('sourceUrlEn')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Сложность</label>
                <DifficultyPicker
                  value={watch('difficulty')}
                  onChange={(v) => setValue('difficulty', v, { shouldDirty: true })}
                />
                {errors.difficulty && <p className="mt-1 text-xs text-red">{errors.difficulty.message}</p>}
              </div>
              <Select
                id="sim-edit-categoryId"
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
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
