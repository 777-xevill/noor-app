import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { onPhoto } from '@/theme/tokens';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';

type Props = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  size?: number;
  badge?: boolean;
  variant?: 'glass' | 'photo';
};

export function IconButton({ icon, label, onPress, size = 44, badge, variant = 'glass' }: Props) {
  const t = useTheme();
  const onPhotoVariant = variant === 'photo';
  return (
    <Press onPress={onPress} scaleTo={0.88} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <Glass
        radius={size / 2}
        padding={0}
        elevated={!onPhotoVariant}
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          onPhotoVariant && { backgroundColor: onPhoto.chip, borderColor: onPhoto.chipBorder },
        ]}
      >
        <Icon name={icon} size={size * 0.43} color={onPhotoVariant ? onPhoto.text : t.text} />
        {badge && (
          <View
            style={{
              position: 'absolute',
              top: size * 0.24,
              right: size * 0.26,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: onPhotoVariant ? onPhoto.text : t.ink,
              borderWidth: 1.5,
              borderColor: onPhotoVariant ? 'transparent' : t.glassStrong,
            }}
          />
        )}
      </Glass>
    </Press>
  );
}
