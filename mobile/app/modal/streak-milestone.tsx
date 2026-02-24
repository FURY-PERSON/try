import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';

export default function StreakMilestoneModal() {
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ days: string }>();
  const days = parseInt(params.days ?? '0', 10);

  const titleKey =
    days >= 100
      ? 'streakMilestone.title100'
      : days >= 30
        ? 'streakMilestone.title30'
        : 'streakMilestone.title7';

  // Animated fire icon
  const fireScale = useSharedValue(0);
  const fireRotate = useSharedValue(0);
  const numberScale = useSharedValue(0);

  useEffect(() => {
    analytics.logEvent('streak_milestone', { days });

    // Fire entrance
    fireScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    fireRotate.value = withSequence(
      withDelay(300, withSpring(-5, { damping: 4 })),
      withSpring(5, { damping: 4 }),
      withSpring(0, { damping: 8 }),
    );

    // Number dramatic reveal
    numberScale.value = withDelay(
      200,
      withSpring(1, { damping: 10, stiffness: 150 }),
    );
  }, [days]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fireScale.value },
      { rotate: `${fireRotate.value}deg` },
    ],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  return (
    <Screen style={styles.screen}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View style={fireStyle}>
            <MaterialCommunityIcons name="fire" size={120} color="#FFFFFF" />
          </Animated.View>

          <Animated.View style={numberStyle}>
            <Text style={styles.days}>{days}</Text>
          </Animated.View>

          <AnimatedEntrance delay={400} direction="up">
            <Text style={styles.title}>{t(titleKey)}</Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={500} direction="up">
            <Text style={styles.desc}>
              {t('streakMilestone.desc')}
            </Text>
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance delay={600} direction="up">
          <View style={styles.footer}>
            <Button
              label={t('common.continue')}
              variant="secondary"
              size="lg"
              onPress={() => router.back()}
            />
          </View>
        </AnimatedEntrance>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  days: {
    fontSize: 72,
    fontFamily: fontFamily.black,
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 80,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
    paddingHorizontal: 32,
    color: '#FFFFFF',
  },
  desc: {
    fontSize: 17,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 40,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
