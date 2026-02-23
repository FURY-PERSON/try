import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
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

  const borderColor = focused ? colors.blue : colors.separator;

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const isAnswer = variant === 'answer';
  const isSearch = variant === 'search';

  return (
    <View
      style={[
        styles.container,
        {
          borderWidth: 1,
          borderColor,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      {(iconLeft ?? isSearch) && (
        <View style={styles.iconLeft}>
          {isSearch ? (
            <Feather name="search" size={18} color={colors.textSecondary} />
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  iconRight: {
    marginLeft: 8,
  },
});
