import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { GAMES_PER_DAILY_SET } from '@wordpulse/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

const createSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  theme: z.string().min(1, 'Введите тему'),
  themeEn: z.string().min(1, 'Введите тему (EN)'),
  status: z.enum(['draft', 'scheduled']),
});

type CreateFormData = z.infer<typeof createSchema>;

export function DailySetCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const { data: questionsData } = useQuery({
    queryKey: ['admin', 'questions', { status: 'approved', limit: 100 }],
    queryFn: () => api.admin.questions.list({ status: 'approved', limit: 100 }),
  });

  const approvedQuestions = questionsData?.data.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      status: 'draft',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) =>
      api.admin.dailySets.create({
        ...data,
        questionIds: selectedQuestionIds,
      }),
    onSuccess: () => {
      toast.success('Набор создан');
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-sets'] });
      navigate('/daily-sets');
    },
    onError: () => toast.error('Ошибка создания набора'),
  });

  const onSubmit = (data: CreateFormData) => {
    if (selectedQuestionIds.length !== GAMES_PER_DAILY_SET) {
      toast.error(`Необходимо выбрать ровно ${GAMES_PER_DAILY_SET} вопросов`);
      return;
    }
    createMutation.mutate(data);
  };

  const addQuestion = (id: string) => {
    if (selectedQuestionIds.length >= GAMES_PER_DAILY_SET) return;
    if (selectedQuestionIds.includes(id)) return;
    setSelectedQuestionIds((prev) => [...prev, id]);
  };

  const removeQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => prev.filter((qId) => qId !== id));
  };

  const GAME_TYPE_LABELS: Record<string, string> = {
    anagram: 'Анаграмма',
    compose_words: 'Составь слова',
    word_chain: 'Цепочка',
    word_search: 'Поиск слов',
    guess_word: 'Угадай слово',
  };

  return (
    <div>
      <button
        onClick={() => navigate('/daily-sets')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <PageHeader title="Создать ежедневный набор" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Основная информация</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Input
              id="date"
              label="Дата"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />
            <Input
              id="theme"
              label="Тема (RU)"
              placeholder="Например: Космос и вселенная"
              error={errors.theme?.message}
              {...register('theme')}
            />
            <Input
              id="themeEn"
              label="Тема (EN)"
              placeholder="e.g. Space and Universe"
              error={errors.themeEn?.message}
              {...register('themeEn')}
            />
            <Select
              id="status"
              label="Статус"
              options={[
                { value: 'draft', label: 'Черновик' },
                { value: 'scheduled', label: 'Запланировать' },
              ]}
              {...register('status')}
            />

            <div className="pt-4">
              <p className="text-sm font-medium text-text-primary mb-2">
                Выбранные вопросы ({selectedQuestionIds.length}/{GAMES_PER_DAILY_SET})
              </p>
              {selectedQuestionIds.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Выберите вопросы из списка справа
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedQuestionIds.map((id, index) => {
                    const q = approvedQuestions.find((aq) => aq.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-secondary">
                            #{index + 1}
                          </span>
                          <Badge variant="primary">
                            {q ? (GAME_TYPE_LABELS[q.type] ?? q.type) : id.slice(0, 8)}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(id)}
                          className="p-1 text-text-secondary hover:text-red transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={createMutation.isPending}
              disabled={selectedQuestionIds.length !== GAMES_PER_DAILY_SET}
            >
              Создать набор
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Одобренные вопросы</CardTitle>
          <div className="mt-4 space-y-2 max-h-[600px] overflow-auto">
            {approvedQuestions.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                Нет одобренных вопросов
              </p>
            ) : (
              approvedQuestions
                .filter((q) => !selectedQuestionIds.includes(q.id))
                .map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg hover:bg-surface-secondary/80 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary">
                          {GAME_TYPE_LABELS[q.type] ?? q.type}
                        </Badge>
                        <span className="text-xs text-text-secondary">
                          {q.category?.name}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate max-w-[250px]">
                        {q.fact.slice(0, 80)}...
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={selectedQuestionIds.length >= GAMES_PER_DAILY_SET}
                      onClick={() => addQuestion(q.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
