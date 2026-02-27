import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications-history'],
    queryFn: () => api.admin.notifications.history({ page: 1, limit: 50 }),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.admin.notifications.send({ title, body }),
    onSuccess: () => {
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'notifications-history'],
      });
    },
  });

  const history = data?.data.data;
  const canSend = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div>
      <PageHeader
        title="Push-уведомления"
        description="Отправка уведомлений пользователям приложения"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send form */}
        <Card className="lg:col-span-1">
          <CardTitle>Отправить уведомление</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="Заголовок"
              placeholder="Новый ежедневный набор!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <Textarea
              label="Текст"
              placeholder="Проверьте свои знания с новыми вопросами..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {body.length}/500
              </span>
              <Button
                onClick={() => sendMutation.mutate()}
                loading={sendMutation.isPending}
                disabled={!canSend || sendMutation.isPending}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Отправить
              </Button>
            </div>
            {sendMutation.isSuccess && (
              <div className="text-sm text-primary bg-primary/10 rounded-lg p-3">
                Отправлено: {sendMutation.data.data.data.sent}, ошибок:{' '}
                {sendMutation.data.data.data.failed}
              </div>
            )}
            {sendMutation.isError && (
              <div className="text-sm text-red bg-red/10 rounded-lg p-3">
                Ошибка отправки
              </div>
            )}
          </div>
        </Card>

        {/* History */}
        <Card className="lg:col-span-2">
          <CardTitle>История отправок</CardTitle>
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : history?.items.length ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Заголовок</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Ошибок</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.items.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(n.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-text-secondary truncate max-w-[200px]">
                            {n.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{n.totalSent}</TableCell>
                      <TableCell>
                        {n.totalFailed > 0 ? (
                          <span className="text-red">{n.totalFailed}</span>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            n.status === 'failed' ? 'danger' : 'success'
                          }
                        >
                          {n.status === 'failed' ? 'Ошибка' : 'Отправлено'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-4">
              Ещё не было отправлено ни одного уведомления
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
