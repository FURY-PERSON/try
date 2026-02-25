import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { referenceApi } from '@/features/onboarding/api/referenceApi';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';

export default function OnboardingStep4() {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { finishWithProfile, skip } = useOnboarding();
  const language = useSettingsStore((s) => s.language);

  const [nickname, setNickname] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');
  const [emojiGroups, setEmojiGroups] = useState<Record<string, string[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const loadOptions = useCallback(async () => {
    try {
      const options = await referenceApi.getNicknameOptions(language);
      setPlaceholder(options.placeholder);
      setSelectedEmoji(options.emoji);
    } catch {
      setPlaceholder(language === 'en' ? 'Swift Fox' : 'Быстрый Лис');
    }
  }, [language]);

  const loadEmojis = useCallback(async () => {
    try {
      const groups = await referenceApi.getAvatarEmojis();
      setEmojiGroups(groups);
    } catch {
      // Fallback emojis
      setEmojiGroups({
        animals: ['🦊', '🐱', '🦉', '🐺', '🐻', '🦅', '🐼', '🐯', '🐬', '🐧'],
        faces: ['😎', '🤓', '🧐', '😈', '👻', '🤖'],
      });
    }
  }, []);

  useEffect(() => {
    loadOptions();
    loadEmojis();
  }, [loadOptions, loadEmojis]);

  const handleRefresh = () => {
    loadOptions();
  };

  const handleContinue = async () => {
    const finalNickname = nickname.trim() || placeholder;

    if (nickname.trim().length > 0 && nickname.trim().length < 3) {
      setValidationError(t('onboarding.step4MinChars'));
      return;
    }

    setValidationError('');
    setLoading(true);
    await finishWithProfile(finalNickname, selectedEmoji);
    setLoading(false);
  };

  const allEmojis = Object.values(emojiGroups).flat();

  return (
    <Screen padded={false} backgroundColor={gradients.hero[0]}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <Pressable onPress={skip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {t('common.skip')} →
          </Text>
        </Pressable>

        <View style={styles.content}>
          <AnimatedEntrance delay={0} direction="up">
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('onboarding.step4Title')}
            </Text>
          </AnimatedEntrance>

          <AnimatedEntrance delay={100} direction="up">
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('onboarding.step4Desc')}
            </Text>
          </AnimatedEntrance>

          {/* Avatar emoji */}
          <AnimatedEntrance delay={200} direction="up">
            <Pressable
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              style={[styles.avatarCircle, { backgroundColor: colors.primary + '15' }]}
            >
              <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
            </Pressable>
            <Text style={[styles.tapHint, { color: colors.textTertiary }]}>
              {t('onboarding.step4TapToChange')}
            </Text>
          </AnimatedEntrance>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <AnimatedEntrance delay={0} direction="up">
              <View style={[styles.emojiPicker, { backgroundColor: colors.surface }]}>
                <ScrollView
                  horizontal={false}
                  contentContainerStyle={styles.emojiGrid}
                  showsVerticalScrollIndicator={false}
                  style={styles.emojiScroll}
                >
                  {allEmojis.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      style={[
                        styles.emojiItem,
                        emoji === selectedEmoji && {
                          backgroundColor: colors.primary + '20',
                        },
                      ]}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </AnimatedEntrance>
          )}

          {/* Nickname input */}
          <AnimatedEntrance delay={300} direction="up">
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                    borderColor: validationError ? colors.red : colors.border,
                  },
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                value={nickname}
                onChangeText={(text) => {
                  setNickname(text);
                  if (validationError) setValidationError('');
                }}
                maxLength={16}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Pressable onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialCommunityIcons name="refresh" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            {validationError ? (
              <Text style={[styles.errorText, { color: colors.red }]}>{validationError}</Text>
            ) : null}
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance delay={450} direction="up">
          <View style={styles.footer}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.buttonPadded}>
              <Button
                label={t('onboarding.start')}
                variant="primary"
                size="lg"
                onPress={handleContinue}
                loading={loading}
              />
            </View>
          </View>
        </AnimatedEntrance>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { alignSelf: 'flex-end', padding: 16 },
  skipText: { fontSize: 15, fontFamily: fontFamily.bold },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.extraBold,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 52,
  },
  tapHint: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  emojiPicker: {
    borderRadius: 16,
    padding: 12,
    width: '100%',
  },
  emojiScroll: {
    maxHeight: 160,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  buttonPadded: { paddingHorizontal: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24, borderRadius: 4 },
});
