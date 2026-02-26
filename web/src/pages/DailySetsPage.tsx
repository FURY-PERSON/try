import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, Pencil } from 'lucide-react';
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
import { PageSizeSelect } from '@/components/ui/PageSizeSelect';

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
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'daily-sets', { page, limit }],
    queryFn: () => api.admin.dailySets.list({ page, limit }),
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
                  <TableHead className="w-20" />
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/daily-sets/${s.id}/edit`)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-blue hover:bg-blue/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Удалить набор?')) deleteMutation.mutate(s.id);
                          }}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex items-center gap-4">
                {meta && (
                  <p className="text-sm text-text-secondary">
                    Страница {meta.page} из {meta.totalPages}
                  </p>
                )}
                <PageSizeSelect
                  value={limit}
                  onChange={(size) => { setLimit(size); setPage(1); }}
                />
              </div>
              {meta && meta.totalPages > 1 && (
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
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
