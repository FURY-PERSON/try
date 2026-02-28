import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, XCircle, Trash2, ExternalLink, Image, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { QUESTION_STATUS_LABELS, STATUS_BADGE_VARIANT, DIFFICULTY_LABELS, DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS, IS_TRUE_OPTIONS } from '@/shared';
import type { Language } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';


const editFormSchema = z.object({
  statement: z.string().min(10, 'Минимум 10 символов'),
  isTrue: z.enum(['true', 'false']),
  explanation: z.string().min(10, 'Минимум 10 символов'),
  source: z.string().min(1, 'Введите источник'),
  sourceUrl: z.union([z.string().url('Некорректный URL'), z.literal('')]).optional(),
  language: z.enum(['ru', 'en']),
  categoryId: z.string().min(1, 'Выберите категорию'),
  difficulty: z.coerce.number().min(1).max(5),
});

type EditFormData = z.infer<typeof editFormSchema>;

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', id],
    queryFn: () => api.admin.questions.getById(id!),
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
    enabled: editDialogOpen,
  });
  const categories = categoriesData?.data.data ?? [];

  const approveMutation = useMutation({
    mutationFn: () => api.admin.questions.approve(id!),
    onSuccess: () => {
      toast.success('Утверждение одобрено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.admin.questions.reject(id!),
    onSuccess: () => {
      toast.success('Утверждение отклонено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.questions.delete(id!),
    onSuccess: () => {
      toast.success('Утверждение удалено');
      navigate('/questions');
    },
  });

  const generateIllustrationMutation = useMutation({
    mutationFn: () => api.admin.ai.generateIllustration({ questionId: id! }),
    onSuccess: () => {
      toast.success('Иллюстрация сгенерирована');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', id] });
    },
    onError: () => toast.error('Ошибка генерации иллюстрации'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: EditFormData) =>
      api.admin.questions.update(id!, {
        statement: dto.statement,
        isTrue: dto.isTrue === 'true',
        explanation: dto.explanation,
        source: dto.source,
        sourceUrl: dto.sourceUrl || undefined,
        language: dto.language as Language,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        categoryIds: additionalCategoryIds.length > 0 ? additionalCategoryIds : undefined,
      }),
    onSuccess: () => {
      toast.success('Утверждение обновлено');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      setEditDialogOpen(false);
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
  });

  const question = data?.data.data;

  const openEditDialog = () => {
    if (!question) return;
    const existingAdditional = (question.categories ?? [])
      .filter((qc: any) => qc.categoryId !== question.categoryId)
      .map((qc: any) => qc.categoryId);
    setAdditionalCategoryIds(existingAdditional);
    reset({
      statement: question.statement,
      isTrue: question.isTrue ? 'true' : 'false',
      explanation: question.explanation,
      source: question.source,
      sourceUrl: question.sourceUrl ?? '',
      language: question.language as 'ru' | 'en',
      categoryId: question.categoryId,
      difficulty: question.difficulty,
    });
    setEditDialogOpen(true);
  };

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Утверждение не найдено</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/questions')}>
          К списку утверждений
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </button>
      </div>

      <PageHeader
        title="Утверждение"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openEditDialog}
            >
              <Pencil className="w-4 h-4" />
              Редактировать
            </Button>
            {question.status !== 'approved' && (
              <Button
                size="sm"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
              >
                <CheckCircle className="w-4 h-4" />
                Одобрить
              </Button>
            )}
            {question.status !== 'rejected' && (
              <Button
                variant="secondary"
                size="sm"
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                <XCircle className="w-4 h-4" />
                Отклонить
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Удалить утверждение?')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Информация</CardTitle>
          <div className="mt-4 space-y-3">
            <InfoRow label="ID" value={question.id} />
            <InfoRow
              label="Статус"
              value={
                <Badge variant={STATUS_BADGE_VARIANT[question.status] ?? 'default'}>
                  {QUESTION_STATUS_LABELS[question.status] ?? question.status}
                </Badge>
              }
            />
            <InfoRow
              label="Факт/Фейк"
              value={
                <Badge variant={question.isTrue ? 'success' : 'danger'}>
                  {question.isTrue ? 'Факт' : 'Фейк'}
                </Badge>
              }
            />
            <InfoRow label="Категория" value={question.category?.name ?? '—'} />
            {question.categories && question.categories.length > 1 && (
              <InfoRow
                label="Все категории"
                value={
                  <div className="flex flex-wrap gap-1 justify-end">
                    {question.categories.map((qc: any) => (
                      <Badge key={qc.id} variant="default">
                        {qc.category?.icon} {qc.category?.name}
                      </Badge>
                    ))}
                  </div>
                }
              />
            )}
            <InfoRow label="Язык" value={question.language.toUpperCase()} />
            <InfoRow
              label="Сложность"
              value={`${question.difficulty} — ${DIFFICULTY_LABELS[question.difficulty as number] ?? '?'}`}
            />
            <InfoRow label="Показов" value={String(question.timesShown)} />
            <InfoRow
              label="% правильных"
              value={
                question.timesShown > 0
                  ? `${Math.round((question.timesCorrect / question.timesShown) * 100)}%`
                  : '—'
              }
            />
            <InfoRow
              label="Среднее время"
              value={question.avgTimeSeconds > 0 ? `${question.avgTimeSeconds}с` : '—'}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Утверждение</CardTitle>
          <p className="mt-4 text-base text-text-primary leading-relaxed font-medium">
            {question.statement}
          </p>
          <div className="mt-4">
            <Badge variant={question.isTrue ? 'success' : 'danger'} className="text-sm">
              {question.isTrue ? 'Это ФАКТ' : 'Это ФЕЙК'}
            </Badge>
          </div>
        </Card>

        <Card>
          <CardTitle>Объяснение</CardTitle>
          <p className="mt-4 text-sm text-text-primary leading-relaxed">
            {question.explanation}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-text-secondary">
              Источник: {question.source}
            </p>
            {question.sourceUrl && (
              <a
                href={question.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Проверить источник
              </a>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Иллюстрация</CardTitle>
            <Button
              variant="secondary"
              size="sm"
              loading={generateIllustrationMutation.isPending}
              onClick={() => generateIllustrationMutation.mutate()}
            >
              <Image className="w-4 h-4" />
              {question.illustrationUrl ? 'Перегенерировать' : 'Генерировать'}
            </Button>
          </div>
          {question.illustrationUrl ? (
            <img
              src={question.illustrationUrl}
              alt="Иллюстрация"
              loading="lazy"
              decoding="async"
              className="mt-4 rounded-lg w-full h-48 object-cover"
            />
          ) : (
            <div className="mt-4 flex items-center justify-center h-48 bg-surface-secondary rounded-lg">
              <p className="text-sm text-text-secondary">Нет иллюстрации</p>
            </div>
          )}
          {question.illustrationPrompt && (
            <p className="mt-2 text-xs text-text-secondary">
              Промпт: {question.illustrationPrompt}
            </p>
          )}
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Редактировать утверждение"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Textarea
            id="edit-statement"
            label="Текст утверждения"
            rows={3}
            error={errors.statement?.message}
            {...register('statement')}
          />
          <Select
            id="edit-isTrue"
            label="Факт или Фейк?"
            options={IS_TRUE_OPTIONS}
            error={errors.isTrue?.message}
            {...register('isTrue')}
          />
          <Textarea
            id="edit-explanation"
            label="Объяснение"
            rows={4}
            error={errors.explanation?.message}
            {...register('explanation')}
          />
          <Input
            id="edit-source"
            label="Источник"
            error={errors.source?.message}
            {...register('source')}
          />
          <Input
            id="edit-sourceUrl"
            label="URL источника"
            error={errors.sourceUrl?.message}
            {...register('sourceUrl')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="edit-language"
              label="Язык"
              options={LANGUAGE_OPTIONS}
              error={errors.language?.message}
              {...register('language')}
            />
            <Select
              id="edit-difficulty"
              label="Сложность"
              options={DIFFICULTY_OPTIONS}
              error={errors.difficulty?.message}
              {...register('difficulty')}
            />
          </div>
          <Select
            id="edit-categoryId"
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
