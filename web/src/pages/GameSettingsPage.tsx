import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { api } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';

// ── Toggle Switch ───────────────────────────────────────────────────────────

type ToggleSwitchProps = {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
};

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

type StreakTier = {
  minStreak: number;
  bonusPercent: number;
};

type StreakBonusConfig = {
  enabled: boolean;
  tiers: StreakTier[];
};

// ── Streak color helper ─────────────────────────────────────────────────────

function getStreakColor(minStreak: number): string {
  if (minStreak >= 40) return '#9333EA';
  if (minStreak >= 30) return '#DC2626';
  if (minStreak >= 20) return '#EF4444';
  if (minStreak >= 10) return '#F97316';
  if (minStreak >= 5) return '#EAB308';
  return '#22C55E';
}

// ── Validation ──────────────────────────────────────────────────────────────

function validateTiers(tiers: StreakTier[]): string | null {
  for (const tier of tiers) {
    if (!tier.minStreak || tier.minStreak <= 0) {
      return 'Мин. стрик должен быть больше 0';
    }
    if (!tier.bonusPercent || tier.bonusPercent <= 0) {
      return 'Бонус % должен быть больше 0';
    }
  }

  const streakValues = tiers.map((t) => t.minStreak);
  const uniqueValues = new Set(streakValues);
  if (uniqueValues.size !== streakValues.length) {
    return 'Значения мин. стрика не должны повторяться';
  }

  return null;
}

// ── Main Page ───────────────────────────────────────────────────────────────

export function GameSettingsPage() {
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState(false);
  const [tiers, setTiers] = useState<StreakTier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'game-config', 'streak-bonus'],
    queryFn: () => api.admin.gameConfig.getStreakBonus(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      const config = data.data.data as StreakBonusConfig;
      setEnabled(config.enabled);
      setTiers([...config.tiers].sort((a, b) => a.minStreak - b.minStreak));
      setHasChanges(false);
    }
  }, [data]);

  const extractErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      return error.response?.data?.error ?? 'Ошибка сервера';
    }
    return 'Неизвестная ошибка';
  };

  const updateMutation = useMutation({
    mutationFn: (dto: StreakBonusConfig) => api.admin.gameConfig.updateStreakBonus(dto),
    onSuccess: () => {
      toast.success('Настройки стрик-бонуса сохранены');
      queryClient.invalidateQueries({ queryKey: ['admin', 'game-config', 'streak-bonus'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleToggle = () => {
    setEnabled((prev) => !prev);
    setHasChanges(true);
  };

  const handleAddTier = () => {
    setTiers((prev) => [...prev, { minStreak: 0, bonusPercent: 0 }]);
    setHasChanges(true);
  };

  const handleRemoveTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleTierChange = (index: number, field: keyof StreakTier, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: numValue } : tier)),
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    const validationError = validateTiers(tiers);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const sorted = [...tiers].sort((a, b) => a.minStreak - b.minStreak);
    setTiers(sorted);
    updateMutation.mutate({ enabled, tiers: sorted });
  };

  const sortedPreviewTiers = [...tiers]
    .filter((t) => t.minStreak > 0 && t.bonusPercent > 0)
    .sort((a, b) => a.minStreak - b.minStreak);

  return (
    <div>
      <PageHeader
        title="Настройки игры"
        description="Конфигурация игровых механик и бонусов"
      />

      <Card>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <AlertTriangle className="w-8 h-8 mb-3 text-red-400" />
            <p className="text-sm">Не удалось загрузить настройки. Попробуйте обновить страницу.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Бонус за стрик 🔥</CardTitle>
                <CardDescription>
                  Настройте процент бонуса к очкам в зависимости от текущего стрика игрока
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch enabled={enabled} onChange={handleToggle} />
                <span className="text-sm text-text-secondary">
                  {enabled ? 'Включено' : 'Выключено'}
                </span>
              </div>
            </div>

            {/* Tiers table */}
            {enabled && (
              <>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Мин. стрик</TableHead>
                        <TableHead>Бонус %</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3}>
                            <p className="text-center text-sm text-text-secondary py-4">
                              Нет ступеней. Нажмите «Добавить ступень» чтобы создать первую.
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                      {tiers.map((tier, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={tier.minStreak || ''}
                              onChange={(e) => handleTierChange(index, 'minStreak', e.target.value)}
                              placeholder="5"
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={tier.bonusPercent || ''}
                              onChange={(e) => handleTierChange(index, 'bonusPercent', e.target.value)}
                              placeholder="10"
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleRemoveTier(index)}
                              className="p-1.5 rounded-lg text-text-secondary hover:bg-red/10 hover:text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button variant="secondary" size="sm" onClick={handleAddTier}>
                  <Plus className="w-4 h-4" />
                  Добавить ступень
                </Button>

                {/* Preview */}
                {sortedPreviewTiers.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                      Предпросмотр
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortedPreviewTiers.map((tier) => (
                        <div
                          key={tier.minStreak}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: getStreakColor(tier.minStreak) }}
                        >
                          Стрик {tier.minStreak}+ → +{tier.bonusPercent}% к очкам
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Save */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                loading={updateMutation.isPending}
                disabled={!hasChanges}
              >
                <Save className="w-4 h-4" />
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
