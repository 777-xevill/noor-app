import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { QADA_PRAYERS, qadaTotal } from '@/features/care/rules';
import { useCare } from '@/features/care/store';
import { useFasting } from '@/features/fasting/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function QadaScreen() {
  const t = useTheme();
  const L = useT();
  const qada = useCare((s) => s.qada);
  const adjust = useCare((s) => s.adjustQada);
  const addMissed = useCare((s) => s.addMissed);
  const missedFasts = useFasting((s) => Object.values(s.days).filter((v) => v === 'missed').length);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState('');
  const n = Math.min(3650, Math.floor(Number(days.replace(/\D/g, '')) || 0));

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('qada.title')} subtitle={L.t('qada.subtitle')} />

      <Reveal index={0}>
        <Glass strong radius={28} padding={20} style={{ gap: 4 }}>
          <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 44, lineHeight: 52 }}>
            {L.num(qadaTotal(qada))}
          </Txt>
          <Txt variant="body" tone="soft">
            {L.t('qada.owed')}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <ListGroup footer={L.t('qada.footer')}>
          {QADA_PRAYERS.map((k, i) => (
            <ListRow
              key={k}
              title={L.prayer(k)}
              right={<Stepper label={L.prayer(k)} value={qada[k]} min={0} max={99999} format={(v) => L.num(v)} onChange={(v) => adjust(k, v - qada[k])} />}
              last={i === QADA_PRAYERS.length - 1}
            />
          ))}
        </ListGroup>
      </Reveal>

      <Reveal index={2}>
        <ListGroup>
          <ListRow icon="plus" title={L.t('qada.addDays')} subtitle={L.t('qada.addDaysSub')} onPress={() => setOpen(true)} />
          <ListRow
            icon="moonStar"
            title={L.t('qada.fasts')}
            subtitle={L.t('qada.fastsSub')}
            value={L.num(missedFasts)}
            onPress={() => router.push('/tracker')}
            last
          />
        </ListGroup>
      </Reveal>

      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('qada.private')}
      </Txt>

      <Sheet open={open} onClose={() => setOpen(false)} title={L.t('qada.addDays')}>
        <View style={{ gap: 12 }}>
          <Txt variant="body" tone="soft">
            {L.t('qada.addDaysHelp')}
          </Txt>
          <TextInput
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={t.textMuted}
            style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.glassStrong, borderWidth: 1, borderColor: t.glassBorder, fontFamily: fonts.semibold, fontSize: 20, color: t.text }}
          />
          <Press
            onPress={() => {
              addMissed(n);
              setDays('');
              setOpen(false);
            }}
            disabled={n < 1}
            scaleTo={0.97}
            accessibilityRole="button"
          >
            <View style={{ height: 50, borderRadius: 25, backgroundColor: t.ink, opacity: n > 0 ? 1 : 0.4, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="title" tone="onInk">
                {L.t('qada.add')}
              </Txt>
            </View>
          </Press>
        </View>
      </Sheet>
    </Screen>
  );
}
