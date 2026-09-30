import { Image, View } from 'react-native';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** The user's profile photo, or their initial (or a person icon) on the ink circle. */
export function Avatar({ size }: { size: number }) {
  const t = useTheme();
  const name = useSettings((s) => s.displayName);
  const uri = useSettings((s) => s.avatarUri);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" resizeMethod="resize" />
      ) : name ? (
        <Txt variant="title" tone="onInk" style={size > 60 ? { fontSize: size * 0.4, lineHeight: size * 0.5 } : undefined}>
          {name.charAt(0).toUpperCase()}
        </Txt>
      ) : (
        <Icon name="user" size={size * 0.44} color={t.onInk} />
      )}
    </View>
  );
}
