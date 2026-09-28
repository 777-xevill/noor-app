import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { spring, timing } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far the control sinks while held. Small controls sink more, large cards less. */
  scaleTo?: number;
};

/**
 * The app's one press behaviour: a quick ease-in as the finger lands, then a soft spring back
 * on release, so every button feels physically connected to the touch.
 */
export function Press({ style, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.set(withTiming(scaleTo, timing.pressIn));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, spring.release));
        onPressOut?.(e);
      }}
      style={[style, animated]}
    />
  );
}
