import { View } from 'react-native';
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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon="minus" label={`Decrease ${label}`} size={34} onPress={() => onChange(Math.max(min, value - step))} />
      <Txt variant="bodyStrong" tabular style={{ minWidth: 58, textAlign: 'center' }}>
        {format(value)}
      </Txt>
      <IconButton icon="plus" label={`Increase ${label}`} size={34} onPress={() => onChange(Math.min(max, value + step))} />
    </View>
  );
}
