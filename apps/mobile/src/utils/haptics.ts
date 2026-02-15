import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/useSettingsStore';

const isEnabled = (): boolean => useSettingsStore.getState().hapticsEnabled;

export const haptics = {
  light(): void {
    if (isEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  medium(): void {
    if (isEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  heavy(): void {
    if (isEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  success(): void {
    if (isEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  error(): void {
    if (isEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  warning(): void {
    if (isEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  selection(): void {
    if (isEnabled()) {
      Haptics.selectionAsync();
    }
  },
};
