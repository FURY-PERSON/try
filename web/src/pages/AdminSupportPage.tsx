import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { SupportTicket } from '@/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

const STATUS_FILTER_OPTIONS = [
  { label: 'Все', value: '' },
  { label: 'Открытые', value: 'open' },
  { label: 'Закрытые', value: 'closed' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminSupportPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'support', page, statusFilter],
    queryFn: () =>
      api.admin.support.list({ page, limit: 20, status: statusFilter || undefined }),
  });

  const tickets: SupportTicket[] = (data?.data as { data?: SupportTicket[] } | undefined)?.data ?? [];
  const total: number = (data?.data as { total?: number } | undefined)?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'open' | 'closed' }) =>
      api.admin.support.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
    },
    onError: () => {
      toast.error('Не удалось обновить статус');
    },
  });

  const handleToggle = (ticket: SupportTicket) => {
    const next = ticket.status === 'open' ? 'closed' : 'open';
    toggleMutation.mutate({ id: ticket.id, status: next });
  };

  return (
    <div>
      <PageHeader
        title="Поддержка"
        description="Заявки от пользователей"
      />

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading && (
          <div className="space-y-3 p-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <p className="text-sm">Не удалось загрузить заявки. Попробуйте обновить страницу.</p>
          </div>
        )}

        {!isLoading && !isError && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Inbox className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">Заявок нет</p>
          </div>
        )}

        {!isLoading && !isError && tickets.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-surface-secondary"
                    onClick={() => navigate(`/admin/support-requests/${ticket.id}`)}
                  >
                    <TableCell>
                      <span className="text-sm text-text-primary">{ticket.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary line-clamp-2 max-w-sm">
                        {ticket.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={ticket.status === 'open' ? 'warning' : 'default'}>
                        {ticket.status === 'open' ? 'Открыта' : 'Закрыта'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggle(ticket); }}
                        disabled={toggleMutation.isPending}
                      >
                        {ticket.status === 'open' ? 'Закрыть' : 'Открыть'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  Стр. {page} из {totalPages} · всего {total}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
