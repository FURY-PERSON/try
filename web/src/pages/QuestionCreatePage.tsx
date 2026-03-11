import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateQuestionDto } from '@/api-client/types';
import { IS_TRUE_OPTIONS, DIFFICULTY_OPTIONS } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SimilarQuestions } from '@/components/SimilarQuestions';


const questionFormSchema = z.object({
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
  difficulty: z.coerce.number().min(1, 'Мин. 1').max(5, 'Макс. 5'),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export function QuestionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });
  const categories = categoriesData?.data.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      isTrue: 'false',
      difficulty: 3,
      statement: '',
      statementEn: '',
      explanation: '',
      explanationEn: '',
      source: '',
      sourceEn: '',
      sourceUrl: '',
      sourceUrlEn: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateQuestionDto) => api.admin.questions.create(dto),
    onSuccess: () => {
      toast.success('Утверждение создано');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      navigate('/admin/questions');
    },
    onError: () => toast.error('Ошибка создания утверждения'),
  });

  const onSubmit = (data: QuestionFormData) => {
    createMutation.mutate({
      statement: data.statement,
      statementEn: data.statementEn || undefined,
      isTrue: data.isTrue === 'true',
      explanation: data.explanation,
      explanationEn: data.explanationEn || undefined,
      source: data.source,
      sourceEn: data.sourceEn || undefined,
      sourceUrl: data.sourceUrl || undefined,
      sourceUrlEn: data.sourceUrlEn || undefined,
      language: 'ru',
      categoryId: data.categoryId,
      difficulty: data.difficulty,
      categoryIds: additionalCategoryIds.length > 0 ? additionalCategoryIds : undefined,
    });
  };

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/questions')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <PageHeader title="Создать утверждение" description="Ручное создание нового утверждения для игры «Фронт фактов»" />

      <div className="max-w-5xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardTitle>Утверждение</CardTitle>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Textarea
                id="statement"
                label="Текст утверждения (RU)"
                rows={3}
                placeholder="Великая Китайская стена видна из космоса невооружённым глазом"
                error={errors.statement?.message}
                {...register('statement')}
              />
              <Textarea
                id="statementEn"
                label="Statement (EN)"
                rows={3}
                placeholder="The Great Wall of China is visible from space with the naked eye"
                error={errors.statementEn?.message}
                {...register('statementEn')}
              />
            </div>
            <SimilarQuestions statement={watch('statement') ?? ''} />
            <div className="mt-4">
              <Select
                id="isTrue"
                label="Это факт или фейк?"
                options={IS_TRUE_OPTIONS}
                error={errors.isTrue?.message}
                {...register('isTrue')}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Объяснение</CardTitle>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Textarea
                id="explanation"
                label="Объяснение (RU)"
                rows={4}
                placeholder="Объясните, почему это утверждение верно или неверно..."
                error={errors.explanation?.message}
                {...register('explanation')}
              />
              <Textarea
                id="explanationEn"
                label="Explanation (EN)"
                rows={4}
                placeholder="Explain why this statement is true or false..."
                error={errors.explanationEn?.message}
                {...register('explanationEn')}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                id="source"
                label="Источник (RU)"
                placeholder="NASA, Википедия, Nature Journal..."
                error={errors.source?.message}
                {...register('source')}
              />
              <Input
                id="sourceEn"
                label="Source (EN)"
                placeholder="NASA, Wikipedia, Nature Journal..."
                error={errors.sourceEn?.message}
                {...register('sourceEn')}
              />
              <Input
                id="sourceUrl"
                label="URL источника (RU)"
                placeholder="https://..."
                error={errors.sourceUrl?.message}
                {...register('sourceUrl')}
              />
              <Input
                id="sourceUrlEn"
                label="Source URL (EN)"
                placeholder="https://..."
                error={errors.sourceUrlEn?.message}
                {...register('sourceUrlEn')}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Параметры</CardTitle>
            <div className="mt-4 space-y-4">
              <Select
                id="difficulty"
                label="Сложность"
                options={DIFFICULTY_OPTIONS}
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
              <Select
                id="categoryId"
                label="Основная категория"
                options={categories.map((c: any) => ({
                  value: c.id,
                  label: `${c.icon} ${c.name}`,
                }))}
                placeholder="Выберите категорию"
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
                  <p className="text-xs text-text-secondary mt-1">
                    Основная категория включается автоматически
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            <Save className="w-4 h-4" />
            Создать утверждение
          </Button>
        </form>
      </div>
    </div>
  );
}
