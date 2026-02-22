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
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.stats.getDashboard(),
  });

  const stats = data?.data.data;

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
        description="Обзор состояния контента WordPulse"
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
    </div>
  );
}
