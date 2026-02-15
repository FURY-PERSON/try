import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Switch } from '@/components/ui/Switch';
import { useThemeContext } from '@/theme';
import type { FC, ReactNode } from 'react';

type SettingsRowProps = {
  icon?: ReactNode;
  title: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
};

export const SettingsRow: FC<SettingsRowProps> = ({
  icon,
  title,
  value,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  onPress,
}) => {
  const { colors } = useThemeContext();

  const content = (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {isSwitch && switchValue !== undefined && onSwitchChange && (
        <Switch value={switchValue} onValueChange={onSwitchChange} />
      )}
      {!isSwitch && value && (
        <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
      )}
      {!isSwitch && onPress && (
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={title} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  value: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    marginRight: 8,
  },
});
