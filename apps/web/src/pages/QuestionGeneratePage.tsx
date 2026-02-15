import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { GAME_TYPES, LANGUAGES } from '@wordpulse/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

const generateSchema = z.object({
  category: z.string().min(1, 'Выберите категорию'),
  difficulty: z.coerce.number().min(1).max(5),
  language: z.enum(['ru', 'en']),
  count: z.coerce.number().min(1).max(20),
  additionalPrompt: z.string().optional(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

export function QuestionGeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });

  const categories = categoriesData?.data.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      difficulty: 3,
      language: 'ru',
      count: 5,
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: GenerateFormData) =>
      api.admin.ai.generateQuestions({
        category: data.category,
        difficulty: data.difficulty,
        language: data.language as 'ru' | 'en',
        count: data.count,
        additionalPrompt: data.additionalPrompt,
      }),
    onSuccess: (response) => {
      const result = response.data.data;
      setResults(result.questions);
      toast.success(`Сгенерировано: ${result.generated}, сохранено: ${result.saved}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
    onError: () => toast.error('Ошибка генерации'),
  });

  const onSubmit = (data: GenerateFormData) => {
    setResults(null);
    generateMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="AI Генерация вопросов"
        description="Используйте AI для создания новых вопросов"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Параметры генерации</CardTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Select
              id="category"
              label="Категория"
              options={categories.map((c) => ({ value: c.slug, label: c.name }))}
              placeholder="Выберите категорию"
              error={errors.category?.message}
              {...register('category')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                id="language"
                label="Язык"
                options={[
                  { value: LANGUAGES.RU, label: 'Русский' },
                  { value: LANGUAGES.EN, label: 'English' },
                ]}
                error={errors.language?.message}
                {...register('language')}
              />
              <Input
                id="difficulty"
                label="Сложность (1-5)"
                type="number"
                min={1}
                max={5}
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
            </div>

            <Input
              id="count"
              label="Количество (1-20)"
              type="number"
              min={1}
              max={20}
              error={errors.count?.message}
              {...register('count')}
            />

            <Textarea
              id="additionalPrompt"
              label="Дополнительные инструкции (необязательно)"
              placeholder="Например: сфокусируйся на теме космос..."
              rows={3}
              {...register('additionalPrompt')}
            />

            <Button
              type="submit"
              className="w-full"
              loading={generateMutation.isPending}
            >
              <Sparkles className="w-4 h-4" />
              Генерировать
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Результат</CardTitle>

          {generateMutation.isPending && (
            <div className="mt-4 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-text-secondary">Генерация вопросов...</p>
                <p className="text-xs text-text-secondary mt-1">Это может занять до минуты</p>
              </div>
            </div>
          )}

          {results && (
            <div className="mt-4 space-y-3 max-h-[500px] overflow-auto">
              {results.map((q, i) => (
                <div
                  key={i}
                  className="p-3 bg-surface-secondary rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="primary">
                      {String((q as Record<string, unknown>).type ?? 'unknown')}
                    </Badge>
                    <span className="text-xs text-text-secondary">#{i + 1}</span>
                  </div>
                  <pre className="text-xs font-mono text-text-secondary overflow-auto max-h-32">
                    {JSON.stringify(q, null, 2)}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        const qId = (q as Record<string, unknown>).id;
                        if (typeof qId === 'string') navigate(`/questions/${qId}`);
                      }}
                      className="text-xs text-blue hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Подробнее
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!generateMutation.isPending && !results && (
            <div className="mt-4 flex items-center justify-center py-12">
              <p className="text-sm text-text-secondary">
                Заполните параметры и нажмите «Генерировать»
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
