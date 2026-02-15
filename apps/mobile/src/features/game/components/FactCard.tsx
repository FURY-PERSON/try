import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type FactCardProps = {
  fact: string;
  factSource: string;
  factSourceUrl?: string;
  illustrationUrl?: string;
  onNext: () => void;
  onShare: () => void;
};

export const FactCard: FC<FactCardProps> = ({
  fact,
  factSource,
  factSourceUrl,
  illustrationUrl,
  onNext,
  onShare,
}) => {
  const { colors, borderRadius, spacing } = useThemeContext();
  const { t } = useTranslation();

  const handleSourcePress = () => {
    if (factSourceUrl) {
      Linking.openURL(factSourceUrl);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.factCard,
          borderColor: colors.factCardBorder,
          borderRadius: borderRadius.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="book-open-variant" size={28} color={colors.gold} />
        <Text style={[styles.title, { color: colors.gold }]}>{t('fact.title')}</Text>
      </View>

      {illustrationUrl && (
        <Image
          source={{ uri: illustrationUrl }}
          style={[styles.illustration, { borderRadius: borderRadius.lg }]}
          contentFit="cover"
          transition={300}
        />
      )}

      <Text style={[styles.factText, { color: colors.textPrimary }]}>{fact}</Text>

      {factSource && (
        <Pressable onPress={handleSourcePress} style={styles.sourceRow}>
          <Feather name="link" size={12} color={colors.textSecondary} />
          <Text
            style={[
              styles.sourceText,
              { color: colors.textSecondary },
              factSourceUrl && styles.sourceLink,
            ]}
          >
            {factSource}
          </Text>
        </Pressable>
      )}

      <View style={styles.actions}>
        <Button
          label={t('common.share')}
          variant="ghost"
          size="md"
          fullWidth={false}
          onPress={onShare}
          iconLeft={<Feather name="share-2" size={16} color={colors.blue} />}
        />
        <View style={{ width: spacing.md }} />
        <Button
          label={`${t('common.next')} →`}
          variant="primary"
          size="md"
          fullWidth={false}
          onPress={onNext}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
  illustration: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 12,
  },
  factText: {
    fontSize: 17,
    fontFamily: 'Nunito_600SemiBold',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
});
