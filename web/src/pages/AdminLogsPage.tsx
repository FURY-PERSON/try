import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
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

type AppLog = {
  id: string;
  type: string;
  message: string;
  meta: Record<string, unknown> | null;
  deviceId: string | null;
  createdAt: string;
};

type LogTypeCount = {
  type: string;
  count: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: typesData } = useQuery({
    queryKey: ['admin', 'logs', 'types'],
    queryFn: () => api.admin.logs.types(),
  });

  const logTypes: LogTypeCount[] = (typesData?.data as { data?: LogTypeCount[] } | undefined)?.data
    ?? (Array.isArray(typesData?.data) ? (typesData.data as unknown as LogTypeCount[]) : []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'logs', page, typeFilter],
    queryFn: () =>
      api.admin.logs.list({ page, limit: 30, type: typeFilter || undefined }),
  });

  const logs: AppLog[] = (data?.data as { data?: AppLog[] } | undefined)?.data ?? [];
  const total: number = (data?.data as { meta?: { total?: number } } | undefined)?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div>
      <PageHeader
        title="Логи"
        description={`Всего записей: ${total}`}
      />

      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setTypeFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            typeFilter === ''
              ? 'bg-primary text-white'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          Все
        </button>
        {logTypes.map((lt) => (
          <button
            key={lt.type}
            onClick={() => { setTypeFilter(lt.type); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === lt.type
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {lt.type} ({lt.count})
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
            <p className="text-sm">Не удалось загрузить логи.</p>
          </div>
        )}

        {!isLoading && !isError && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <FileText className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">Логов нет</p>
          </div>
        )}

        {!isLoading && !isError && logs.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Мета</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="default">{log.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-primary max-w-sm line-clamp-2">
                        {log.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.meta ? (
                        <pre className="text-xs text-text-secondary max-w-xs truncate">
                          {JSON.stringify(log.meta)}
                        </pre>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-text-secondary font-mono">
                        {log.deviceId ? log.deviceId.slice(0, 12) + '...' : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
