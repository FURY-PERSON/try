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
  const { colors, borderRadius } = useThemeContext();
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
          borderColor: resultColor,
          borderRadius: borderRadius.xl,
        },
      ]}
    >
      <View style={[styles.resultBadge, { backgroundColor: resultColor + '20' }]}>
        <MaterialCommunityIcons name={resultIcon} size={28} color={resultColor} />
        <Text style={[styles.resultText, { color: resultColor }]}>{resultText}</Text>
      </View>

      <Text style={[styles.statement, { color: colors.textSecondary }]}>
        «{statement}»
      </Text>

      <View style={[styles.truthBadge, { backgroundColor: truthColor + '15' }]}>
        <Text style={[styles.truthText, { color: truthColor }]}>
          {t('game.thisIs')} {truthLabel}
        </Text>
      </View>

      <Text style={[styles.explanation, { color: colors.textPrimary }]}>
        {explanation}
      </Text>

      {source && (
        <Pressable onPress={handleSourcePress} style={styles.sourceRow}>
          <Feather name="link" size={12} color={colors.textSecondary} />
          <Text
            style={[
              styles.sourceText,
              { color: colors.textSecondary },
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
    borderWidth: 2,
    marginHorizontal: 24,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },
  statement: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  truthBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  truthText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  explanation: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    lineHeight: 24,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
