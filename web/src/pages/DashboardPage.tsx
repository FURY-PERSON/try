import { useQuery } from '@tanstack/react-query';
import {
  Users,
  HelpCircle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Очень лёгкий',
  2: 'Лёгкий',
  3: 'Средний',
  4: 'Сложный',
  5: 'Очень сложный',
};

function BarChart({
  data,
  label,
}: {
  data: { date: string; count: number }[];
  label: string;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <p className="text-sm text-text-secondary mb-3">{label}</p>
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d) => {
          const height = Math.max((d.count / maxCount) * 100, 2);
          return (
            <div
              key={d.date}
              className="flex-1 group relative"
              style={{ height: '100%' }}
            >
              <div
                className="absolute bottom-0 w-full bg-primary/70 hover:bg-primary rounded-t transition-colors"
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-surface border border-border rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {d.date.slice(5)}: {d.count}
              </div>
            </div>
          );
        })}
      </div>
      {data.length > 0 && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-secondary">{data[0]!.date.slice(5)}</span>
          <span className="text-[10px] text-text-secondary">{data[data.length - 1]!.date.slice(5)}</span>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.stats.getDashboard(),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'user-analytics'],
    queryFn: () => api.admin.stats.getUserAnalytics(),
  });

  const stats = data?.data.data;
  const analytics = analyticsData?.data.data;

  const cards = [
    {
      label: 'Пользователи',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue',
      bgColor: 'bg-blue/10',
    },
    {
      label: 'Активно сегодня',
      value: stats?.activeToday ?? 0,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Всего вопросов',
      value: stats?.totalQuestions ?? 0,
      icon: HelpCircle,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Одобрено',
      value: stats?.approvedQuestions ?? 0,
      icon: CheckCircle,
      color: 'text-primary-dark',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'На модерации',
      value: stats?.pendingQuestions ?? 0,
      icon: Clock,
      color: 'text-orange',
      bgColor: 'bg-orange/10',
    },
    {
      label: 'Ежедневных наборов',
      value: stats?.publishedSets ?? 0,
      icon: Calendar,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Дашборд"
        description="Обзор состояния контента Факт или Фейк"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.label} className="flex items-center gap-4">
            {isLoading ? (
              <>
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-12 h-6" />
                </div>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {card.value.toLocaleString('ru-RU')}
                  </p>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Questions by Category + Difficulty */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Вопросы по категориям</CardTitle>
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {stats?.questionsByCategory.map((cat) => (
                <div
                  key={cat.categoryId}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    cat.count < 10 ? 'bg-red/5' : 'bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-text-primary">
                      {cat.categoryName}
                    </span>
                  </div>
                  <Badge variant={cat.count < 10 ? 'danger' : 'default'}>
                    {cat.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Распределение по сложности</CardTitle>
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3 mt-4">
              {stats?.questionsByDifficulty.map((d) => (
                <div
                  key={d.difficulty}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-surface-secondary"
                >
                  <span className="text-2xl font-bold text-text-primary">
                    {d.count}
                  </span>
                  <span className="text-xs text-text-secondary text-center">
                    {DIFFICULTY_LABELS[d.difficulty] ?? `Ур. ${d.difficulty}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* User Analytics: DAU + New Users */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Активные пользователи (DAU)</CardTitle>
            {analytics && (
              <Badge variant="primary">
                Точность: {analytics.overallAccuracy}%
              </Badge>
            )}
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full mt-4" />
          ) : analytics?.dau.length ? (
            <div className="mt-4">
              <BarChart data={analytics.dau} label="Уникальные игроки за 30 дней" />
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-4">Нет данных</p>
          )}
        </Card>

        <Card>
          <CardTitle>Новые пользователи</CardTitle>
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full mt-4" />
          ) : analytics?.newUsers.length ? (
            <div className="mt-4">
              <BarChart data={analytics.newUsers} label="Регистрации за 30 дней" />
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-4">Нет данных</p>
          )}
        </Card>
      </div>

      {/* Top Players */}
      <div className="mt-8">
        <Card>
          <CardTitle>Топ-10 игроков</CardTitle>
          {analyticsLoading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : analytics?.topPlayers.length ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Игрок</TableHead>
                    <TableHead>Очки</TableHead>
                    <TableHead>Верных</TableHead>
                    <TableHead>Игр</TableHead>
                    <TableHead>Лучшая серия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topPlayers.map((player, idx) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <span className="mr-1">{player.avatarEmoji}</span>
                        {player.nickname ?? 'Аноним'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {player.totalScore.toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>{player.totalCorrectAnswers}</TableCell>
                      <TableCell>{player.totalGamesPlayed}</TableCell>
                      <TableCell>{player.bestAnswerStreak}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-4">Нет данных</p>
          )}
        </Card>
      </div>
    </div>
  );
}
