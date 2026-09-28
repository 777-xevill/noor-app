import { Platform, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { fromDayKey, longDate } from '@/lib/dates';
import { useFasting } from '@/features/fasting/store';
import { DEEDS, EMPTY_ENTRY, EXTRAS, MOODS, toggleIn, useJournal } from '@/features/journal/store';
import { usePrayerLog } from '@/features/prayer/log';
import { prayerLabel, PRAYERS, type PrayerKey } from '@/features/prayer/times';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const EMPTY: PrayerKey[] = [];
const MAX = 2000;
const tick = () => Platform.OS !== 'web' && Haptics.selectionAsync();

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <Press
      scaleTo={0.985}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => {
        tick();
        onToggle();
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? t.ink : 'transparent',
          borderWidth: checked ? 0 : 1.5,
          borderColor: t.lineStrong,
        }}
      >
        {checked && <Icon name="check" size={14} color={t.onInk} strokeWidth={2.6} />}
      </View>
      <Txt variant="body" style={{ flex: 1 }}>
        {label}
      </Txt>
    </Press>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Glass radius={26} padding={16} style={{ gap: 8 }}>
      <Txt variant="title" style={{ marginBottom: 4 }}>
        {title}
      </Txt>
      {children}
    </Glass>
  );
}

export default function JournalEntryScreen() {
  const t = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = fromDayKey(date);
  const entry = useJournal((s) => s.entries[date] ?? EMPTY_ENTRY);
  const update = useJournal((s) => s.update);
  const prayers = usePrayerLog((s) => s.days[date] ?? EMPTY);
  const togglePrayer = usePrayerLog((s) => s.toggle);
  const fast = useFasting((s) => s.days[date]);
  const setFast = useFasting((s) => s.setDay);

  return (
    <Screen gap={14}>
      <ScreenHeader title="Journal entry" subtitle={longDate(day)} />

      <Section title="What’s on your heart today?">
        <TextInput
          value={entry.reflection}
          onChangeText={(reflection) => update(date, { reflection })}
          placeholder="A thought, a blessing, a dua, a lesson…"
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={MAX}
          style={{ minHeight: 120, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: t.text, textAlignVertical: 'top' }}
        />
        <Txt variant="micro" tone="muted" style={{ textAlign: 'right' }} tabular>
          {entry.reflection.length}/{MAX}
        </Txt>
      </Section>

      <Section title="How do you feel?">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MOODS.map((m) => (
            <Press
              key={m.key}
              scaleTo={0.93}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: entry.moods.includes(m.key) }}
              onPress={() => {
                tick();
                update(date, { moods: toggleIn(entry.moods, m.key) });
              }}
            >
              <Chip variant={entry.moods.includes(m.key) ? 'ink' : 'glass'} label={m.label} />
            </Press>
          ))}
        </View>
      </Section>

      <Section title="Prayers">
        {PRAYERS.map(({ key }) => (
          <CheckRow key={key} label={prayerLabel(key, day)} checked={prayers.includes(key)} onToggle={() => togglePrayer(date, key)} />
        ))}
        {EXTRAS.map((x) => (
          <CheckRow key={x.key} label={x.label} checked={entry.extras.includes(x.key)} onToggle={() => update(date, { extras: toggleIn(entry.extras, x.key) })} />
        ))}
      </Section>

      <Section title="Fasting">
        <Segmented
          value={fast ?? 'none'}
          onChange={(v) => setFast(date, v === 'none' ? null : v)}
          options={[
            { value: 'none', label: 'Not fasting' },
            { value: 'fasted', label: 'Fasted' },
            { value: 'missed', label: 'Missed' },
          ]}
        />
      </Section>

      <Section title="Good deeds">
        {DEEDS.map((d) => (
          <CheckRow key={d.key} label={d.label} checked={entry.deeds.includes(d.key)} onToggle={() => update(date, { deeds: toggleIn(entry.deeds, d.key) })} />
        ))}
      </Section>

      <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        Saved automatically, privately on this device.
      </Txt>
    </Screen>
  );
}
