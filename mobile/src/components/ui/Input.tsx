import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/theme';
import type { FC } from 'react';
import type { TextInputProps, ViewStyle } from 'react-native';

type InputVariant = 'default' | 'search' | 'answer';

type InputProps = {
  variant?: InputVariant;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconLeft?: React.ReactNode;
  autoFocus?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
} & Omit<TextInputProps, 'style' | 'value' | 'onChangeText'>;

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input: FC<InputProps> = ({
  variant = 'default',
  value,
  onChangeText,
  placeholder,
  iconLeft,
  autoFocus,
  maxLength,
  style,
  accessibilityLabel,
  ...rest
}) => {
  const { colors, borderRadius, typography } = useThemeContext();
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  };

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const isAnswer = variant === 'answer';
  const isSearch = variant === 'search';

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.border, colors.primary],
    ),
    borderWidth: 1.5,
  }));

  return (
    <AnimatedView
      style={[
        styles.container,
        {
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surface,
        },
        borderAnimatedStyle,
        style,
      ]}
    >
      {(iconLeft ?? isSearch) && (
        <View style={styles.iconLeft}>
          {isSearch ? (
            <Feather name="search" size={18} color={focused ? colors.primary : colors.textSecondary} />
          ) : (
            iconLeft
          )}
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            fontFamily: typography.bodyLarge.fontFamily,
            fontSize: isAnswer ? 24 : (typography.bodyLarge.fontSize as number),
          },
        ]}
        {...rest}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={styles.iconRight}
          accessibilityLabel="Clear input"
          accessibilityRole="button"
        >
          <Feather name="x-circle" size={18} color={colors.textTertiary} />
        </Pressable>
      )}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  iconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  iconRight: {
    marginLeft: 10,
  },
});
