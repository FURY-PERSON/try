import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Trash2, ExternalLink, Image, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { QUESTION_STATUS_LABELS, STATUS_BADGE_VARIANT, DIFFICULTY_LABELS } from '@/shared';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { QuestionEditDialog } from '@/components/QuestionEditDialog';


export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', id],
    queryFn: () => api.admin.questions.getById(id!),
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const question = data?.data.data;

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
      <div className="mb-4">
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </button>
      </div>

      <PageHeader
        title="Утверждение"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
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

      <div className="space-y-4">
        {/* Compact metadata bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-xs text-text-secondary truncate max-w-[180px]" title={question.id}>
              {question.id}
            </span>
            <Badge variant={STATUS_BADGE_VARIANT[question.status] ?? 'default'}>
              {QUESTION_STATUS_LABELS[question.status] ?? question.status}
            </Badge>
            <Badge variant={question.isTrue ? 'success' : 'danger'}>
              {question.isTrue ? 'Факт' : 'Фейк'}
            </Badge>
            <span className="text-sm text-text-secondary">
              {question.category?.name ?? '—'}
            </span>
            <span className="text-sm text-text-secondary">
              Сложность: {question.difficulty} — {DIFFICULTY_LABELS[question.difficulty as number] ?? '?'}
            </span>
            {question.timesShown > 0 && (
              <span className="text-sm text-text-secondary">
                {question.timesShown} показов ·{' '}
                {Math.round((question.timesCorrect / question.timesShown) * 100)}% правильных
                {question.avgTimeSeconds > 0 && ` · ${question.avgTimeSeconds}с`}
              </span>
            )}
          </div>
          {question.categories && question.categories.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border">
              {question.categories.map((qc: any) => (
                <Badge key={qc.id} variant="default" className="text-xs">
                  {qc.category?.icon} {qc.category?.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Statement */}
        <Card className="p-4">
          <p className="text-base font-medium leading-relaxed text-text-primary">
            {question.statement}
          </p>
          {question.statementEn && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed italic">
              EN: {question.statementEn}
            </p>
          )}
        </Card>

        {/* Explanation + Illustration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <CardTitle className="text-sm mb-2">Объяснение</CardTitle>
            <p className="text-sm text-text-primary leading-relaxed">{question.explanation}</p>
            {question.explanationEn && (
              <p className="mt-1.5 text-xs text-text-secondary leading-relaxed italic">
                EN: {question.explanationEn}
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <p className="text-xs text-text-secondary">Источник: {question.source}</p>
              {question.sourceEn && (
                <p className="text-xs text-text-secondary italic">Source (EN): {question.sourceEn}</p>
              )}
              {question.sourceUrl && (
                <a
                  href={question.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Проверить источник (RU)
                </a>
              )}
              {question.sourceUrlEn && (
                <a
                  href={question.sourceUrlEn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue hover:underline ml-3"
                >
                  <ExternalLink className="w-3 h-3" />
                  Source link (EN)
                </a>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm">Иллюстрация</CardTitle>
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
                className="rounded-lg w-full h-44 object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-44 bg-surface-secondary rounded-lg">
                <p className="text-sm text-text-secondary">Нет иллюстрации</p>
              </div>
            )}
            {question.illustrationPrompt && (
              <p className="mt-2 text-xs text-text-secondary line-clamp-2">
                Промпт: {question.illustrationPrompt}
              </p>
            )}
          </Card>
        </div>
      </div>

      <QuestionEditDialog
        questionId={id ?? null}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin', 'questions', id] })}
      />
    </div>
  );
}
