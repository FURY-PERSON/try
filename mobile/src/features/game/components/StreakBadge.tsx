import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { FireParticles } from './FireParticles';
import { FireAura } from './FireAura';
import { haptics } from '@/utils/haptics';
import { fontFamily } from '@/theme/typography';
import type { FC } from 'react';
import { s } from '@/utils/scale';

type StreakBadgeProps = {
  days: number;
  animated?: boolean;
  size?: 'sm' | 'md';
  showIncrement?: boolean;
  bonusPercent?: number;
};

type StreakTier = {
  tier: number;
  color: string;
  rotationAmplitude: number;
  scalePulse: number;
  glowRadius: number;
};

function getStreakTier(streak: number): StreakTier {
  if (streak <= 0) return { tier: 0, color: '#22C55E', rotationAmplitude: 0, scalePulse: 0, glowRadius: 0 };
  if (streak < 5) return { tier: 1, color: '#22C55E', rotationAmplitude: 3, scalePulse: 0.02, glowRadius: 4 };
  if (streak < 10) return { tier: 2, color: '#EAB308', rotationAmplitude: 4, scalePulse: 0.04, glowRadius: 8 };
  if (streak < 20) return { tier: 3, color: '#F97316', rotationAmplitude: 5, scalePulse: 0.06, glowRadius: 12 };
  if (streak < 30) return { tier: 4, color: '#EF4444', rotationAmplitude: 7, scalePulse: 0.08, glowRadius: 16 };
  if (streak < 40) return { tier: 5, color: '#DC2626', rotationAmplitude: 9, scalePulse: 0.10, glowRadius: 20 };
  return { tier: 7, color: '#9333EA', rotationAmplitude: 12, scalePulse: 0.14, glowRadius: 28 };
}

const BURST_DIRECTIONS = [
  { x: -20, y: -24 },
  { x: 18, y: -20 },
  { x: -8, y: -28 },
  { x: 22, y: -14 },
  { x: -18, y: -10 },
  { x: 0, y: -30 },
  { x: 12, y: -26 },
];

const INFERNO_COLORS = ['#FF4500', '#FF6600', '#FFD700', '#FF0000', '#FFA500', '#FF5522', '#FFAA00'];

const BurstParticle: FC<{ color: string; dx: number; dy: number; delay: number }> = ({
  color,
  dx,
  dy,
  delay,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 500 }),
    ));
    translateX.value = withDelay(delay, withTiming(dx, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(dy, { duration: 600 }));
    scale.value = withDelay(delay, withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(0.3, { duration: 400 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.burstParticle, { backgroundColor: color }, style]} />
  );
};

/**
 * Android-optimized pre-mounted burst particles.
 * All 7 particles are always in the tree — no setState/re-render on tap.
 * Activation is purely via shared values (UI thread only).
 * Each particle has its own shared values for position, opacity, scale.
 */
const PREMOUNT_COUNT = 7;

const PreMountedBurstParticle: FC<{
  trigger: Animated.SharedValue<number>;
  dx: number;
  dy: number;
  delay: number;
  color: string;
}> = React.memo(({ trigger, dx, dy, delay, color }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const lastTrigger = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    'worklet';
    // Detect trigger change on UI thread — no JS bridge needed
    if (trigger.value !== lastTrigger.value) {
      lastTrigger.value = trigger.value;
      if (trigger.value > 0) {
        // Reset to center
        translateX.value = 0;
        translateY.value = 0;
        scale.value = 0.5;
        // Animate outward
        opacity.value = withDelay(delay, withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 420 }),
        ));
        translateX.value = withDelay(delay, withTiming(dx, { duration: 500 }));
        translateY.value = withDelay(delay, withTiming(dy, { duration: 500 }));
        scale.value = withDelay(delay, withSequence(
          withTiming(1.1, { duration: 150 }),
          withTiming(0.2, { duration: 350 }),
        ));
      }
    }
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View
      collapsable={false}
      style={[styles.burstParticle, { backgroundColor: color }, style]}
    />
  );
});

