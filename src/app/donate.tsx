import { useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { HADITH } from '@/data/hadith';
import { dayKey, fromDayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import { PARTNERS } from '@/features/donate/partners';
import { hijriYearRange } from '@/features/donate/period';
import { type GiftKind, totalGiven, useGiving } from '@/features/donate/store';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useZakat } from '@/features/zakat/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const CHARITY = HADITH.find((h) => h.id === 'charity')!;

export default function DonateScreen() {
  const t = useTheme();
  const L = useT();
  const { schedule, hijriOffset } = useSchedule(60_000);
  const currency = useZakat((z) => z.currency);
  const gifts = useGiving((g) => g.gifts);
  const add = useGiving((g) => g.add);
  const remove = useGiving((g) => g.remove);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<GiftKind>('sadaqah');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const range = hijriYearRange(schedule.day, hijriOffset);
  const money = (v: number) => `${currency} ${L.num(v.toLocaleString('en-US', { maximumFractionDigits: 2 }))}`;
  const value = Number(amount.replace(/[^\d.]/g, ''));

  const save = () => {
    if (!(value > 0)) return;
    add({ kind, amount: value, currency, day: dayKey(schedule.day), note: note.trim() || undefined });
    setAmount('');
    setNote('');
    setOpen(false);
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('donate.title')} subtitle={L.t('donate.subtitle')} />

      <Reveal index={0}>
        <Glass radius={26} padding={18} style={{ gap: 10 }}>
          <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 44 }}>
            {CHARITY.ar}
          </Txt>
          <Txt variant="body" tone="soft">
            {L.lang === 'bn' ? CHARITY.bn : CHARITY.en}
          </Txt>
          <Txt variant="caption" tone="muted">
            {L.lang === 'bn' ? L.num(CHARITY.ref.replace('Sahih Muslim', 'সহিহ মুসলিম')) : CHARITY.ref}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <View style={{ gap: 10 }}>
          <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('donate.partners')}
          </Txt>
          {PARTNERS.length === 0 ? (
            <Glass radius={22} padding={16} style={{ gap: 6 }}>
              <Txt variant="bodyStrong">{L.t('donate.noPartners')}</Txt>
              <Txt variant="body" tone="soft">
                {L.t('donate.noPartnersD')}
              </Txt>
            </Glass>
          ) : (
            PARTNERS.map((p) => (
              <Glass key={p.id} radius={22} padding={16} style={{ gap: 8 }}>
                <Txt variant="title">{L.lang === 'bn' && p.nameBn ? p.nameBn : p.name}</Txt>
                <Txt variant="body" tone="soft">
                  {L.lang === 'bn' && p.aboutBn ? p.aboutBn : p.about}
                </Txt>
                <Txt variant="caption" tone="muted">
                  {p.registration}
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {p.acceptsZakat && <Chip variant="ink" label={L.t('donate.zakatOk')} />}
                  {p.methods.map((m) => (
                    <Chip key={m} variant="glass" label={m} />
                  ))}
                </View>
                <Press onPress={() => Linking.openURL(p.donateUrl).catch(() => {})} scaleTo={0.97} accessibilityRole="link">
                  <View style={{ height: 48, borderRadius: 24, backgroundColor: t.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="arrowUpRight" size={17} color={t.onInk} />
                    <Txt variant="title" tone="onInk">
                      {L.t('donate.give')}
                    </Txt>
                  </View>
                </Press>
              </Glass>
            ))
          )}
          <Txt variant="micro" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('donate.outside')}
          </Txt>
        </View>
      </Reveal>

      <Reveal index={2}>
        <Glass radius={26} padding={18} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="title">{L.t('donate.log')}</Txt>
              <Txt variant="caption" tone="muted">
                {L.t('donate.thisYear', { year: L.num(range.year) })}
              </Txt>
            </View>
            <Press onPress={() => setOpen(true)} scaleTo={0.94} accessibilityRole="button">
              <Chip variant="ink" icon="plus" label={L.t('donate.record')} />
            </Press>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {(['zakat', 'sadaqah'] as const).map((k) => (
              <View key={k} style={{ flex: 1, gap: 2 }}>
                <Txt variant="caption" tone="muted">
                  {L.t(`donate.kind.${k}`)}
                </Txt>
                <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 }}>
                  {money(totalGiven(gifts, k, currency, range.from, range.to))}
                </Txt>
              </View>
            ))}
          </View>
          {gifts.slice(0, 20).map((g) => (
            <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.line }}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" tabular>
                  {`${g.currency} ${L.num(g.amount.toLocaleString('en-US'))}`}
                </Txt>
                <Txt variant="caption" tone="muted" numberOfLines={1}>
                  {L.t(`donate.kind.${g.kind}`)} · {L.shortDate(fromDayKey(g.day))}
                  {g.note ? ` · ${g.note}` : ''}
                </Txt>
              </View>
              <Press onPress={() => remove(g.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={L.t('donate.remove')}>
                <Icon name="trash" size={16} color={t.textMuted} />
              </Press>
            </View>
          ))}
          <Txt variant="micro" tone="muted">
            {L.t('donate.private')}
          </Txt>
        </Glass>
      </Reveal>

      <Sheet open={open} onClose={() => setOpen(false)} title={L.t('donate.record')}>
        <View style={{ gap: 12 }}>
          <Segmented<GiftKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: 'sadaqah', label: L.t('donate.kind.sadaqah') },
              { value: 'zakat', label: L.t('donate.kind.zakat') },
            ]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, backgroundColor: t.glassStrong, borderWidth: 1, borderColor: t.glassBorder }}>
            <Txt variant="bodyStrong" tone="muted">
              {currency}
            </Txt>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={t.textMuted}
              style={{ flex: 1, paddingVertical: 12, fontFamily: fonts.semibold, fontSize: 20, color: t.text }}
            />
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={60}
            placeholder={L.t('donate.notePh')}
            placeholderTextColor={t.textMuted}
            style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.glassStrong, borderWidth: 1, borderColor: t.glassBorder, fontFamily: fonts.regular, fontSize: 15, color: t.text }}
          />
          <Press onPress={save} disabled={!(value > 0)} scaleTo={0.97} accessibilityRole="button">
            <View style={{ height: 50, borderRadius: 25, backgroundColor: t.ink, opacity: value > 0 ? 1 : 0.4, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="title" tone="onInk">
                {L.t('donate.save')}
              </Txt>
            </View>
          </Press>
        </View>
      </Sheet>
    </Screen>
  );
}
