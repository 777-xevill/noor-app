import { useCallback, useState } from 'react';
import { ActivityIndicator, Share, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import {
  type CircleState,
  type CircleSummary,
  circleState,
  circlesEnabled,
  claimJuz,
  createCircle,
  finishJuz,
  joinCircle,
  leaveCircle,
  myCircles,
  nextKhatm,
  releaseJuz,
} from '@/features/circle/api';
import { JUZ_COUNT, isComplete, isValidCode, juzDone, juzStates, normalizeCode } from '@/features/circle/rules';
import { useSettings } from '@/features/settings/store';
import { useAccount } from '@/features/sync/useAccount';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const errKey = (e: unknown) => {
  const m = String((e as { message?: string })?.message ?? '');
  return m.includes('no such circle') ? 'circle.err.none' : m.includes('full') ? 'circle.err.full' : m.includes('too many') ? 'circle.err.many' : m.includes('taken') ? 'circle.err.taken' : 'circle.err.generic';
};

function Field({ value, onChange, placeholder, caps }: { value: string; onChange: (v: string) => void; placeholder: string; caps?: boolean }) {
  const t = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={t.textMuted}
      autoCapitalize={caps ? 'characters' : 'words'}
      autoCorrect={false}
      maxLength={caps ? 7 : 40}
      style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.glassStrong, borderWidth: 1, borderColor: t.glassBorder, fontFamily: fonts.regular, fontSize: 16, color: t.text }}
    />
  );
}

