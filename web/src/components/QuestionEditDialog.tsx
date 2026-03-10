import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { StatusPicker } from '@/components/StatusPicker';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { FactFakePicker } from '@/components/FactFakePicker';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog } from '@/components/ui/Dialog';
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
  status: z.enum(['draft', 'moderation', 'approved', 'rejected']),
});

type EditFormData = z.infer<typeof editFormSchema>;

type QuestionEditDialogProps = {
  questionId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
};

export function QuestionEditDialog({ questionId, open, onClose, onSaved, onDeleted }: QuestionEditDialogProps) {
  const queryClient = useQueryClient();
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  const { data: questionData, isLoading } = useQuery({
    queryKey: ['admin', 'questions', questionId],
    queryFn: () => api.admin.questions.getById(questionId!),
    enabled: open && !!questionId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
    enabled: open,
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
    resolver: zodResolver(editFormSchema),
  });

  const question = questionData?.data.data;

  useEffect(() => {
    if (!open || !question) return;
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
  }, [open, question, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: EditFormData) =>
      api.admin.questions.update(questionId!, {
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
      onSaved?.();
      onClose();
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.questions.delete(questionId!),
    onSuccess: () => {
      toast.success('Утверждение удалено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      onDeleted?.();
      onClose();
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const headerActions = question ? (
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
      <Button type="submit" form="question-edit-form" loading={updateMutation.isPending}>
        Сохранить
      </Button>
    </>
  ) : undefined;

  return (
    <Dialog open={open} onClose={onClose} title="Редактировать утверждение" className="max-w-4xl" headerActions={headerActions}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !question ? (
        <p className="text-sm text-text-secondary py-8 text-center">Не удалось загрузить утверждение</p>
      ) : (
        <form
          id="question-edit-form"
          onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
        >
          <StatusPicker
            value={watch('status')}
            onChange={(s) => setValue('status', s, { shouldDirty: true })}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Textarea
              id="qed-statement"
              label="Текст утверждения (RU)"
              rows={3}
              error={errors.statement?.message}
              {...register('statement')}
            />
            <Textarea
              id="qed-statementEn"
              label="Statement (EN)"
              rows={3}
              error={errors.statementEn?.message}
              {...register('statementEn')}
            />
          </div>
          <SimilarQuestions statement={watch('statement') ?? ''} excludeId={questionId ?? undefined} />
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
              id="qed-explanation"
              label="Объяснение (RU)"
              rows={10}
              error={errors.explanation?.message}
              {...register('explanation')}
            />
            <Textarea
              id="qed-explanationEn"
              label="Explanation (EN)"
              rows={10}
              error={errors.explanationEn?.message}
              {...register('explanationEn')}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              id="qed-source"
              label="Источник (RU)"
              error={errors.source?.message}
              {...register('source')}
            />
            <Input
              id="qed-sourceEn"
              label="Source (EN)"
              error={errors.sourceEn?.message}
              {...register('sourceEn')}
            />
            <Input
              id="qed-sourceUrl"
              label="URL источника (RU)"
              error={errors.sourceUrl?.message}
              {...register('sourceUrl')}
            />
            <Input
              id="qed-sourceUrlEn"
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
            id="qed-categoryId"
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
    </Dialog>
  );
}
