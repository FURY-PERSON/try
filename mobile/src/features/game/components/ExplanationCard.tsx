import React, { useEffect } from 'react';
import { View, Text, ScrollView, Platform, StyleSheet, Linking, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';

type ExplanationCardProps = {
  statement: string;
  isTrue: boolean;
  userAnsweredCorrectly: boolean;
  explanation: string;
  source: string;
  sourceUrl?: string;
};

export const ExplanationCard: FC<ExplanationCardProps> = ({
  statement,
  isTrue,
  userAnsweredCorrectly,
  explanation,
  source,
  sourceUrl,
}) => {
  const { colors, borderRadius, elevation, gradients } = useThemeContext();
  const { t } = useTranslation();
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [opacity, translateY]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSourcePress = () => {
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
    }
  };

  const resultGradient: [string, string] = userAnsweredCorrectly
    ? gradients.success
    : gradients.danger;
  const resultIcon = userAnsweredCorrectly ? 'check-circle' : 'close-circle';
  const resultText = userAnsweredCorrectly ? t('game.correct') : t('game.incorrect');
  const truthLabel = isTrue ? t('game.fact') : t('game.fake');
  const truthColor = isTrue ? colors.emerald : colors.red;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.xxl,
          ...elevation.lg,
        },
        entranceStyle,
      ]}
    >
      <LinearGradient
        colors={resultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.resultBanner, { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl }]}
      >
        <MaterialCommunityIcons name={resultIcon} size={24} color="#FFFFFF" />
        <Text style={styles.resultText}>{resultText}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
      </ScrollView>
    </Animated.View>
  );
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    maxHeight: SCREEN_HEIGHT * 0.7,
    ...Platform.select({
      ios: { overflow: 'hidden' as const },
      android: {},
    }),
  },
  scrollBody: {
    flexGrow: 0,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  resultText: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  body: {
    padding: 24,
  },
  statement: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
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
    fontFamily: fontFamily.semiBold,
  },
  explanation: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
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
    fontFamily: fontFamily.medium,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
