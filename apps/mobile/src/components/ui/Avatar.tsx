import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  nickname?: string | null;
  imageUrl?: string | null;
  size?: AvatarSize;
};

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 13,
  md: 17,
  lg: 24,
  xl: 34,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) ?? '').toUpperCase();
};

export const Avatar: FC<AvatarProps> = ({ nickname, imageUrl, size = 'md' }) => {
  const { colors } = useThemeContext();
  const dimension = sizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderColor: colors.primary,
          },
        ]}
        contentFit="cover"
        transition={200}
        accessibilityLabel={nickname ?? 'Avatar'}
      />
    );
  }

  const initials = nickname ? getInitials(nickname) : '?';

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: colors.primary,
          borderColor: colors.primaryDark,
        },
      ]}
      accessibilityLabel={nickname ?? 'Avatar'}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: fontSizeMap[size] },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderWidth: 3,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_800ExtraBold',
  },
});