const PreMountedBurst: FC<{
  trigger: Animated.SharedValue<number>;
  color: string;
  tier: number;
  isInferno: boolean;
  scale: number;
}> = React.memo(({ trigger, color, tier, isInferno, scale: tierScale }) => {
  const count = Math.min(2 + tier, PREMOUNT_COUNT);
  return (
    <View style={styles.burstContainer} pointerEvents="none">
      {BURST_DIRECTIONS.slice(0, count).map((dir, i) => (
        <PreMountedBurstParticle
          key={i}
          trigger={trigger}
          color={isInferno ? INFERNO_COLORS[i % INFERNO_COLORS.length] : color}
          dx={dir.x * tierScale}
          dy={dir.y * tierScale}
          delay={i * 35}
        />
      ))}
    </View>
  );
});

const PlusOneFloat: FC<{ color: string }> = ({ color }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    translateY.value = withTiming(-32, { duration: 800 });
    opacity.value = withDelay(400, withTiming(0, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.plusOne, { color }, style]}>+1</Animated.Text>
  );
};

const BonusFloat: FC<{ percent: number; color: string }> = ({ percent, color }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    translateY.value = withTiming(-32, { duration: 800 });
    opacity.value = withDelay(400, withTiming(0, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.plusOne, { color }, style]}>
      +{percent}%
    </Animated.Text>
  );
};

const InfernoGlowRing: FC<{ containerSize: number }> = ({ containerSize }) => {
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [glowProgress]);

  const ringStyle1 = useAnimatedStyle(() => ({
    backgroundColor: '#FF450050',
    transform: [{ scale: 1 + glowProgress.value * 0.15 }],
    opacity: 0.6 - glowProgress.value * 0.2,
  }));

  if (Platform.OS === 'android') {
    return (
      <Animated.View
        style={[
          styles.infernoRing,
          {
            width: containerSize + 12,
            height: containerSize - 6,
            borderRadius: 9999,
          },
          ringStyle1,
        ]}
      />
    );
  }

  const ringStyle2 = useAnimatedStyle(() => ({
    backgroundColor: '#FFD70040',
    transform: [{ scale: 1.1 + glowProgress.value * 0.2 }],
    opacity: 0.4 - glowProgress.value * 0.15,
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.infernoRing,
          {
            width: containerSize + 12,
            height: containerSize - 6,
            borderRadius: 9999,
          },
          ringStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.infernoRing,
          {
            width: containerSize + 20,
            height: containerSize + 2,
            borderRadius: 9999,
          },
          ringStyle2,
        ]}
      />
    </>
  );
};

const GradientStreakText: FC<{ days: number; isMd: boolean }> = ({ days, isMd }) => {
  const fontSize = isMd ? 18 : 14;
  const text = String(days);
  const textWidth = text.length * fontSize * 0.65;
  const textHeight = fontSize * 1.3;

  return (
    <Svg width={textWidth} height={textHeight}>
      <Defs>
        <SvgLinearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="0.35" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset="0.7" stopColor="#FF8C00" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF4500" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#fireGrad)"
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily={fontFamily.bold}
        x={textWidth / 2}
        y={fontSize}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

const InfernoIcon: FC<{ size: number }> = ({ size }) => {
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    colorProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [colorProgress]);

  const style1 = useAnimatedStyle(() => ({
    opacity: 1 - colorProgress.value * 0.3,
  }));

  const style2 = useAnimatedStyle(() => ({
    opacity: 0.3 + colorProgress.value * 0.5,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, style1]}>
        <MaterialCommunityIcons name="fire" size={size} color="#FF4500" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, style2]}>
        <MaterialCommunityIcons name="fire" size={size} color="#FFD700" />
      </Animated.View>
    </View>
  );
};

