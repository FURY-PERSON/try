import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserState = {
  nickname: string | null;
  avatarEmoji: string | null;

  setNickname: (nickname: string) => void;
  setAvatarEmoji: (emoji: string) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      nickname: null,
      avatarEmoji: null,

      setNickname: (nickname: string) => {
        set({ nickname });
      },

      setAvatarEmoji: (emoji: string) => {
        set({ avatarEmoji: emoji });
      },
    }),
    {
      name: 'factfront-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