function Button({ label, onPress, ink, disabled }: { label: string; onPress: () => void; ink?: boolean; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Press onPress={onPress} disabled={disabled} scaleTo={0.97} accessibilityRole="button">
      <View style={{ height: 50, borderRadius: 25, backgroundColor: ink ? t.ink : t.pill, opacity: disabled ? 0.4 : 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Txt variant="title" tone={ink ? 'onInk' : undefined}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

function CircleView({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useTheme();
  const L = useT();
  const [state, setState] = useState<CircleState | null>(null);
  const [error, setError] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [tile, setTile] = useState<number | null>(null);

  const load = useCallback(() => {
    circleState(id).then(
      (s) => {
        setState(s);
        setError(false);
      },
      () => setError(true),
    );
  }, [id]);
  useFocusEffect(load);

  const act = async (fn: () => Promise<void>) => {
    setNote(null);
    setTile(null);
    try {
      await fn();
    } catch (e) {
      setNote(L.t(errKey(e) as never));
    }
    load();
  };

  if (!state) {
    return (
      <Screen gap={16}>
        <ScreenHeader title={L.t('circle.title')} />
        {error ? (
          <Txt variant="body" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('circle.err.generic')}
          </Txt>
        ) : (
          <ActivityIndicator color={t.textMuted} style={{ marginTop: 40 }} />
        )}
        <Button label={L.t('common.back')} onPress={onBack} />
      </Screen>
    );
  }

  const states = juzStates(state.juz);
  const done = juzDone(state.juz);
  const claim = tile ? state.juz.find((c) => c.juz === tile) : undefined;
  const complete = isComplete(state.juz);

  return (
    <Screen gap={16}>
      <ScreenHeader title={state.name} subtitle={L.t('circle.khatmN', { n: L.num(state.khatm) })} right={<IconButton icon="refresh" label={L.t('circle.refresh')} onPress={load} />} />

      <Reveal index={0}>
        <Glass strong radius={28} padding={20} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ProgressRing size={64} stroke={6} progress={done / JUZ_COUNT} color={t.ink} track={t.track} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34 }}>
              {L.num(done)}/{L.num(JUZ_COUNT)}
            </Txt>
            <Txt variant="caption" tone="muted">
              {L.t('circle.juzDone')}
            </Txt>
          </View>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <Glass radius={26} padding={14} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {states.map((s, i) => {
              const mine = s === 'mine' || s === 'mineDone';
              const filled = s !== 'free';
              return (
                <Press
                  key={i}
                  onPress={() => (s === 'free' ? act(() => claimJuz(id, i + 1)) : setTile(i + 1))}
                  scaleTo={0.93}
                  accessibilityRole="button"
                  accessibilityLabel={`${L.t('circle.juz', { n: L.num(i + 1) })}`}
                  style={{ width: '18%', flexGrow: 1 }}
                >
                  <View
                    style={{
                      height: 54,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: mine ? t.ink : filled ? t.pill : 'transparent',
                      borderWidth: filled ? 0 : 1.5,
                      borderColor: t.lineStrong,
                    }}
                  >
                    {s === 'mineDone' || s === 'takenDone' ? (
                      <Icon name="check" size={18} color={mine ? t.onInk : t.text} strokeWidth={2.6} />
                    ) : (
                      <Txt variant="bodyStrong" tabular color={mine ? t.onInk : t.text}>
                        {L.num(i + 1)}
                      </Txt>
                    )}
                  </View>
                </Press>
              );
            })}
          </View>
          <Txt variant="micro" tone="muted">
            {L.t('circle.tapFree')}
          </Txt>
        </Glass>
      </Reveal>

      {complete && <Button label={L.t('circle.nextKhatm')} ink onPress={() => act(() => nextKhatm(id))} />}

      <Reveal index={2}>
        <ListGroup title={L.t('circle.members', { n: L.num(state.members.length) })}>
          {state.members.map((m, i) => (
            <ListRow key={i} icon="user" title={m.mine ? `${m.name} (${L.t('circle.you')})` : m.name} last={i === state.members.length - 1} />
          ))}
        </ListGroup>
      </Reveal>

      <Reveal index={3}>
        <Glass radius={22} padding={16} style={{ gap: 10 }}>
          <Txt variant="caption" tone="muted">
            {L.t('circle.code')}
          </Txt>
          <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 28, letterSpacing: 4 }}>
            {state.code}
          </Txt>
          <Button label={L.t('circle.invite')} onPress={() => Share.share({ message: L.t('circle.inviteMsg', { name: state.name, code: state.code }) }).catch(() => {})} />
        </Glass>
      </Reveal>

      {note ? (
        <Txt variant="caption" tone="soft" style={{ paddingHorizontal: 6 }}>
          {note}
        </Txt>
      ) : null}

      <Button label={L.t('circle.leave')} onPress={() => act(async () => (await leaveCircle(id), onBack()))} />
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('circle.private')}
      </Txt>

      <Sheet open={tile !== null} onClose={() => setTile(null)} title={L.t('circle.juz', { n: L.num(tile ?? 0) })}>
        {claim && tile ? (
          <View style={{ gap: 12 }}>
            {claim.mine ? (
              <>
                <Txt variant="body" tone="soft">
                  {L.t(claim.done ? 'circle.youDone' : 'circle.youTook')}
                </Txt>
                <Button label={L.t(claim.done ? 'circle.undoDone' : 'circle.markDone')} ink onPress={() => act(() => finishJuz(id, tile, !claim.done))} />
                {!claim.done && <Button label={L.t('circle.release')} onPress={() => act(() => releaseJuz(id, tile))} />}
              </>
            ) : (
              <Txt variant="body" tone="soft">
                {L.t(claim.done ? 'circle.otherDone' : 'circle.otherTook', { name: claim.by })}
              </Txt>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

export default function CircleScreen() {
  const L = useT();
  const { session } = useAccount();
  const name = useSettings((s) => s.displayName);
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null);
  const [circleName, setCircleName] = useState('');
  const [code, setCode] = useState('');
  const [me, setMe] = useState(name);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!circlesEnabled || !session) return;
    myCircles().then(setCircles, () => setCircles([]));
  }, [session]);
  useFocusEffect(load);

  if (open) return <CircleView id={open} onBack={() => (setOpen(null), load())} />;

  const submit = async () => {
    setBusy(true);
    setNote(null);
    try {
      const id = sheet === 'create' ? await createCircle(circleName.trim(), me.trim()) : await joinCircle(normalizeCode(code), me.trim());
      setSheet(null);
      setCircleName('');
      setCode('');
      setOpen(id);
    } catch (e) {
      setNote(L.t(errKey(e) as never));
    }
    setBusy(false);
  };

  const canSubmit = me.trim().length > 0 && (sheet === 'create' ? circleName.trim().length >= 2 : isValidCode(normalizeCode(code)));

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('circle.title')} subtitle={L.t('circle.subtitle')} />

      {!circlesEnabled ? (
        <Glass radius={22} padding={16} style={{ gap: 6 }}>
          <Txt variant="bodyStrong">{L.t('circle.off')}</Txt>
          <Txt variant="body" tone="soft">
            {L.t('circle.offD')}
          </Txt>
        </Glass>
      ) : !session ? (
        <Glass radius={22} padding={16} style={{ gap: 12 }}>
          <Txt variant="body" tone="soft">
            {L.t('circle.signIn')}
          </Txt>
          <Button label={L.t('ask.signInCta')} ink onPress={() => router.push('/settings/account')} />
        </Glass>
      ) : (
        <>
          <Reveal index={0}>
            <Glass radius={26} padding={18} style={{ gap: 6 }}>
              <Txt variant="body" tone="soft">
                {L.t('circle.intro')}
              </Txt>
            </Glass>
          </Reveal>

          {circles === null ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : circles.length > 0 ? (
            <Reveal index={1}>
              <ListGroup title={L.t('circle.mine')}>
                {circles.map((c, i) => (
                  <ListRow
                    key={c.id}
                    icon="users"
                    title={c.name}
                    subtitle={L.t('circle.rowSub', { n: L.num(c.khatm), done: L.num(c.juz_done), people: L.num(c.members) })}
                    onPress={() => setOpen(c.id)}
                    last={i === circles.length - 1}
                  />
                ))}
              </ListGroup>
            </Reveal>
          ) : null}

          <Button label={L.t('circle.create')} ink onPress={() => (setNote(null), setSheet('create'))} />
          <Button label={L.t('circle.join')} onPress={() => (setNote(null), setSheet('join'))} />
        </>
      )}

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={L.t(sheet === 'join' ? 'circle.join' : 'circle.create')}>
        <View style={{ gap: 12 }}>
          {sheet === 'create' ? <Field value={circleName} onChange={setCircleName} placeholder={L.t('circle.namePh')} /> : <Field value={code} onChange={(v) => setCode(normalizeCode(v))} placeholder={L.t('circle.codePh')} caps />}
          <Field value={me} onChange={setMe} placeholder={L.t('circle.yourNamePh')} />
          <Txt variant="micro" tone="muted">
            {L.t('circle.nameNote')}
          </Txt>
          {note ? (
            <Txt variant="caption" tone="soft">
              {note}
            </Txt>
          ) : null}
          <Button label={L.t(sheet === 'join' ? 'circle.joinBtn' : 'circle.createBtn')} ink disabled={!canSubmit || busy} onPress={submit} />
        </View>
      </Sheet>
    </Screen>
  );
}