export const StreakBadge: FC<StreakBadgeProps> = ({
  days,
  animated = true,
  size = 'sm',
  showIncrement = true,
  bonusPercent = 0,
}) => {
  const prevDaysRef = useRef(days);
  const [tapBurstKey, setTapBurstKey] = useState(0);
  const [plusOneKey, setPlusOneKey] = useState(0);
  const [bonusFloatKey, setBonusFloatKey] = useState(0);
  const { tier, color, rotationAmplitude, scalePulse, glowRadius } = getStreakTier(days);

  const isInferno = days >= 40;

  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const burstScale = useSharedValue(1);
  const badgeOpacity = useSharedValue(days > 0 ? 1 : 0);
  const tapScale = useSharedValue(1);
  const tapRotation = useSharedValue(0);
  // Incrementing counter triggers pre-mounted burst particles (UI thread only, no re-render)
  const burstTrigger = useSharedValue(0);

  // One-time glow pulse animation — started once on mount and when tier changes,
  // NOT on every `days` change. This prevents stacking infinite animations.
  const prevTierRef = useRef(tier);
  useEffect(() => {
    if (days === 0 || !animated) {
      glowScale.value = 1;
      return;
    }
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1 + scalePulse * 3, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    );
    prevTierRef.current = tier;
  }, [animated, tier, scalePulse, glowScale]);

  useEffect(() => {
    const prevDays = prevDaysRef.current;
    prevDaysRef.current = days;

    if (days === 0) {
      badgeOpacity.value = withTiming(0.4, { duration: 300 });
      return;
    }

    badgeOpacity.value = withTiming(1, { duration: 200 });

    if (!animated) return;

    rotation.value = withRepeat(
      withSequence(
        withTiming(-rotationAmplitude, { duration: 100 }),
        withTiming(rotationAmplitude, { duration: 200 }),
        withTiming(0, { duration: 100 }),
      ),
      3,
      false,
    );

    if (days > prevDays && prevDays > 0) {
      burstScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      if (showIncrement) {
        setPlusOneKey((k) => k + 1);
      }
      // Show bonus float on tier change when bonus is available
      const prevTier = getStreakTier(prevDays).tier;
      const newTier = getStreakTier(days).tier;
      if (newTier > prevTier && bonusPercent > 0) {
        setBonusFloatKey((k) => k + 1);
      }
    }
  }, [animated, days, rotation, burstScale, badgeOpacity, rotationAmplitude, bonusPercent]);

  const handlePress = useCallback(() => {
    if (days <= 0) return;

    if (tier >= 5) {
      haptics.heavy();
    } else if (tier >= 3) {
      haptics.medium();
    } else {
      haptics.light();
    }

    const isAndroid = Platform.OS === 'android';
    const bounceScale = 1.15 + tier * 0.05;

    if (isAndroid) {
      // Android: use withTiming to avoid spring jank
      tapScale.value = withSequence(
        withTiming(bounceScale, { duration: 120 }),
        withTiming(1, { duration: 200 }),
      );
    } else {
      tapScale.value = withSequence(
        withSpring(bounceScale, { damping: 6, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }

    if (tier >= 2) {
      const amp = rotationAmplitude * 1.5;
      tapRotation.value = withSequence(
        withTiming(-amp, { duration: 60 }),
        withTiming(amp, { duration: 120 }),
        withTiming(-amp * 0.5, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }

    if (tier >= 4) {
      if (isAndroid) {
        burstScale.value = withSequence(
          withTiming(1.25, { duration: 150 }),
          withTiming(1, { duration: 250 }),
        );
      } else {
        burstScale.value = withSequence(
          withSpring(1.25, { damping: 8, stiffness: 400 }),
          withSpring(1, { damping: 12, stiffness: 200 }),
        );
      }
    }

    if (tier >= 7) {
      setTimeout(() => haptics.heavy(), 150);
    }

    if (isAndroid) {
      // Android: trigger pre-mounted particles via shared value (no re-render)
      burstTrigger.value = burstTrigger.value + 1;
    } else {
      setTapBurstKey((k) => k + 1);
    }

    if (bonusPercent > 0) {
      setBonusFloatKey((k) => k + 1);
    }
  }, [days, tier, rotationAmplitude, tapScale, tapRotation, burstScale, burstTrigger, bonusPercent]);

  const tapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: tapScale.value },
      { rotate: `${tapRotation.value}deg` },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.3,
  }));

  const burstAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: badgeOpacity.value,
  }));

  const isMd = size === 'md';
  const iconSize = isMd ? 20 : 16;
  const containerSize = isMd ? 52 : 42;

  const glowColor = isInferno ? '#B91C1C' : color;
  const bgColor = isInferno ? '#B91C1C30' : color + '20';

  return (
    <Animated.View style={[styles.outerWrap, burstAnimatedStyle]}>
      {/* Inferno glow rings for streak > 100 */}
      {isInferno && (
        <InfernoGlowRing containerSize={containerSize} />
      )}

      {/* Standard glow */}
      {days > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: glowColor,
              borderRadius: 9999,
              width: containerSize,
              height: isMd ? 28 : 22,
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isInferno ? 0.9 : 0.6,
              shadowRadius: isInferno ? 36 : glowRadius,
              elevation: 0,
            },
            glowAnimatedStyle,
          ]}
        />
      )}

      {/* Fire particles for tier 4+ */}
      {tier >= 4 && !isInferno && (
        <FireParticles
          count={Math.min(tier, 5)}
          color={color}
          containerSize={containerSize}
        />
      )}

      {/* Inferno fire aura for streak > 100 */}
      {isInferno && (
        <FireAura
          containerWidth={containerSize}
          containerHeight={containerSize}
        />
      )}

      {/* Tap burst particles — iOS uses setState-mounted, Android uses pre-mounted (zero re-renders) */}
      {Platform.OS === 'android' ? (
        <PreMountedBurst
          trigger={burstTrigger}
          color={color}
          tier={tier}
          isInferno={isInferno}
          scale={0.8 + tier * 0.1}
        />
      ) : (
        tapBurstKey > 0 && (
          <View style={styles.burstContainer} pointerEvents="none" key={tapBurstKey}>
            {BURST_DIRECTIONS.slice(0, Math.min(2 + tier, 7)).map((dir, i) => (
              <BurstParticle
                key={i}
                color={isInferno ? INFERNO_COLORS[i % INFERNO_COLORS.length] : color}
                dx={dir.x * (0.8 + tier * 0.1)}
                dy={dir.y * (0.8 + tier * 0.1)}
                delay={i * 40}
              />
            ))}
          </View>
        )
      )}

      {/* Floating +1 on streak increment */}
      {plusOneKey > 0 && (
        <View style={styles.plusOneContainer} pointerEvents="none" key={plusOneKey}>
          <PlusOneFloat color={isInferno ? '#FFD700' : color} />
        </View>
      )}

      {/* Floating bonus percent on tap or tier change */}
      {bonusFloatKey > 0 && bonusPercent > 0 && (
        <View style={styles.plusOneContainer} pointerEvents="none" key={`bonus-${bonusFloatKey}`}>
          <BonusFloat percent={bonusPercent} color={isInferno ? '#FFD700' : color} />
        </View>
      )}

      <Pressable onPress={handlePress} hitSlop={6}>
        <Animated.View style={tapAnimatedStyle}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: bgColor,
                paddingHorizontal: isMd ? 14 : 10,
                paddingVertical: isMd ? 7 : 4,
                borderWidth: isInferno ? 1 : 0,
                borderColor: isInferno ? '#FF660040' : 'transparent',
              },
            ]}
          >
            {/* Main fire icon */}
            <Animated.View style={iconAnimatedStyle}>
              {isInferno ? (
                <InfernoIcon size={iconSize} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="fire"
                    size={iconSize}
                    color={color}
                  />
                  {/* Second fire overlay for tier 3+ */}
                  {tier >= 3 && (
                    <MaterialCommunityIcons
                      name="fire"
                      size={iconSize}
                      color={color}
                      style={styles.fireOverlay}
                    />
                  )}
                </>
              )}
            </Animated.View>

            {/* Text: gradient for inferno, plain for others */}
            {isInferno ? (
              <GradientStreakText days={days} isMd={isMd} />
            ) : (
              <Text style={[styles.text, { color }, isMd && styles.textMd]}>
                {days}
              </Text>
            )}

            {/* Gold star for tier 7 (non-inferno kept for compatibility) */}
            {tier >= 7 && !isInferno && (
              <Text style={styles.starOverlay}>⭐</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  infernoRing: {
    position: 'absolute',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: s(9999),
    gap: s(4),
  },
  text: {
    fontSize: s(14),
    fontFamily: fontFamily.bold,
  },
  textMd: {
    fontSize: s(18),
  },
  fireOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.5,
  },
  starOverlay: {
    fontSize: s(10),
    marginLeft: -2,
  },
  plusOneContainer: {
    position: 'absolute',
    top: -4,
    right: -2,
    zIndex: 20,
  },
  plusOne: {
    fontSize: s(14),
    fontFamily: fontFamily.extraBold,
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstParticle: {
    position: 'absolute',
    width: s(5),
    height: s(5),
    borderRadius: s(2.5),
  },
});
