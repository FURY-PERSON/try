import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { FactFakePicker } from '@/components/FactFakePicker';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SimilarQuestions } from '@/components/SimilarQuestions';

const questionSchema = z.object({
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

type QuestionFormData = z.infer<typeof questionSchema>;

function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
}

function QuestionForm({
  idPrefix,
  form,
  categories,
  additionalCategoryIds,
  onToggleCategory,
  statementValue,
  excludeId,
  onSubmit,
}: {
  idPrefix: string;
  form: ReturnType<typeof useForm<QuestionFormData>>;
  categories: any[];
  additionalCategoryIds: string[];
  onToggleCategory: (catId: string) => void;
  statementValue: string;
  excludeId?: string;
  onSubmit: (data: QuestionFormData) => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  return (
    <form
      id={`${idPrefix}-form`}
      onSubmit={(e) => {
        e.stopPropagation();
        void handleSubmit(onSubmit)(e);
      }}
      className="space-y-4 overflow-y-auto pr-1 flex-1"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Textarea
            id={`${idPrefix}-statement`}
            label="Текст утверждения (RU)"
            rows={3}
            error={errors.statement?.message}
            {...register('statement')}
          />
          <SimilarQuestions statement={statementValue} excludeId={excludeId} />
        </div>
        <Textarea
          id={`${idPrefix}-statementEn`}
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
          id={`${idPrefix}-explanation`}
          label="Объяснение (RU)"
          rows={4}
          error={errors.explanation?.message}
          {...register('explanation')}
        />
        <Textarea
          id={`${idPrefix}-explanationEn`}
          label="Explanation (EN)"
          rows={4}
          error={errors.explanationEn?.message}
          {...register('explanationEn')}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input
          id={`${idPrefix}-source`}
          label="Источник (RU)"
          error={errors.source?.message}
          {...register('source')}
        />
        <Input
          id={`${idPrefix}-sourceEn`}
          label="Source (EN)"
          error={errors.sourceEn?.message}
          {...register('sourceEn')}
        />
        <Input
          id={`${idPrefix}-sourceUrl`}
          label="URL источника (RU)"
          error={errors.sourceUrl?.message}
          {...register('sourceUrl')}
        />
        <Input
          id={`${idPrefix}-sourceUrlEn`}
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
        id={`${idPrefix}-categoryId`}
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
                onClick={() => onToggleCategory(c.id)}
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
  );
}

// --- Create Dialog ---

type DailySetCreateQuestionDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (questionId: string) => void;
};

export function DailySetCreateQuestionDialog({ open, onClose, onCreated }: DailySetCreateQuestionDialogProps) {
  const queryClient = useQueryClient();
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
    enabled: open,
  });
  const categories = categoriesData?.data.data ?? [];

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      statement: '',
      statementEn: '',
      isTrue: 'true',
      explanation: '',
      explanationEn: '',
      source: '',
      sourceEn: '',
      sourceUrl: '',
      sourceUrlEn: '',
      categoryId: '',
      difficulty: 3,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        statement: '',
        statementEn: '',
        isTrue: 'true',
        explanation: '',
        explanationEn: '',
        source: '',
        sourceEn: '',
        sourceUrl: '',
        sourceUrlEn: '',
        categoryId: '',
        difficulty: 3,
      });
      setAdditionalCategoryIds([]);
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (dto: QuestionFormData) => {
      const createRes = await api.admin.questions.create({
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
      });
      const newId = createRes.data.data.id;
      await api.admin.questions.approve(newId);
      return newId;
    },
    onSuccess: (newId) => {
      toast.success('Утверждение создано и одобрено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      onCreated(newId);
      onClose();
    },
    onError: () => toast.error('Ошибка создания утверждения'),
  });

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  useEscapeClose(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-surface rounded-2xl p-6 w-full max-w-4xl shadow-xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-base font-semibold text-text-primary">Создать утверждение</h2>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" form="ds-create-form" loading={createMutation.isPending}>
                Создать и одобрить
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <QuestionForm
            idPrefix="ds-create"
            form={form}
            categories={categories}
            additionalCategoryIds={additionalCategoryIds}
            onToggleCategory={toggleAdditionalCategory}
            statementValue={form.watch('statement') ?? ''}
            onSubmit={(data) => createMutation.mutate(data)}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}

// --- Edit Dialog ---

type DailySetEditQuestionDialogProps = {
  open: boolean;
  onClose: () => void;
  questionId: string | null;
  onSaved?: () => void;
};

export function DailySetEditQuestionDialog({ open, onClose, questionId, onSaved }: DailySetEditQuestionDialogProps) {
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

  const question = questionData?.data.data;

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
  });

  useEffect(() => {
    if (!open || !question) return;
    const existingAdditional = (question.categories ?? [])
      .filter((qc: any) => qc.categoryId !== question.categoryId)
      .map((qc: any) => qc.categoryId);
    setAdditionalCategoryIds(existingAdditional);
    form.reset({
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
    });
  }, [open, question, form]);

  const updateMutation = useMutation({
    mutationFn: (dto: QuestionFormData) =>
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

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  useEscapeClose(open, onClose);

  if (!open || !questionId) return null;

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
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Отмена
                  </Button>
                  <Button type="submit" form="ds-edit-form" loading={updateMutation.isPending}>
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
            <QuestionForm
              idPrefix="ds-edit"
              form={form}
              categories={categories}
              additionalCategoryIds={additionalCategoryIds}
              onToggleCategory={toggleAdditionalCategory}
              statementValue={form.watch('statement') ?? ''}
              excludeId={questionId}
              onSubmit={(data) => updateMutation.mutate(data)}
            />
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
