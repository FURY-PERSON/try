import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Switch } from '@/components/ui/Switch';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { FC, ReactNode } from 'react';

type SettingsRowProps = {
  icon?: ReactNode;
  iconBgColor?: string;
  title: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SettingsRow: FC<SettingsRowProps> = ({
  icon,
  iconBgColor,
  title,
  value,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  onPress,
}) => {
  const { colors, borderRadius } = useThemeContext();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const content = (
    <View style={[styles.container, { borderBottomColor: colors.separator }]}>
      {icon && (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: iconBgColor ?? colors.primary + '15',
              borderRadius: borderRadius.sm,
            },
          ]}
        >
          {icon}
        </View>
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {isSwitch && switchValue !== undefined && onSwitchChange && (
        <Switch value={switchValue} onValueChange={onSwitchChange} />
      )}
      {!isSwitch && value && (
        <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
      )}
      {!isSwitch && onPress && (
        <Feather name="chevron-right" size={20} color={colors.textTertiary} />
      )}
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityLabel={title}
        accessibilityRole="button"
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  value: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginRight: 8,
  },
});
