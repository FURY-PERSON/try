import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { FC, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Direction = 'up' | 'down' | 'left' | 'right';

type AnimatedEntranceProps = {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  distance?: number;
  style?: ViewStyle;
};

const timingConfig = {
  duration: 320,
  easing: Easing.out(Easing.cubic),
};

const getTranslate = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up':
      return { x: 0, y: distance };
    case 'down':
      return { x: 0, y: -distance };
    case 'left':
      return { x: distance, y: 0 };
    case 'right':
      return { x: -distance, y: 0 };
  }
};

export const AnimatedEntrance: FC<AnimatedEntranceProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 24,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const initial = getTranslate(direction, distance);
    translateX.value = initial.x;
    translateY.value = initial.y;

    opacity.value = withDelay(delay, withTiming(1, timingConfig));
    translateX.value = withDelay(delay, withTiming(0, timingConfig));
    translateY.value = withDelay(delay, withTiming(0, timingConfig));
  }, [delay, direction, distance, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};
