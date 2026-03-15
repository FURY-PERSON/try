import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { useUserStore } from '@/stores/useUserStore';
import { profileApi } from '@/features/profile/api/profileApi';
import { referenceApi } from '@/features/onboarding/api/referenceApi';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import { analytics } from '@/services/analytics';
import { showToast } from '@/stores/useToastStore';
import { s } from '@/utils/scale';

export default function NicknameModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentNickname = useUserStore((s) => s.nickname);
  const currentEmoji = useUserStore((s) => s.avatarEmoji);
  const setNickname = useUserStore((s) => s.setNickname);
  const setAvatarEmoji = useUserStore((s) => s.setAvatarEmoji);

  const [value, setValue] = useState(currentNickname ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji ?? '🦊');
  const [emojiGroups, setEmojiGroups] = useState<Record<string, string[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(true);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = value.length >= 3 && value.length <= 32;

  useEffect(() => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    if (!isValid || value === currentNickname) {
      setNicknameAvailable(true);
      return;
    }

    checkTimerRef.current = setTimeout(async () => {
      try {
        const available = await profileApi.checkNickname(value);
        setNicknameAvailable(available);
      } catch {
        setNicknameAvailable(true);
      }
    }, 500);

    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [value, isValid, currentNickname]);

  const loadEmojis = useCallback(async () => {
    try {
      const groups = await referenceApi.getAvatarEmojis();
      setEmojiGroups(groups);
    } catch {
      setEmojiGroups({
        animals: ['🦊', '🐱', '🦉', '🐺', '🐻', '🦅', '🐼', '🐯', '🐬', '🐧'],
        faces: ['😎', '🤓', '🧐', '😈', '👻', '🤖'],
      });
    }
  }, []);

  useEffect(() => {
    loadEmojis();
  }, [loadEmojis]);

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await profileApi.updateProfile({ nickname: value, avatarEmoji: selectedEmoji });
      setNickname(value);
      setAvatarEmoji(selectedEmoji);
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      analytics.logEvent('profile_updated');
      router.back();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const user = await profileApi.regenerateNickname();
      setValue(user.nickname ?? '');
      if (user.avatarEmoji) setSelectedEmoji(user.avatarEmoji);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setRegenerating(false);
    }
  };

  const allEmojis = Object.values(emojiGroups).flat();

  return (
    <Screen style={[styles.screen, { paddingTop: insets.top }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Avatar emoji */}
        <AnimatedEntrance delay={0} direction="up" style={styles.avatarSection}>
          <Pressable
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            style={[styles.avatarCircle, { backgroundColor: colors.primary + '15' }]}
          >
            <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
          </Pressable>
          <Text style={[styles.tapHint, { color: colors.textTertiary }]}>
            {t('nickname.tapToChangeAvatar')}
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

        <AnimatedEntrance delay={100} direction="up">
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('nickname.title')}
          </Text>
        </AnimatedEntrance>

        <AnimatedEntrance delay={200} direction="up" style={styles.inputFullWidth}>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Input
                variant="answer"
                value={value}
                onChangeText={setValue}
                placeholder={t('nickname.placeholder')}
                autoFocus
                maxLength={32}
              />
            </View>
            <Pressable
              onPress={handleRegenerate}
              disabled={regenerating}
              style={[styles.regenerateBtn, { backgroundColor: colors.primary + '15' }]}
              accessibilityLabel={t('nickname.regenerate')}
              accessibilityRole="button"
            >
              {regenerating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="refresh-cw" size={20} color={colors.primary} />
              )}
            </Pressable>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={300} direction="up">
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {t('nickname.hint')}
          </Text>
        </AnimatedEntrance>


      <AnimatedEntrance delay={400} direction="up">
        <View style={styles.footer}>
          <Button
            label={isValid && !nicknameAvailable ? t('nickname.alreadyTaken') : t('common.save')}
            variant="primary"
            size="lg"
            disabled={!isValid || !nicknameAvailable}
            loading={loading}
            onPress={handleSave}
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </AnimatedEntrance>
      </ScrollView>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: s(32),
    gap: s(16),
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: s(2),
  },
  avatarCircle: {
    width: s(88),
    height: s(88),
    borderRadius: s(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: s(46),
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
  title: {
    fontSize: s(28),
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  inputFullWidth: {
    alignSelf: 'stretch',
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
  hint: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: s(16),
    paddingBottom: s(32),
    gap: s(8),
  },
});
