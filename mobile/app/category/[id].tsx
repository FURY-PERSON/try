import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { categoriesApi } from '@/features/home/api/categoriesApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';

export default function CategoryDetailScreen() {
  const { colors, gradients, spacing, borderRadius, elevation } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const language = useSettingsStore((s) => s.language);
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const [starting, setStarting] = useState(false);

  const { data: category, isLoading, isError } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (id) {
      analytics.logEvent('category_detail_viewed', { categoryId: id });
    }
  }, [id]);

  const name = category
    ? language === 'en'
      ? category.nameEn
      : category.name
    : '';
  const description = category
    ? language === 'en'
      ? category.descriptionEn
      : category.description
    : '';

  const handleStart = useCallback(async () => {
    if (!id || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'category',
        categoryId: id,
        count: 10,
      });
      startCollectionSession(session.sessionId, 'category', session.questions.length, session.questions);
      analytics.logEvent('category_start', {
        type: 'category',
        referenceId: id,
        questionCount: session.questions.length,
      });
      router.push({
        pathname: '/game/card',
        params: { mode: 'collection' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      Alert.alert(t('common.error'), message);
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Skeleton width={80} height={80} shape="rectangle" />
          <Skeleton width="60%" height={28} shape="rectangle" style={{ marginTop: 16 }} />
          <Skeleton width="80%" height={16} shape="rectangle" style={{ marginTop: 8 }} />
        </View>
      </Screen>
    );
  }

  if (isError || !category) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('category.notFound')}
          </Text>
          <Button
            label={t('common.back')}
            variant="secondary"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const categoryColor = category.color || colors.primary;

  return (
    <Screen padded={false}>
      {/* Gradient Hero Header */}
      <AnimatedEntrance delay={0}>
        <LinearGradient
          colors={[categoryColor + '25', categoryColor + '08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20', ...elevation.md }]}>
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          ) : null}
        </LinearGradient>
      </AnimatedEntrance>

      <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
        {/* Info */}
        <AnimatedEntrance delay={100}>
          <Card variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.emerald + '15' }]}>
                  <Feather name="check-circle" size={16} color={colors.emerald} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                  {t('category.available')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {category.availableCount}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="help-circle" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                  {t('category.total')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {category.totalCount}
                </Text>
              </View>
            </View>
          </Card>
        </AnimatedEntrance>

        {/* Last result */}
        {category.lastResult && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.emerald + '15' }]}>
                  <Feather name="check-circle" size={18} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.completedTitle, { color: colors.emerald }]}>
                    {t('category.lastResult')}
                  </Text>
                  <Text style={[styles.completedResult, { color: colors.textSecondary }]}>
                    {category.lastResult.correctAnswers}/{category.lastResult.totalQuestions}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedEntrance>
        )}

        {/* All done message */}
        {category.availableCount === 0 && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.gold + '15' }]}>
                  <Feather name="award" size={18} color={colors.gold} />
                </View>
                <Text style={[styles.completedTitle, { color: colors.gold }]}>
                  {t('category.allDone')}
                </Text>
              </View>
            </Card>
          </AnimatedEntrance>
        )}
      </View>

      {/* Footer */}
      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
          <Button
            label={category.lastResult ? t('category.playAgain') : t('category.start')}
            variant="primary"
            size="lg"
            onPress={handleStart}
            loading={starting}
            disabled={category.availableCount === 0}
            iconLeft={<Feather name="play" size={18} color="#FFFFFF" />}
          />
          <Button
            label={t('common.back')}
            variant="secondary"
            size="lg"
            onPress={() => router.back()}
          />
        </View>
      </AnimatedEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  heroHeader: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    gap: 16,
  },
  infoCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  infoValue: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.3,
  },
  divider: {
    width: 1,
    height: 48,
  },
  completedCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  completedResult: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  footer: {
    paddingBottom: 32,
    gap: 12,
  },
});
