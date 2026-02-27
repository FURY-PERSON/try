import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { IconFromName } from '@/components/ui/IconFromName';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';

export default function CollectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, spacing, borderRadius, elevation } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const language = useSettingsStore((s) => s.language);
  const startCollectionSession = useGameStore((s) => s.startCollectionSession);
  const [starting, setStarting] = useState(false);

  const { data: collection, isLoading, isError } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionsApi.getById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (id) {
      analytics.logEvent('collection_detail_viewed', { collectionId: id });
    }
  }, [id]);

  const title = collection
    ? language === 'en'
      ? (collection.titleEn || collection.title)
      : collection.title
    : '';
  const description = collection
    ? language === 'en'
      ? (collection.descriptionEn || collection.description)
      : collection.description
    : '';

  const handleStart = useCallback(async () => {
    if (!id || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'collection',
        collectionId: id,
        count: 30,
      });
      startCollectionSession(session.sessionId, 'collection', session.questions.length, session.questions);
      analytics.logEvent('collection_start', {
        type: 'collection',
        referenceId: id,
        questionCount: session.questions.length,
      });
      router.push({
        pathname: '/game/card',
        params: { mode: 'collection' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      Alert.alert('Error', message);
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  if (isLoading) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <View style={styles.center}>
          <Skeleton width={64} height={64} shape="rectangle" />
          <Skeleton width="60%" height={28} shape="rectangle" style={{ marginTop: 16 }} />
          <Skeleton width="80%" height={16} shape="rectangle" style={{ marginTop: 8 }} />
        </View>
      </Screen>
    );
  }

  if (isError || !collection) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('collection.notFound')}
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

  return (
    <Screen padded={false} backgroundColor={gradients.hero[0]}>
      {/* Gradient Hero Header */}
      <AnimatedEntrance delay={0}>
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}
        >
          <View style={[styles.iconContainer, { ...elevation.md }]}>
            <IconFromName name={collection.icon} size={44} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
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
                <View style={[styles.infoIconBg, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="help-circle" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                  {t('collection.questions')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {collection._count.questions}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.blue + '15' }]}>
                  <Feather name="tag" size={16} color={colors.blue} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>
                  {t('collection.type')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {t(`collection.types.${collection.type}`)}
                </Text>
              </View>
            </View>
          </Card>
        </AnimatedEntrance>

        {/* Completed badge */}
        {collection.completed && collection.lastResult && (
          <AnimatedEntrance delay={200}>
            <Card variant="default" style={styles.completedCard}>
              <View style={styles.completedRow}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.emerald + '15' }]}>
                  <Feather name="check-circle" size={18} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.completedTitle, { color: colors.emerald }]}>
                    {t('collection.completed')}
                  </Text>
                  <Text style={[styles.completedResult, { color: colors.textSecondary }]}>
                    {t('collection.lastScore', {
                      correct: collection.lastResult.correctAnswers,
                      total: collection.lastResult.totalQuestions,
                    })}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedEntrance>
        )}
      </View>

      {/* Footer */}
      <AnimatedEntrance delay={300}>
        <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
          <Button
            label={collection.completed ? t('collection.playAgain') : t('common.play')}
            variant="primary"
            size="lg"
            onPress={handleStart}
            loading={starting}
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
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
