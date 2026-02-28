import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';

type FactCardProps = {
  explanation: string;
  source: string;
  sourceUrl?: string;
  illustrationUrl?: string;
  onNext: () => void;
  onShare: () => void;
};

export const FactCard: FC<FactCardProps> = ({
  explanation,
  source,
  sourceUrl,
  illustrationUrl,
  onNext,
  onShare,
}) => {
  const { colors, borderRadius, spacing, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();

  const handleSourcePress = () => {
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
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
          ...elevation.md,
        },
      ]}
    >
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}
      >
        <MaterialCommunityIcons name="book-open-variant" size={24} color="#FFFFFF" />
        <Text style={styles.title}>{t('fact.title')}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {illustrationUrl && (
          <Image
            source={{ uri: illustrationUrl }}
            style={[styles.illustration, { borderRadius: borderRadius.lg }]}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
            cachePolicy="memory-disk"
          />
        )}

        <Text style={[styles.factText, { color: colors.textPrimary }]}>{explanation}</Text>

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

        <View style={styles.actions}>
          <Button
            label={t('common.share')}
            variant="ghost"
            size="md"
            fullWidth={false}
            onPress={onShare}
            iconLeft={<Feather name="share-2" size={16} color={colors.primary} />}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  body: {
    padding: 20,
  },
  illustration: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 12,
  },
  factText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
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
    fontFamily: fontFamily.semiBold,
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
