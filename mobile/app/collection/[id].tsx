import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';

export default function CollectionDetailScreen() {
  const { colors, spacing } = useThemeContext();
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
      ? collection.titleEn
      : collection.title
    : '';
  const description = collection
    ? language === 'en'
      ? collection.descriptionEn
      : collection.description
    : '';

  const handleStart = useCallback(async () => {
    if (!id || starting) return;
    setStarting(true);
    try {
      const session = await collectionsApi.start({
        type: 'collection',
        collectionId: id,
      });
      startCollectionSession(session.sessionId, 'collection', session.questions.length);
      analytics.logEvent('collection_start', {
        type: 'collection',
        referenceId: id,
        questionCount: session.questions.length,
      });
      router.push({
        pathname: '/game/card',
        params: { questions: JSON.stringify(session.questions), mode: 'collection' },
      });
    } catch {
      // Silently fail — user can retry
    } finally {
      setStarting(false);
    }
  }, [id, starting, startCollectionSession, router]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !collection) {
    return (
      <Screen>
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
    <Screen>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{collection.icon}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Info */}
        <Card variant="flat" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="help-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('collection.questions')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {collection._count.questions}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoItem}>
              <Feather name="tag" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('collection.type')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {t(`collection.types.${collection.type}`)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Completed badge */}
        {collection.completed && collection.lastResult && (
          <Card variant="flat" style={styles.completedCard}>
            <View style={styles.completedRow}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.completedTitle, { color: colors.primary }]}>
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
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
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
  content: {
    flex: 1,
    gap: 20,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  infoCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  infoValue: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  divider: {
    width: 1,
    height: 40,
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
    fontFamily: 'Nunito_700Bold',
  },
  completedResult: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
  },
  footer: {
    paddingHorizontal: 4,
    paddingBottom: 32,
    gap: 12,
  },
});
