import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Title row for screens pushed on top of the tabs: back, title, optional actions. */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
      <IconButton icon="chevronLeft" label="Back" onPress={goBack} />
      <View style={{ flex: 1 }}>
        <Txt variant="h2" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
    </View>
  );
}
