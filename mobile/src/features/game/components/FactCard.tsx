import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import type { FC } from 'react';
import { s, isTablet } from '@/utils/scale';

// Static gradient point objects
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END_H = { x: 1, y: 0 } as const;

type FactCardProps = {
  explanation: string;
  source: string;
  sourceUrl?: string;
  illustrationUrl?: string;
  onNext: () => void;
  onShare: () => void;
};

export const FactCard: FC<FactCardProps> = React.memo(({
  explanation,
  source,
  sourceUrl,
  illustrationUrl,
  onNext,
  onShare,
}) => {
  const { colors, borderRadius, spacing, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const tabletCardSize = Math.min(width, height) - s(64);
  const tabletStyle = isTablet ? { width: tabletCardSize, height: tabletCardSize, alignSelf: 'center' as const } : undefined;

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
        tabletStyle,
      ]}
    >
      <LinearGradient
        colors={gradients.warm}
        start={GRADIENT_START}
        end={GRADIENT_END_H}
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
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(20),
    paddingVertical: s(14),
  },
  title: {
    fontSize: s(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  body: {
    padding: s(20),
  },
  illustration: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: s(12),
  },
  factText: {
    fontSize: s(16),
    fontFamily: fontFamily.semiBold,
    lineHeight: s(24),
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginTop: s(8),
  },
  sourceText: {
    fontSize: s(11),
    fontFamily: fontFamily.semiBold,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: s(20),
  },
});
