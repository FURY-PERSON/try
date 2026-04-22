import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { showToast } from '@/stores/useToastStore';
import { s } from '@/utils/scale';
import { dailyLoginApi } from '@/features/daily-login/api/dailyLoginApi';
import { useDailyLoginStatus } from '@/features/daily-login/hooks/useDailyLoginStatus';
import { ProgressionStrip } from '@/features/daily-login/components/ProgressionStrip';

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_V = { x: 0, y: 1 } as const;

const SHIELD_COLOR = '#3B82F6';
const FIRE_COLOR = '#F59E0B';

type Params = {
  day?: string;
  shieldsToday?: string;
  streakToday?: string;
};

function n(raw: string | undefined): number {
  const v = parseInt(raw ?? '0', 10);
  return Number.isFinite(v) ? v : 0;
}

export default function DailyLoginBonusModal() {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<Params>();

  const day = n(params.day);
  const shieldsToday = n(params.shieldsToday);
  const streakToday = n(params.streakToday);

  const { data: status } = useDailyLoginStatus();
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await dailyLoginApi.claim();
      if (!result.claimed && !result.disabled) {
        // Сервер посчитал, что уже claimed (например, другой клиент) — просто закрываем
      }
      queryClient.invalidateQueries({ queryKey: ['home', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['daily-login', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
      router.back();
    } catch (err) {
      if (__DEV__) console.warn('[daily-login] claim failed', err);
      showToast(t('error.generic'));
      setClaiming(false);
    }
  };

  const iconScale = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);
  const iconRotate = useSharedValue(-6);

  useEffect(() => {
    analytics.logEvent('daily_login_bonus_shown', {
      day,
      shields: shieldsToday,
      streak: streakToday,
    });

    iconOpacity.value = withTiming(1, { duration: 280 });
    iconScale.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    iconRotate.value = withDelay(
      360,
      withSequence(
        withTiming(5, { duration: 140 }),
        withTiming(-3, { duration: 140 }),
        withTiming(0, { duration: 140 }),
      ),
    );
  }, [day, shieldsToday, streakToday]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const bgGradient = gradients.success;

  return (
    <Screen style={[styles.screen, { paddingTop: insets.top }]} paddingHorizontal={false}>
      <LinearGradient
        colors={[bgGradient[0] + '30', bgGradient[1] + '10', 'transparent']}
        start={GRADIENT_START}
        end={GRADIENT_END_V}
        style={styles.headerGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: s(24) }]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.paddedBlock}>
          <AnimatedEntrance delay={0} direction="up">
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              <MaterialCommunityIcons name="gift" size={s(96)} color={colors.primary} />
            </Animated.View>
          </AnimatedEntrance>

          <AnimatedEntrance delay={120} direction="up">
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('dailyLoginBonus.title')}
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={200} direction="up">
            <Text style={[styles.dayText, { color: colors.primary }]}>
              {t('dailyLoginBonus.dayLabel', { day })}
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={300} direction="up">
            <View style={[styles.rewardBanner, { backgroundColor: SHIELD_COLOR + '15' }]}>
              <MaterialCommunityIcons name="shield-check" size={s(22)} color={SHIELD_COLOR} />
              <Text style={[styles.rewardText, { color: SHIELD_COLOR }]}>
                {t('dailyLoginBonus.shields', { count: shieldsToday })}
              </Text>
            </View>
          </AnimatedEntrance>

          {streakToday > 0 && (
            <AnimatedEntrance delay={380} direction="up">
              <View style={[styles.rewardBanner, { backgroundColor: FIRE_COLOR + '15' }]}>
                <MaterialCommunityIcons name="fire" size={s(22)} color={FIRE_COLOR} />
                <Text style={[styles.rewardText, { color: FIRE_COLOR }]}>
                  {t('dailyLoginBonus.streak', { count: streakToday })}
                </Text>
              </View>
            </AnimatedEntrance>
          )}
        </View>

        {status && status.progression.length > 0 && (
          <AnimatedEntrance delay={480} direction="up">
            <View style={styles.progressionWrap}>
              <ProgressionStrip
                status={status}
                currentDay={day > 0 ? day : undefined}
                contentPaddingHorizontal={s(20)}
                bleedHorizontal={0}
              />
            </View>
          </AnimatedEntrance>
        )}
      </ScrollView>

      <AnimatedEntrance delay={620} direction="up">
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={t('dailyLoginBonus.claim')}
            variant="primary"
            size="lg"
            loading={claiming}
            onPress={handleClaim}
          />
        </View>
      </AnimatedEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: s(300),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: s(12),
    paddingTop: s(40),
  },
  paddedBlock: {
    paddingHorizontal: s(32),
    alignItems: 'center',
    gap: s(12),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: s(8),
  },
  title: {
    fontSize: s(26),
    fontFamily: fontFamily.bold,
    lineHeight: s(32),
    textAlign: 'center',
  },
  dayText: {
    fontSize: s(17),
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    borderRadius: s(12),
  },
  rewardText: {
    fontSize: s(16),
    fontFamily: fontFamily.bold,
  },
  progressionWrap: {
    marginTop: s(16),
  },
  footer: {
    paddingHorizontal: s(20),
    gap: s(12),
  },
});
