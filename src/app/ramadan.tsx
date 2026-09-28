import { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Toggle } from '@/components/Toggle';
import { Txt } from '@/components/Txt';
import { JUZ_STARTS } from '@/data/juz';
import { SURAHS } from '@/data/surahs';
import { dayKey, sameDay } from '@/lib/dates';
import { useT } from '@/i18n';
import { DEMO_ENABLED } from '@/features/demo/seed';
import { useDuas } from '@/features/duas/data';
import { useFasting } from '@/features/fasting/store';
import { useSchedule } from '@/features/prayer/useSchedule';
import { ramadanInfo, type RamadanDay } from '@/features/ramadan/calendar';
import { useRamadan } from '@/features/ramadan/store';
import { fonts } from '@/theme/fonts';
import { onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../assets/images/hero-medina.jpg');
const IFTAR_CHAPTER = 68; // Hisnul Muslim: invocations for breaking the fast

const tick = () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

export default function RamadanScreen() {
  const t = useTheme();
  const L = useT();
  const { now, loc, prefs, hijriOffset, schedule } = useSchedule();
  const r = useRamadan();
  const info = useMemo(() => ramadanInfo(schedule.day, loc, prefs, hijriOffset, r.sehriMargin), [schedule.day, loc, prefs, hijriOffset, r.sehriMargin]);
  const [preview, setPreview] = useState(false);
  const fasts = useFasting((s) => s.days);
  const setFast = useFasting((s) => s.setDay);
  const { data: duas } = useDuas();
  const iftarDua = duas?.find((c) => c.id === IFTAR_CHAPTER)?.duas[0];

  const active = info.inRamadan || preview;
  // In preview, pretend it's mid-afternoon on day 12 so every part of the screen is visible.
  const today: RamadanDay | undefined = info.inRamadan ? info.days.find((d) => sameDay(d.g, schedule.day)) : info.days[Math.min(11, info.days.length - 1)];
  const clockNow = info.inRamadan || !today ? now : new Date(today.iftar.getTime() - (2 * 60 + 15) * 60_000);
  const todayIndex = today ? info.days.indexOf(today) : -1;
  const tomorrow = todayIndex >= 0 ? info.days[todayIndex + 1] : undefined;

  const phase = !today ? 'none' : clockNow < today.sehriEnds ? 'sehri' : clockNow < today.iftar ? 'fasting' : 'after';
  const target = phase === 'sehri' ? today!.sehriEnds : phase === 'fasting' ? today!.iftar : tomorrow?.sehriEnds;

  const juzKey = (n: number) => `${info.year}-${n}`;
  const juzDone = Array.from({ length: 30 }, (_, i) => r.juzRead[juzKey(i + 1)]).filter(Boolean).length;
  const todayJuz = today ? Math.min(30, today.day) : 1;
  const juzStart = JUZ_STARTS[todayJuz - 1];
  const taraweehNights = info.days.filter((d) => r.taraweeh[dayKey(d.g)]).length;
  const fastKey = today ? dayKey(today.g) : '';

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('ramadan.title')} subtitle={`${L.t('ramadan.title')} ${L.num(info.year)} ${L.t('common.ah')}`} />

      <Reveal index={0}>
        <View style={{ borderRadius: 30, overflow: 'hidden', padding: 20, minHeight: 250, justifyContent: 'flex-end', boxShadow: t.shadow }}>
          <Image source={PHOTO} resizeMode="cover" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={onPhoto.scrim} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
          {active && today ? (
            <View style={{ gap: 10 }}>
              <Chip variant="photo" label={L.t('ramadan.dayN', { n: today.day })} />
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 40, lineHeight: 48, letterSpacing: L.lang === 'en' ? -1.2 : 0, color: onPhoto.text }}>
                {target ? L.t(phase === 'fasting' ? 'ramadan.untilIftar' : 'ramadan.untilSehri', { t: L.countdown(target.getTime() - clockNow.getTime()) }) : L.t('ramadan.iftar')}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Chip variant="photo" icon="sunrise" label={`${L.t('ramadan.sehriEnds')} ${L.clockFull(today.sehriEnds, loc.timeZone)}`} />
                <Chip variant="photo" icon="sunset" label={`${L.t('ramadan.iftar')} ${L.clockFull(today.iftar, loc.timeZone)}`} />
              </View>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Txt style={{ fontFamily: fonts.semibold, fontSize: 32, lineHeight: 40, letterSpacing: L.lang === 'en' ? -1 : 0, color: onPhoto.text }}>
                {info.daysUntil <= 1 ? L.t('ramadan.startsTomorrow', { year: info.year }) : L.t('ramadan.startsIn', { year: info.year, n: info.daysUntil })}
              </Txt>
              <Txt variant="body" color={onPhoto.textSoft}>
                {L.t('ramadan.expected', { date: L.longDate(info.start) })}
              </Txt>
            </View>
          )}
        </View>
      </Reveal>

      {DEMO_ENABLED && !info.inRamadan && (
        <View style={{ gap: 6 }}>
          <Press onPress={() => setPreview((p) => !p)} style={{ alignSelf: 'flex-start' }} accessibilityRole="switch" accessibilityState={{ checked: preview }}>
            <Chip variant={preview ? 'ink' : 'glass'} icon="sunMoon" label={L.t('ramadan.preview')} />
          </Press>
          {preview && (
            <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
              {L.t('ramadan.previewNote', { year: info.year })}
            </Txt>
          )}
        </View>
      )}

      {active && today && (
        <>
          <Reveal index={1}>
            <Glass radius={26} padding={16} style={{ gap: 12 }}>
              <Txt variant="title">{L.t('ramadan.todayFast')}</Txt>
              <Segmented
                value={fasts[fastKey] ?? 'none'}
                onChange={(v) => {
                  tick();
                  setFast(fastKey, v === 'none' ? null : v);
                }}
                options={[
                  { value: 'none', label: L.t('fast.none') },
                  { value: 'fasted', label: L.t('fast.fasted') },
                  { value: 'missed', label: L.t('fast.missed') },
                ]}
              />
            </Glass>
          </Reveal>

          <Reveal index={2}>
            <Glass radius={26} padding={16} style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ProgressRing size={44} stroke={4} progress={juzDone / 30} color={t.ink} track={t.track} />
                <View style={{ flex: 1 }}>
                  <Txt variant="title">{L.t('ramadan.quranPlan')}</Txt>
                  <Txt variant="caption" tone="muted">
                    {L.t('ramadan.progress', { n: juzDone })}
                  </Txt>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: t.pill }}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{L.t('ramadan.todayJuz', { n: todayJuz })}</Txt>
                  <Txt variant="caption" tone="muted">
                    {L.t('ramadan.juzStarts', { name: SURAHS[juzStart.surah - 1].name, ref: L.num(`${juzStart.surah}:${juzStart.ayah}`) })}
                  </Txt>
                </View>
                <Press
                  onPress={() => router.push({ pathname: '/quran/[surah]', params: { surah: String(juzStart.surah), ayah: String(juzStart.ayah) } })}
                  accessibilityRole="button"
                >
                  <Chip variant="ink" icon="book" label={L.t('ramadan.readJuz')} />
                </Press>
                <Press
                  hitSlop={8}
                  scaleTo={0.85}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!r.juzRead[juzKey(todayJuz)] }}
                  accessibilityLabel={L.t('ramadan.markRead', { n: todayJuz })}
                  onPress={() => {
                    tick();
                    r.toggleJuz(juzKey(todayJuz));
                  }}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: r.juzRead[juzKey(todayJuz)] ? t.ink : 'transparent',
                    borderWidth: r.juzRead[juzKey(todayJuz)] ? 0 : 1.5,
                    borderColor: t.lineStrong,
                  }}
                >
                  {r.juzRead[juzKey(todayJuz)] && <Icon name="check" size={16} color={t.onInk} strokeWidth={2.6} />}
                </Press>
              </View>
              {/* 30 dots, one per juz */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: 30 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 5,
                      backgroundColor: r.juzRead[juzKey(i + 1)] ? t.ink : t.track,
                      borderWidth: i + 1 === todayJuz ? 1.5 : 0,
                      borderColor: t.ink,
                    }}
                  />
                ))}
              </View>
              <Txt variant="caption" tone="muted">
                {L.t('ramadan.planNote')}
              </Txt>
            </Glass>
          </Reveal>

          <Reveal index={3}>
            <Glass radius={26} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="moonStar" size={22} color={t.text} />
              <View style={{ flex: 1 }}>
                <Txt variant="title">{L.t('ramadan.taraweeh')}</Txt>
                <Txt variant="caption" tone="muted">
                  {L.t('ramadan.taraweehQ')} · {L.t('ramadan.taraweehCount', { n: taraweehNights })}
                </Txt>
              </View>
              <Toggle label={L.t('ramadan.taraweehQ')} value={!!r.taraweeh[fastKey]} onChange={() => r.toggleTaraweeh(fastKey)} />
            </Glass>
          </Reveal>

          {today.day >= 19 && (
            <Glass strong radius={26} padding={16} style={{ gap: 6 }}>
              <Txt variant="title">{L.t('ramadan.lastTen')}</Txt>
              <Txt variant="body" tone="soft">
                {L.t('ramadan.oddNights')}
              </Txt>
            </Glass>
          )}
        </>
      )}

      {iftarDua && (
        <Glass radius={26} padding={18} style={{ gap: 10 }}>
          <Txt variant="eyebrow" tone="muted">
            {L.t('ramadan.iftarDua')}
          </Txt>
          <Txt variant="arabic" style={{ fontSize: 24, lineHeight: 48 }}>
            {iftarDua.ar}
          </Txt>
          {iftarDua.tr ? (
            <Txt variant="body" tone="muted" style={{ fontStyle: 'italic' }}>
              {iftarDua.tr}
            </Txt>
          ) : null}
          <Txt variant="body" tone="soft">
            {iftarDua.en}
          </Txt>
          <Press onPress={() => router.push({ pathname: '/duas/[chapter]', params: { chapter: String(IFTAR_CHAPTER) } })} accessibilityRole="button">
            <Txt variant="caption" tone="muted">
              {L.t('ramadan.iftarDuaSrc')} ›
            </Txt>
          </Press>
        </Glass>
      )}

      <Txt variant="h2" style={{ marginTop: 4, paddingHorizontal: 2 }}>
        {L.t('ramadan.timetable')}
      </Txt>
      <Glass radius={24} padding={8}>
        <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Txt variant="micro" tone="muted" style={{ width: 44 }}>
            {L.t('ramadan.day')}
          </Txt>
          <Txt variant="micro" tone="muted" style={{ flex: 1.4 }}>
            {L.t('timetable.date')}
          </Txt>
          <Txt variant="micro" tone="muted" style={{ flex: 1, textAlign: 'right' }}>
            {L.t('ramadan.sehriEnds')}
          </Txt>
          <Txt variant="micro" tone="muted" style={{ flex: 1, textAlign: 'right' }}>
            {L.t('ramadan.iftar')}
          </Txt>
        </View>
        {info.days.map((d) => {
          const isToday = active && today && sameDay(d.g, today.g);
          const odd = d.day >= 21 && d.day % 2 === 1;
          return (
            <View
              key={d.day}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, backgroundColor: isToday ? t.ink : 'transparent' }}
            >
              <Txt variant="caption" tone={isToday ? 'onInk' : 'default'} tabular style={{ width: 44 }}>
                {L.num(d.day)}
                {odd ? ' ★' : ''}
              </Txt>
              <Txt variant="caption" tone={isToday ? 'onInk' : 'soft'} style={{ flex: 1.4 }} numberOfLines={1}>
                {L.weekdayShort(d.g)}, {L.shortDate(d.g)}
              </Txt>
              <Txt variant="caption" tone={isToday ? 'onInk' : 'default'} tabular style={{ flex: 1, textAlign: 'right' }}>
                {L.clockFull(d.sehriEnds, loc.timeZone)}
              </Txt>
              <Txt variant="caption" tone={isToday ? 'onInk' : 'default'} tabular style={{ flex: 1, textAlign: 'right' }}>
                {L.clockFull(d.iftar, loc.timeZone)}
              </Txt>
            </View>
          );
        })}
      </Glass>
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {loc.city} · {L.t(`method.${prefs.method}`)} · ★ {L.t('ramadan.lastTen')}
      </Txt>

      <ListGroup title={L.t('ramadan.settings')} footer={L.t('ramadan.sehriMarginNote')}>
        <View style={{ gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Txt variant="bodyStrong">{L.t('ramadan.sehriMargin')}</Txt>
          <Segmented
            value={String(r.sehriMargin)}
            onChange={(v) => r.set({ sehriMargin: Number(v) })}
            options={[
              { value: '0', label: L.t('ramadan.atFajr') },
              { value: '5', label: L.t('common.minutes', { n: 5 }) },
              { value: '10', label: L.t('common.minutes', { n: 10 }) },
            ]}
          />
        </View>
        <View style={{ gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Txt variant="bodyStrong">{L.t('ramadan.sehriReminder')}</Txt>
          <Segmented
            value={String(r.sehriReminder)}
            onChange={(v) => r.set({ sehriReminder: Number(v) })}
            options={[
              { value: '0', label: L.t('ramadan.off') },
              { value: '15', label: L.t('common.minutes', { n: 15 }) },
              { value: '30', label: L.t('common.minutes', { n: 30 }) },
              { value: '60', label: L.t('common.minutes', { n: 60 }) },
            ]}
          />
        </View>
        <ListRow title={L.t('ramadan.iftarAlert')} right={<Toggle label={L.t('ramadan.iftarAlert')} value={r.iftarAlert} onChange={(v) => r.set({ iftarAlert: v })} />} last />
      </ListGroup>
    </Screen>
  );
}
