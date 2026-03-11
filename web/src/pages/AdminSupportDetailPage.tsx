import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { SupportTicket } from '@/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminSupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'support', id],
    queryFn: () => api.admin.support.getById(id!),
    enabled: !!id,
  });

  const ticket = data?.data?.data as SupportTicket | undefined;

  const toggleMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') =>
      api.admin.support.update(id!, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support', id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
    },
    onError: () => {
      toast.error('Не удалось обновить статус');
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/support-requests')}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Заявка</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-text-secondary">Не удалось загрузить заявку.</p>
      )}

      {ticket && (
        <div className="max-w-xl space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={ticket.status === 'open' ? 'warning' : 'default'}>
                {ticket.status === 'open' ? 'Открыта' : 'Закрыта'}
              </Badge>
              <span className="text-xs text-text-secondary">{formatDate(ticket.createdAt)}</span>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">Email</p>
              <p className="text-sm font-medium text-text-primary">{ticket.email}</p>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">Описание</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </Card>

          <Button
            variant={ticket.status === 'open' ? 'primary' : 'ghost'}
            loading={toggleMutation.isPending}
            onClick={() =>
              toggleMutation.mutate(ticket.status === 'open' ? 'closed' : 'open')
            }
          >
            {ticket.status === 'open' ? 'Закрыть заявку' : 'Открыть заявку'}
          </Button>
        </div>
      )}
    </div>
  );
}
