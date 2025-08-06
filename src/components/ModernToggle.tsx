import React from 'react';
import { Animated, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Haptics } from 'expo-haptics';

interface ModernToggleProps {
  /** Current toggle state */
  value: boolean;
  /** Callback when toggle state changes */
  onValueChange: (value: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Custom size for the toggle */
  size?: 'small' | 'medium' | 'large';
  /** Custom colors for the toggle */
  colors?: {
    activeTrack?: string;
    inactiveTrack?: string;
    activeThumb?: string;
    inactiveThumb?: string;
  };
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

/**
 * ModernToggle - A custom animated toggle switch with modern iOS design
 * Features smooth animations, haptic feedback, and accessibility support
 */
export default function ModernToggle({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  colors,
  accessibilityLabel,
  accessibilityHint,
}: ModernToggleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const [animatedValue] = React.useState(new Animated.Value(value ? 1 : 0));
  const [scaleValue] = React.useState(new Animated.Value(1));

  // Size configurations
  const sizeConfig = {
    small: { width: 44, height: 26, thumbSize: 22, padding: 2 },
    medium: { width: 51, height: 31, thumbSize: 27, padding: 2 },
    large: { width: 58, height: 36, thumbSize: 32, padding: 2 },
  };

  const config = sizeConfig[size];

  // Color configurations
  const defaultColors = {
    activeTrack: colors?.activeTrack || '#34C759',
    inactiveTrack: colors?.inactiveTrack || (isDark ? '#39393D' : '#E5E5EA'),
    activeThumb: colors?.activeThumb || '#FFFFFF',
    inactiveThumb: colors?.inactiveThumb || '#FFFFFF',
  };

  // Update animation when value changes
  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  /**
   * Handle toggle press with haptic feedback
   */
  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue without feedback
    }

    // Scale animation for press feedback
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onValueChange(!value);
  };

  // Interpolated values for animations
  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [defaultColors.inactiveTrack, defaultColors.activeTrack],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.padding, config.width - config.thumbSize - config.padding],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [defaultColors.inactiveThumb, defaultColors.activeThumb],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={styles.pressable}
      >
      <Animated.View
        style={[
          styles.track,
          {
            width: config.width,
            height: config.height,
            backgroundColor: trackColor,
            borderRadius: config.height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: config.thumbSize,
              height: config.thumbSize,
              borderRadius: config.thumbSize / 2,
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }],
              // Modern iOS shadow
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
        />
      </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 0,
  },
});