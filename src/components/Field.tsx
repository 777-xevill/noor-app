import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { Icon, type IconName } from './Icon';

/** Glass text input with an optional leading icon. */
export const Field = forwardRef<TextInput, TextInputProps & { icon?: IconName }>(function Field({ icon, style, ...rest }, ref) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: t.glassStrong,
        borderWidth: 1,
        borderColor: t.glassBorder,
      }}
    >
      {icon ? <Icon name={icon} size={18} color={t.textMuted} /> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={t.textMuted}
        {...rest}
        style={[{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: t.text, paddingVertical: 12 }, style]}
      />
    </View>
  );
});
