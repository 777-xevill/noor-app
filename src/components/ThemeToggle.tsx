import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSettings } from '@/features/settings/store';
import { spring } from '@/theme/motion';
import { useT } from '@/i18n';
import { useScheme, useTheme } from '@/theme/useTheme';
import { Glass } from './Glass';
import { Icon } from './Icon';
import { Press } from './Press';

const SIZE = 44;

/** Sun and moon trade places with a quarter turn when the appearance changes. */
export function ThemeToggle() {
  const t = useTheme();
  const { t: tr } = useT();
  const scheme = useScheme();
  const setThemeMode = useSettings((s) => s.setThemeMode);
  const isDark = useSharedValue(scheme === 'dark' ? 1 : 0);

  useEffect(() => {
    isDark.value = withSpring(scheme === 'dark' ? 1 : 0, spring.snappy);
  }, [scheme, isDark]);

  // In dark mode the sun is offered (tap to go light), in light mode the moon.
  const sun = useAnimatedStyle(() => ({
    opacity: isDark.value,
    transform: [{ rotate: `${interpolate(isDark.value, [0, 1], [-90, 0])}deg` }, { scale: interpolate(isDark.value, [0, 1], [0.5, 1]) }],
  }));
  const moon = useAnimatedStyle(() => ({
    opacity: 1 - isDark.value,
    transform: [{ rotate: `${interpolate(isDark.value, [0, 1], [0, 90])}deg` }, { scale: interpolate(isDark.value, [0, 1], [1, 0.5]) }],
  }));

  return (
    <Press
      scaleTo={0.88}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={tr(scheme === 'dark' ? 'home.toLight' : 'home.toDark')}
      onPress={() => setThemeMode(scheme === 'dark' ? 'light' : 'dark')}
    >
      <Glass radius={SIZE / 2} padding={0} style={{ width: SIZE, height: SIZE }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, sun]}>
          <Icon name="sun" size={19} color={t.text} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, moon]}>
          <Icon name="moon" size={19} color={t.text} />
        </Animated.View>
      </Glass>
    </Press>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
