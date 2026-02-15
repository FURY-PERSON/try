import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Trash2, ExternalLink, Image } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  moderation: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const GAME_TYPE_LABELS: Record<string, string> = {
  anagram: 'Анаграмма',
  compose_words: 'Составь слова',
  word_chain: 'Цепочка слов',
  word_search: 'Поиск слов',
  guess_word: 'Угадай слово',
};

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', id],
    queryFn: () => api.admin.questions.getById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => api.admin.questions.approve(id!),
    onSuccess: () => {
      toast.success('Вопрос одобрен');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.admin.questions.reject(id!),
    onSuccess: () => {
      toast.success('Вопрос отклонён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.questions.delete(id!),
    onSuccess: () => {
      toast.success('Вопрос удалён');
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

  const question = data?.data.data;

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
        <p className="text-text-secondary">Вопрос не найден</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/questions')}>
          К списку вопросов
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
        title={`Вопрос: ${GAME_TYPE_LABELS[question.type] ?? question.type}`}
        actions={
          <div className="flex gap-2">
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
                if (confirm('Удалить вопрос?')) deleteMutation.mutate();
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
                  {question.status}
                </Badge>
              }
            />
            <InfoRow label="Тип" value={GAME_TYPE_LABELS[question.type] ?? question.type} />
            <InfoRow label="Категория" value={question.category?.name ?? '—'} />
            <InfoRow label="Язык" value={question.language.toUpperCase()} />
            <InfoRow label="Сложность" value={`${question.difficulty}/5`} />
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
          <CardTitle>Данные вопроса</CardTitle>
          <pre className="mt-4 bg-surface-secondary rounded-lg p-4 text-xs font-mono overflow-auto max-h-64">
            {JSON.stringify(question.questionData, null, 2)}
          </pre>
        </Card>

        <Card>
          <CardTitle>Факт</CardTitle>
          <p className="mt-4 text-sm text-text-primary leading-relaxed">
            {question.fact}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-text-secondary">
              Источник: {question.factSource}
            </p>
            {question.factSourceUrl && (
              <a
                href={question.factSourceUrl}
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
