import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Toggle } from '@/components/Toggle';
import { Txt } from '@/components/Txt';
import { HADITH } from '@/data/hadith';
import { useNow } from '@/lib/useNow';
import { timeAgo } from '@/lib/timeAgo';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { blockAuthor, communityEnabled, deleteMine, type DuaRequest, listRequests, postRequest, report, type ReportReason, toggleAmeen } from '@/features/community/api';
import { checkRequest, MAX_LENGTH } from '@/features/community/rules';
import { useSettings } from '@/features/settings/store';
import { useAccount } from '@/features/sync/useAccount';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const REASONS: ReportReason[] = ['inappropriate', 'not_a_dua', 'personal_info', 'spam'];
const HADITH_ABSENT = HADITH.find((h) => h.id === 'absent')!;

function Composer({ onPosted }: { onPosted: () => void }) {
  const t = useTheme();
  const L = useT();
  const name = useSettings((s) => s.displayName);
  const [text, setText] = useState('');
  const [showName, setShowName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const problem = checkRequest(text);

  const post = async () => {
    if (problem) return setNote(L.t(`community.rule.${problem}` as Key));
    setBusy(true);
    setNote(null);
    try {
      await postRequest(text.trim(), showName && name ? name : null, L.lang);
      setText('');
      onPosted();
    } catch (e) {
      const msg = String((e as { message?: string }).message ?? '');
      setNote(L.t(msg.includes('rate') ? 'community.rate' : msg.includes('links') ? 'community.rule.links' : msg.includes('phone') ? 'community.rule.phone' : 'community.postFail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Glass radius={26} padding={16} style={{ gap: 12 }}>
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.slice(0, MAX_LENGTH))}
        placeholder={L.t('community.placeholder')}
        placeholderTextColor={t.textMuted}
        multiline
        style={{ minHeight: 84, fontFamily: L.lang === 'bn' ? 'NotoBengali-Regular' : fonts.regular, fontSize: 16, lineHeight: 23, color: t.text, textAlignVertical: 'top' }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt variant="caption" tone="muted" style={{ flex: 1 }}>
          {name ? L.t('community.showName', { name }) : L.t('community.anonymousOnly')}
        </Txt>
        {name ? <Toggle value={showName} onChange={setShowName} label={L.t('community.showName', { name })} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Txt variant="micro" tone="muted" tabular style={{ flex: 1 }}>
          {L.num(`${text.length}/${MAX_LENGTH}`)}
        </Txt>
        <Press onPress={post} disabled={busy || text.trim().length < 3} scaleTo={0.96} accessibilityRole="button">
          <View style={{ height: 42, paddingHorizontal: 20, borderRadius: 21, backgroundColor: t.ink, opacity: text.trim().length < 3 ? 0.4 : 1, alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color={t.onInk} /> : <Txt variant="bodyStrong" tone="onInk">{L.t('community.post')}</Txt>}
          </View>
        </Press>
      </View>
      {note ? (
        <Txt variant="caption" tone="soft">
          {note}
        </Txt>
      ) : null}
      <Txt variant="micro" tone="muted">
        {L.t('community.guidelines')}
      </Txt>
    </Glass>
  );
}

function RequestCard({ r, now, signedIn, onAmeen, onMore }: { r: DuaRequest; now: number; signedIn: boolean; onAmeen: () => void; onMore: () => void }) {
  const t = useTheme();
  const L = useT();
  return (
    <Glass radius={22} padding={16} style={{ gap: 12 }}>
      <Txt variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
        {r.text}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
          {r.display_name ?? L.t('community.anonymous')} · {timeAgo(L, Date.parse(r.created_at), now)}
        </Txt>
        <Press onPress={signedIn ? onAmeen : () => router.push('/settings/account')} scaleTo={0.92} accessibilityRole="button" accessibilityState={{ selected: r.said_ameen }}>
          <View
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: r.said_ameen ? t.ink : t.pill,
            }}
          >
            <Icon name="dua" size={15} color={r.said_ameen ? t.onInk : t.text} />
            <Txt variant="bodyStrong" color={r.said_ameen ? t.onInk : t.text} tabular>
              {L.t('community.ameen')}
              {r.ameens > 0 ? ` · ${L.num(r.ameens)}` : ''}
            </Txt>
          </View>
        </Press>
        {signedIn && (
          <Press onPress={onMore} hitSlop={8} accessibilityRole="button" accessibilityLabel={L.t('community.more')}>
            <Txt variant="title" tone="muted">
              ···
            </Txt>
          </Press>
        )}
      </View>
    </Glass>
  );
}

export default function CommunityScreen() {
  const t = useTheme();
  const L = useT();
  const now = useNow(60_000).getTime();
  const { session } = useAccount();
  const [feed, setFeed] = useState<{ key: string; items: DuaRequest[] | null }>({ key: '', items: null });
  const [refresh, setRefresh] = useState(0);
  const [menu, setMenu] = useState<DuaRequest | null>(null);
  const [menuNote, setMenuNote] = useState<string | null>(null);
  const key = `${L.lang}|${refresh}|${session?.user.id ?? ''}`;

  useEffect(() => {
    if (!communityEnabled) return;
    let live = true;
    listRequests(L.lang)
      .then((items) => live && setFeed({ key, items }))
      .catch(() => live && setFeed({ key, items: [] }));
    return () => {
      live = false;
    };
  }, [L.lang, key]);

  const items = feed.key === key ? feed.items : null;
  const reload = () => setRefresh((n) => n + 1);

  const ameen = async (r: DuaRequest) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Show it straight away; the next refresh brings the true count.
    setFeed((f) => ({ ...f, items: f.items?.map((x) => (x.id === r.id ? { ...x, said_ameen: !x.said_ameen, ameens: x.ameens + (x.said_ameen ? -1 : 1) } : x)) ?? null }));
    toggleAmeen(r.id).catch(reload);
  };

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setMenu(null);
      setMenuNote(null);
      reload();
    } catch {
      setMenuNote(L.t('community.actionFail'));
    }
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('community.title')} subtitle={L.t('community.subtitle')} />

      <Reveal index={0}>
        <Glass radius={26} padding={18} style={{ gap: 10 }}>
          <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 44 }}>
            {HADITH_ABSENT.ar}
          </Txt>
          <Txt variant="body" tone="soft">
            {L.lang === 'bn' ? HADITH_ABSENT.bn : HADITH_ABSENT.en}
          </Txt>
          <Txt variant="caption" tone="muted">
            {L.lang === 'bn' ? L.num(HADITH_ABSENT.ref.replace('Sahih Muslim', 'সহিহ মুসলিম')) : HADITH_ABSENT.ref}
          </Txt>
        </Glass>
      </Reveal>

      {!communityEnabled ? (
        <Txt variant="body" tone="muted" style={{ paddingHorizontal: 4 }}>
          {L.t('community.off')}
        </Txt>
      ) : (
        <>
          <Reveal index={1}>
            {session ? (
              <Composer onPosted={reload} />
            ) : (
              <Press onPress={() => router.push('/settings/account')} scaleTo={0.98} accessibilityRole="button">
                <Glass radius={22} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Icon name="cloud" size={20} color={t.text} />
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    {L.t('community.signIn')}
                  </Txt>
                  <Icon name="chevronRight" size={16} color={t.textMuted} />
                </Glass>
              </Press>
            )}
          </Reveal>

          {items === null ? (
            <ActivityIndicator />
          ) : items.length === 0 ? (
            <Txt variant="body" tone="muted" style={{ paddingHorizontal: 4 }}>
              {L.t('community.empty')}
            </Txt>
          ) : (
            items.map((r) => <RequestCard key={r.id} r={r} now={now} signedIn={!!session} onAmeen={() => ameen(r)} onMore={() => setMenu(r)} />)
          )}
        </>
      )}

      <Txt variant="micro" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
        {L.t('community.footer')}
      </Txt>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={L.t('community.more')}>
        {menu && (
          <View style={{ gap: 10 }}>
            {menu.mine ? (
              <Press onPress={() => act(() => deleteMine(menu.id))} accessibilityRole="button">
                <Glass radius={18} padding={14}>
                  <Txt variant="bodyStrong" color="#C8413B">
                    {L.t('community.delete')}
                  </Txt>
                </Glass>
              </Press>
            ) : (
              <>
                <Txt variant="eyebrow" tone="muted">
                  {L.t('community.reportAs')}
                </Txt>
                {REASONS.map((reason) => (
                  <Press key={reason} onPress={() => act(() => report(menu.id, reason))} accessibilityRole="button">
                    <Glass radius={18} padding={14}>
                      <Txt variant="bodyStrong">{L.t(`community.reason.${reason}` as Key)}</Txt>
                    </Glass>
                  </Press>
                ))}
                <Press onPress={() => act(() => blockAuthor(menu.id))} accessibilityRole="button">
                  <Glass radius={18} padding={14} style={{ gap: 2 }}>
                    <Txt variant="bodyStrong">{L.t('community.block')}</Txt>
                    <Txt variant="caption" tone="muted">
                      {L.t('community.blockNote')}
                    </Txt>
                  </Glass>
                </Press>
              </>
            )}
            {menuNote ? (
              <Txt variant="caption" tone="soft">
                {menuNote}
              </Txt>
            ) : null}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
