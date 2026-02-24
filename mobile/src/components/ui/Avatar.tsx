import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
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
  const { colors, gradients, elevation } = useThemeContext();
  const dimension = sizeMap[size];
  const showShadow = size === 'lg' || size === 'xl';

  if (imageUrl) {
    return (
      <View style={showShadow ? elevation.md : undefined}>
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderColor: colors.border,
            },
          ]}
          contentFit="cover"
          transition={200}
          accessibilityLabel={nickname ?? 'Avatar'}
        />
      </View>
    );
  }

  const initials = nickname ? getInitials(nickname) : '?';

  return (
    <View style={showShadow ? elevation.md : undefined}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.fallback,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
        ]}
        accessibilityLabel={nickname ?? 'Avatar'}
      >
        <Text style={[styles.initials, { fontSize: fontSizeMap[size] }]}>
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: fontFamily.extraBold,
  },
});
