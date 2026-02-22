import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  scheduled: 'warning',
  published: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирован',
  published: 'Опубликован',
};

export function DailySetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'daily-sets', { page }],
    queryFn: () => api.admin.dailySets.list({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.dailySets.delete(id),
    onSuccess: () => {
      toast.success('Набор удалён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-sets'] });
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const sets = data?.data.data ?? [];
  const meta = data?.data.meta;

  return (
    <div>
      <PageHeader
        title="Ежедневные наборы"
        description={meta ? `Всего: ${meta.total}` : undefined}
        actions={
          <Button size="sm" onClick={() => navigate('/daily-sets/create')}>
            <Plus className="w-4 h-4" />
            Создать набор
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Нет наборов"
            description="Создайте первый ежедневный набор вопросов"
            action={
              <Button size="sm" onClick={() => navigate('/daily-sets/create')}>
                Создать набор
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead>Тема (EN)</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sets.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">
                      {format(new Date(s.date), 'd MMMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>{s.theme}</TableCell>
                    <TableCell className="text-text-secondary">{s.themeEn}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[s.status] ?? 'default'}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary text-xs">
                      {format(new Date(s.createdAt), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          if (confirm('Удалить набор?')) deleteMutation.mutate(s.id);
                        }}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  Страница {meta.page} из {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
