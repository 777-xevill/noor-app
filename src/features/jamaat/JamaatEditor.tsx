import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Glass } from '@/components/Glass';
import { Press } from '@/components/Press';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { JAMAAT_PRAYERS, type JamaatRule, type JamaatTimes, MAX_AFTER_MINUTES, isValidHm } from './rules';

type Mode = 'none' | 'fixed' | 'after';
type Draft = Record<(typeof JAMAAT_PRAYERS)[number], { mode: Mode; at: string; minutes: number }>;

const toDraft = (times: JamaatTimes): Draft =>
  Object.fromEntries(
    JAMAAT_PRAYERS.map((p) => {
      const r = times[p];
      return [p, { mode: (r?.kind ?? 'none') as Mode, at: r?.kind === 'fixed' ? r.at : '', minutes: r?.kind === 'after' ? r.minutes : 15 }];
    }),
  ) as Draft;

/** Type a mosque's jamaat time for each prayer: a clock time, minutes after the adhan, or nothing. */
export function JamaatEditor({ initial, onSave }: { initial: JamaatTimes; onSave: (times: JamaatTimes) => void }) {
  const t = useTheme();
  const L = useT();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const bad = JAMAAT_PRAYERS.some((p) => draft[p].mode === 'fixed' && !isValidHm(draft[p].at));
  const set = (p: keyof Draft, patch: Partial<Draft[keyof Draft]>) => setDraft((d) => ({ ...d, [p]: { ...d[p], ...patch } }));

  const save = () => {
    const out: JamaatTimes = {};
    for (const p of JAMAAT_PRAYERS) {
      const d = draft[p];
      if (d.mode === 'fixed') out[p] = { kind: 'fixed', at: d.at } as JamaatRule;
      else if (d.mode === 'after') out[p] = { kind: 'after', minutes: d.minutes } as JamaatRule;
    }
    onSave(out);
  };

  return (
    <View style={{ gap: 12 }}>
      {JAMAAT_PRAYERS.map((p) => (
        <Glass key={p} radius={18} padding={12} style={{ gap: 10 }}>
          <Txt variant="bodyStrong">{L.prayer(p)}</Txt>
          <Segmented<Mode>
            value={draft[p].mode}
            onChange={(mode) => set(p, { mode })}
            options={[
              { value: 'none', label: L.t('jamaat.none') },
              { value: 'fixed', label: L.t('jamaat.fixed') },
              { value: 'after', label: L.t('jamaat.after') },
            ]}
          />
          {draft[p].mode === 'fixed' && (
            <View style={{ gap: 4 }}>
              <TextInput
                value={draft[p].at}
                onChangeText={(v) => set(p, { at: v.replace(/[^0-9:]/g, '').slice(0, 5) })}
                keyboardType="numbers-and-punctuation"
                placeholder="HH:MM"
                placeholderTextColor={t.textMuted}
                maxLength={5}
                style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: t.glassStrong, borderWidth: 1, borderColor: draft[p].at && !isValidHm(draft[p].at) ? t.text : t.glassBorder, fontFamily: fonts.semibold, fontSize: 18, color: t.text }}
              />
              <Txt variant="micro" tone="muted">
                {L.t('jamaat.hmHelp')}
              </Txt>
            </View>
          )}
          {draft[p].mode === 'after' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt variant="body" tone="soft">
                {L.t('jamaat.afterAdhan')}
              </Txt>
              <Stepper label={L.prayer(p)} value={draft[p].minutes} min={1} max={MAX_AFTER_MINUTES} step={5} format={(v) => L.t('common.minutes', { n: L.num(v) })} onChange={(minutes) => set(p, { minutes })} />
            </View>
          )}
        </Glass>
      ))}
      <Press onPress={save} disabled={bad} scaleTo={0.97} accessibilityRole="button">
        <View style={{ height: 50, borderRadius: 25, backgroundColor: t.ink, opacity: bad ? 0.4 : 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="title" tone="onInk">
            {L.t('jamaat.save')}
          </Txt>
        </View>
      </Press>
    </View>
  );
}
