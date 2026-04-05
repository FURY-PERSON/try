type StreakBonusTier = { minStreak: number; bonusPercent: number };

export function getStreakBonusPercent(
  streak: number,
  tiers: StreakBonusTier[] | undefined | null,
): number {
  if (!tiers || tiers.length === 0 || streak <= 0) return 0;
  const sorted = [...tiers].sort((a, b) => b.minStreak - a.minStreak);
  const tier = sorted.find((t) => streak >= t.minStreak);
  return tier?.bonusPercent ?? 0;
}
