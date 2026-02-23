import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type ExplanationCardProps = {
  statement: string;
  isTrue: boolean;
  userAnsweredCorrectly: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
  onNext: () => void;
};

export const ExplanationCard: FC<ExplanationCardProps> = ({
  statement,
  isTrue,
  userAnsweredCorrectly,
  explanation,
  source,
  sourceUrl,
  onNext,
}) => {
  const { colors, borderRadius, elevation } = useThemeContext();
  const { t } = useTranslation();

  const handleSourcePress = () => {
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
    }
  };

  const resultColor = userAnsweredCorrectly ? colors.primary : colors.red;
  const resultIcon = userAnsweredCorrectly ? 'check-circle' : 'close-circle';
  const resultText = userAnsweredCorrectly ? t('game.correct') : t('game.incorrect');
  const truthLabel = isTrue ? t('game.fact') : t('game.fake');
  const truthColor = isTrue ? colors.primary : colors.red;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xxl,
          ...elevation.md,
        },
      ]}
    >
      <View style={[styles.resultBadge, { backgroundColor: resultColor + '15' }]}>
        <MaterialCommunityIcons name={resultIcon} size={24} color={resultColor} />
        <Text style={[styles.resultText, { color: resultColor }]}>{resultText}</Text>
      </View>

      <Text style={[styles.statement, { color: colors.textSecondary }]}>
        «{statement}»
      </Text>

      <View style={[styles.truthBadge, { backgroundColor: truthColor + '12' }]}>
        <Text style={[styles.truthText, { color: truthColor }]}>
          {t('game.thisIs')} {truthLabel}
        </Text>
      </View>

      <Text style={[styles.explanation, { color: colors.textPrimary }]}>
        {explanation}
      </Text>

      {source && (
        <Pressable onPress={handleSourcePress} style={styles.sourceRow}>
          <Feather name="link" size={12} color={colors.textTertiary} />
          <Text
            style={[
              styles.sourceText,
              { color: colors.textTertiary },
              sourceUrl && styles.sourceLink,
            ]}
          >
            {source}
          </Text>
        </Pressable>
      )}

      <Button
        label={`${t('common.next')} →`}
        variant="primary"
        size="lg"
        onPress={onNext}
        style={{ marginTop: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginHorizontal: 24,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  statement: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  truthBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 16,
  },
  truthText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
  explanation: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
