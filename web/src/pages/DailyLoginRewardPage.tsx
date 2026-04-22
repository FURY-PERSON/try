import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, AlertTriangle, Save, Gift } from 'lucide-react';
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
import type { DailyLoginRewardConfig, DailyLoginRewardEntry } from '@/api-client/types';

// ── Toggle Switch ─────────────────────────────────────────────────────────────

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

// ── Validation ────────────────────────────────────────────────────────────────

function validateConfig(config: DailyLoginRewardConfig): string | null {
  if (config.capShields < 1) return 'capShields должен быть ≥ 1';
  if (config.capStreak < 0) return 'capStreak должен быть ≥ 0';
  if (config.rewards.length === 0) return 'Должна быть хотя бы одна строка прогрессии';

  const sorted = [...config.rewards].sort((a, b) => a.day - b.day);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (!r) continue;
    if (r.day !== i + 1) {
      return `Дни должны идти подряд начиная с 1 (обнаружен разрыв на дне ${r.day})`;
    }
    if (r.shields < 0) return `День ${r.day}: щиты должны быть ≥ 0`;
    if (r.streak < 0) return `День ${r.day}: стрик должен быть ≥ 0`;
    if (r.shields > config.capShields) {
      return `День ${r.day}: щиты (${r.shields}) превышают capShields (${config.capShields})`;
    }
    if (r.streak > config.capStreak) {
      return `День ${r.day}: стрик (${r.streak}) превышает capStreak (${config.capStreak})`;
    }
  }
  return null;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DailyLoginRewardPage() {
  const queryClient = useQueryClient();

  const [isEnabled, setIsEnabled] = useState(false);
  const [capShields, setCapShields] = useState(10);
  const [capStreak, setCapStreak] = useState(10);
  const [rewards, setRewards] = useState<DailyLoginRewardEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'game-config', 'daily-login-reward'],
    queryFn: () => api.admin.gameConfig.getDailyLoginReward(),
  });

  useEffect(() => {
    const config = data?.data?.data;
    if (config) {
      setIsEnabled(config.isEnabled);
      setCapShields(config.capShields);
      setCapStreak(config.capStreak);
      setRewards([...config.rewards].sort((a, b) => a.day - b.day));
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
    mutationFn: (dto: DailyLoginRewardConfig) =>
      api.admin.gameConfig.updateDailyLoginReward(dto),
    onSuccess: () => {
      toast.success('Настройки ежедневного бонуса сохранены');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'game-config', 'daily-login-reward'],
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleToggle = () => {
    setIsEnabled((prev) => !prev);
    setHasChanges(true);
  };

  const handleAddDay = () => {
    const last = rewards[rewards.length - 1];
    const lastDay = last ? last.day : 0;
    setRewards((prev) => [
      ...prev,
      { day: lastDay + 1, shields: 0, streak: 0 },
    ]);
    setHasChanges(true);
  };

  const handleRemoveDay = (index: number) => {
    const filtered = rewards.filter((_, i) => i !== index);
    const renumbered = filtered.map((r, i) => ({ ...r, day: i + 1 }));
    setRewards(renumbered);
    setHasChanges(true);
  };

  const handleRewardChange = (
    index: number,
    field: 'shields' | 'streak',
    value: string,
  ) => {
    const numValue = parseInt(value, 10);
    const safe = Number.isFinite(numValue) && numValue >= 0 ? numValue : 0;
    setRewards((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: safe } : r)),
    );
    setHasChanges(true);
  };

  const handleCapChange = (field: 'capShields' | 'capStreak', value: string) => {
    const n = parseInt(value, 10);
    const safe = Number.isFinite(n) && n >= 0 ? n : 0;
    if (field === 'capShields') setCapShields(safe);
    else setCapStreak(safe);
    setHasChanges(true);
  };

  const handleSave = () => {
    const config: DailyLoginRewardConfig = {
      isEnabled,
      capShields,
      capStreak,
      rewards: [...rewards].sort((a, b) => a.day - b.day),
    };
    const err = validateConfig(config);
    if (err) {
      toast.error(err);
      return;
    }
    updateMutation.mutate(config);
  };

  return (
    <div>
      <PageHeader
        title="Ежедневный бонус за заход"
        description="Прогрессия наград (щиты + подарок к игровому стрику) за каждодневный заход"
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
            <p className="text-sm">
              Не удалось загрузить настройки. Попробуйте обновить страницу.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  <span className="inline-flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Ежедневный бонус
                  </span>
                </CardTitle>
                <CardDescription>
                  Каждый день захода пользователь получает щиты и подарок к игровому стрику. После пропуска дня счётчик сбрасывается.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch enabled={isEnabled} onChange={handleToggle} />
                <span className="text-sm text-text-secondary">
                  {isEnabled ? 'Включено' : 'Выключено'}
                </span>
              </div>
            </div>

            {isEnabled && (
              <>
                {/* Caps */}
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    label="Максимум щитов за день (cap)"
                    value={capShields}
                    onChange={(e) => handleCapChange('capShields', e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    label="Максимум стрика за день (cap)"
                    value={capStreak}
                    onChange={(e) => handleCapChange('capStreak', e.target.value)}
                  />
                </div>

                {/* Rewards table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">День</TableHead>
                        <TableHead>Щиты</TableHead>
                        <TableHead>Стрик</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <p className="text-center text-sm text-text-secondary py-4">
                              Нет записей. Нажмите «Добавить день» чтобы создать первую.
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                      {rewards.map((reward, index) => (
                        <TableRow key={reward.day}>
                          <TableCell>
                            <span className="text-sm font-medium text-text-primary">
                              {reward.day}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={capShields}
                              value={reward.shields}
                              onChange={(e) =>
                                handleRewardChange(index, 'shields', e.target.value)
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={capStreak}
                              value={reward.streak}
                              onChange={(e) =>
                                handleRewardChange(index, 'streak', e.target.value)
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleRemoveDay(index)}
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

                <Button variant="secondary" size="sm" onClick={handleAddDay}>
                  <Plus className="w-4 h-4" />
                  Добавить день
                </Button>

                {/* Preview */}
                {rewards.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                      Предпросмотр
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rewards.map((r) => (
                        <div
                          key={r.day}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
                        >
                          День {r.day}: +{r.shields} 🛡 +{r.streak} 🔥
                        </div>
                      ))}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-surface-secondary text-text-secondary">
                        Далее: capShields {capShields} / capStreak {capStreak}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

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
