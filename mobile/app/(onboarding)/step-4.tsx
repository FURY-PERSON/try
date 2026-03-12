import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { referenceApi } from '@/features/onboarding/api/referenceApi';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { s } from '@/utils/scale';

export default function OnboardingStep4() {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeContext();
  const { t } = useTranslation();
  const { finishWithProfile, skip } = useOnboarding();
  const language = useSettingsStore((s) => s.language);

  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');
  const [emojiGroups, setEmojiGroups] = useState<Record<string, string[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingNickname, setGeneratingNickname] = useState(false);
  const [validationError, setValidationError] = useState('');

  const loadOptions = useCallback(async () => {
    setGeneratingNickname(true);
    try {
      const options = await referenceApi.getNicknameOptions(language);
      setNickname(options.placeholder);
      setSelectedEmoji(options.emoji);
    } catch {
      setNickname(language === 'en' ? 'Swift Fox' : 'Быстрый Лис');
    } finally {
      setGeneratingNickname(false);
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
    const finalNickname = nickname.trim();

    if (finalNickname.length < 3) {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          <AnimatedEntrance delay={200} direction="up" style={{ alignItems: 'center' }}>
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
          <AnimatedEntrance delay={300} direction="up" style={{ alignSelf: 'stretch' }}>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  variant="answer"
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (validationError) setValidationError('');
                  }}
                  placeholder={t('nickname.placeholder')}
                  maxLength={16}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <Pressable
                onPress={handleRefresh}
                disabled={generatingNickname}
                style={[styles.regenerateBtn, { backgroundColor: colors.primary + '15' }]}
              >
                {generatingNickname ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name="refresh-cw" size={20} color={colors.primary} />
                )}
              </Pressable>
            </View>
            {validationError ? (
              <Text style={[styles.errorText, { color: colors.red }]}>{validationError}</Text>
            ) : null}
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance delay={450} direction="up">
          <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? 32 + insets.bottom : 32 }]}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
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
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { alignSelf: 'flex-end', padding: s(16) },
  skipText: { fontSize: s(15), fontFamily: fontFamily.bold },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    gap: s(12),
  },
  title: {
    fontSize: s(28),
    fontFamily: fontFamily.extraBold,
    lineHeight: s(36),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: s(16),
    fontFamily: fontFamily.semiBold,
    lineHeight: s(22),
    textAlign: 'center',
    marginBottom: s(8),
  },
  avatarCircle: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: s(52),
  },
  tapHint: {
    fontSize: s(13),
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    marginTop: s(4),
  },
  emojiPicker: {
    borderRadius: s(16),
    padding: s(12),
    width: '100%',
  },
  emojiScroll: {
    maxHeight: s(160),
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(4),
  },
  emojiItem: {
    width: s(44),
    height: s(44),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: s(28),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  regenerateBtn: {
    width: s(44),
    height: s(44),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: s(13),
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: s(16), paddingBottom: s(32), gap: s(16) },
  buttonPadded: { paddingHorizontal: s(4) },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: s(8) },
  dot: { width: s(8), height: s(8), borderRadius: s(4) },
  dotActive: { width: s(24), borderRadius: s(4) },
});
