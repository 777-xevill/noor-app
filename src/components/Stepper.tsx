import { View } from 'react-native';
import { useT } from '@/i18n';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

/** −  value  + with bounds. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const { t } = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon="minus" label={t('common.decrease', { label })} size={34} onPress={() => onChange(Math.max(min, value - step))} />
      <Txt variant="bodyStrong" tabular style={{ minWidth: 58, textAlign: 'center' }}>
        {format(value)}
      </Txt>
      <IconButton icon="plus" label={t('common.increase', { label })} size={34} onPress={() => onChange(Math.min(max, value + step))} />
    </View>
  );
}
