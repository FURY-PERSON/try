import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useThemeContext } from '@/theme';
import { fontFamily } from '@/theme/typography';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { FC } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_BAR_HEIGHT = 56;
const TAB_BAR_MARGIN_H = 20;
const TAB_BAR_MARGIN_BOTTOM = 12;
const TAB_BAR_RADIUS = 22;
const FADE_HEIGHT = 100;

type TabItemProps = {
  label: string;
  icon: React.ReactNode;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
};

const TabItem: FC<TabItemProps> = ({
  label,
  icon,
  isFocused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={[styles.tabItem, animatedStyle]}
    >
      {icon}
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isFocused ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
};

export const FloatingTabBar: FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const bottomOffset = Math.max(insets.bottom, TAB_BAR_MARGIN_BOTTOM);
  const fadeBase = isDark ? '15, 23, 42' : '255, 255, 255';

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      {/* Bottom fade gradient: strong at screen edge, fading out toward tab bar */}
      <LinearGradient
        colors={[
          `rgba(${fadeBase}, 0)`,
          `rgba(${fadeBase}, 0.55)`,
          `rgba(${fadeBase}, 0.92)`,
        ]}
        locations={[0, 0.45, 1]}
        style={[styles.fadeGradient, { height: FADE_HEIGHT + bottomOffset }]}
        pointerEvents="none"
      />

      {/* Floating tab bar */}
      <View
        style={[styles.barWrapper, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.barContainer,
            {
              backgroundColor: isDark
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const color = isFocused ? colors.primary : colors.textTertiary;
            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color,
              size: 22,
            });

            return (
              <TabItem
                key={route.key}
                label={label}
                icon={icon}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                activeColor={colors.primary}
                inactiveColor={colors.textTertiary}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

/** Height of the floating tab bar including bottom margin, for content padding */
export const FLOATING_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + 8;

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barWrapper: {
    position: 'absolute',
    left: TAB_BAR_MARGIN_H,
    right: TAB_BAR_MARGIN_H,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    marginTop: 2,
  },
});
