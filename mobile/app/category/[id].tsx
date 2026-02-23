import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { categoriesApi } from '@/features/home/api/categoriesApi';
import { collectionsApi } from '@/features/collections/api/collectionsApi';
import { useGameStore } from '@/features/game/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { analytics } from '@/services/analytics';

export default function CategoryDetailScreen() {
  const { colors } = useThemeContext();
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
      startCollectionSession(session.sessionId, 'category', session.questions.length);
      analytics.logEvent('category_start', {
        type: 'category',
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

  return (
    <Screen>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: category.color + '20' }]}>
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
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
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('category.available')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {category.availableCount}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoItem}>
              <Feather name="help-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('category.total')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {category.totalCount}
              </Text>
            </View>
          </View>
        </Card>

        {/* Last result */}
        {category.lastResult && (
          <Card variant="flat" style={styles.completedCard}>
            <View style={styles.completedRow}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.completedTitle, { color: colors.primary }]}>
                  {t('category.lastResult')}
                </Text>
                <Text style={[styles.completedResult, { color: colors.textSecondary }]}>
                  {category.lastResult.correctAnswers}/{category.lastResult.totalQuestions}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* All done message */}
        {category.availableCount === 0 && (
          <Card variant="flat" style={styles.completedCard}>
            <View style={styles.completedRow}>
              <Feather name="award" size={20} color={colors.primary} />
              <Text style={[styles.completedTitle, { color: colors.primary }]}>
                {t('category.allDone')}
              </Text>
            </View>
          </Card>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
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
