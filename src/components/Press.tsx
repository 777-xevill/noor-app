import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
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
export function Press(props: Props) {
  // On Android every animated button is one more view Reanimated has to track; screens hold dozens,
  // and budget phones felt it on every tab switch. There the press feedback is instant instead.
  return Platform.OS === 'android' ? <PressLite {...props} /> : <PressAnimated {...props} />;
}

function PressAnimated({ style, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Props) {
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

/**
 * A press feedback without any animation machinery, for long lists and grids where dozens of animated
 * buttons at once make a screen slow to open. It sinks slightly while held, like Press, but instantly.
 */
export function PressLite({ style, scaleTo = 0.97, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, pressed ? { transform: [{ scale: scaleTo }], opacity: 0.85 } : null]}
    />
  );
}
