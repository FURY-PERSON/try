import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { GameHeader } from '@/features/game/components/GameHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDailySet } from '@/features/game/hooks/useDailySet';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeContext } from '@/theme';

const GAME_ROUTES = ['anagram', 'guess', 'compose', 'chain', 'search'] as const;

export default function DailyScreen() {
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const streak = useUserStore((s) => s.currentStreak);
  const { dailyProgress } = useGameStore();
  const { data, isLoading, isError, error, refetch } = useDailySet();

  useEffect(() => {
    if (dailyProgress.completed) {
      router.replace('/modal/results');
    }
  }, [dailyProgress.completed, router]);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={48} shape="rectangle" />
        <Skeleton width="100%" height={300} shape="card" style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState message={error?.message} onRetry={refetch} />
      </Screen>
    );
  }

  const currentIndex = dailyProgress.currentGameIndex;
  const totalGames = dailyProgress.totalGames;
  const currentRoute = GAME_ROUTES[currentIndex % GAME_ROUTES.length];

  const handleNext = () => {
    if (currentRoute) {
      router.push(`/game/${currentRoute}`);
    }
  };

  return (
    <Screen>
      <GameHeader
        progress={currentIndex / totalGames}
        streak={streak}
      />

      <View style={styles.content}>
        <Text style={[styles.gameIndex, { color: colors.textSecondary }]}>
          {t('home.progress', { current: currentIndex + 1, total: totalGames })}
        </Text>
        <Text style={[styles.gameTitle, { color: colors.textPrimary }]}>
          {currentRoute ? t(`game.${currentRoute}`) : ''}
        </Text>
        <Text style={[styles.gameDesc, { color: colors.textSecondary }]}>
          {currentRoute ? t(`game.${currentRoute}Desc`) : ''}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('common.play')}
          variant="primary"
          size="lg"
          onPress={handleNext}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  gameIndex: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameDesc: {
    fontSize: 17,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
