import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useNow } from '@/lib/useNow';
import { accountsEnabled } from '@/lib/supabase';
import { type I18n, useT } from '@/i18n';
import { deleteAccount, sendCode, signOut, syncNow, type SyncResult, verifyCode } from '@/features/sync/engine';
import { useSyncMeta } from '@/features/sync/store';
import { useAccount } from '@/features/sync/useAccount';
import { useTheme } from '@/theme/useTheme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ago(L: I18n, then: number, now: number) {
  const min = Math.floor((now - then) / 60_000);
  if (min < 1) return L.t('account.justNow');
  if (min < 60) return L.t('account.minAgo', { n: min });
  if (min < 24 * 60) return L.t('account.hAgo', { n: Math.floor(min / 60) });
  const d = new Date(then);
  return L.shortDate({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() });
}

function Button({ label, onPress, busy, disabled, icon, quiet }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; icon?: IconName; quiet?: boolean }) {
  const t = useTheme();
  const fg = quiet ? t.text : t.onInk;
  return (
    <Press onPress={onPress} disabled={busy || disabled} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}>
      <View
        style={{
          height: 52,
          borderRadius: 26,
          backgroundColor: quiet ? t.pill : t.ink,
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
        <Txt variant="title" color={fg}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

function SignIn() {
  const L = useT();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendCode(email.trim());
      setSentTo(email.trim());
    } catch {
      setError(L.t('account.errSend'));
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(sentTo!, code.trim());
    } catch {
      setError(L.t('account.errCode'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Glass radius={26} padding={18} style={{ gap: 14 }}>
      {!sentTo ? (
        <>
          <Field
            icon="mail"
            placeholder={L.t('account.emailPh')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={accountsEnabled}
          />
          <Button label={L.t('account.sendCode')} onPress={send} busy={busy} disabled={!accountsEnabled || !EMAIL.test(email.trim())} />
        </>
      ) : (
        <>
          <Txt variant="body" tone="soft">
            {L.t('account.codeSent', { email: sentTo })}
          </Txt>
          <Field
            placeholder={L.t('account.codePh')}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus
          />
          <Button label={L.t('account.verify')} onPress={verify} busy={busy} disabled={code.length !== 6} />
          <Press onPress={() => setSentTo(null)} accessibilityRole="button" style={{ alignSelf: 'center', padding: 6 }}>
            <Txt variant="caption" tone="soft">
              {L.t('account.changeEmail')}
            </Txt>
          </Press>
        </>
      )}
      {error ? (
        <Txt variant="caption" tone="soft">
          {error}
        </Txt>
      ) : null}
      {!accountsEnabled && (
        <Txt variant="caption" tone="muted">
          {L.t('account.off')}
        </Txt>
      )}
    </Glass>
  );
}

function SignedIn({ email }: { email: string }) {
  const t = useTheme();
  const L = useT();
  const now = useNow(30_000).getTime();
  const lastSync = useSyncMeta((s) => s.lastSync);
  const [state, setState] = useState<'idle' | 'busy' | SyncResult>('idle');
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const status =
    state === 'busy' ? L.t('account.syncing') : state === 'failed' ? L.t('account.syncFailed') : lastSync ? L.t('account.lastSync', { when: ago(L, lastSync, now) }) : L.t('account.never');

  return (
    <>
      <Glass radius={26} padding={18} style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cloudCheck" size={20} color={t.onInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="eyebrow" tone="muted">
              {L.t('account.signedIn')}
            </Txt>
            <Txt variant="title" numberOfLines={1}>
              {email}
            </Txt>
          </View>
        </View>
        <Txt variant="caption" tone={state === 'failed' ? 'soft' : 'muted'}>
          {status}
        </Txt>
        <Button
          label={L.t('account.syncNow')}
          icon="refresh"
          busy={state === 'busy'}
          onPress={async () => {
            setState('busy');
            setState(await syncNow());
          }}
        />
      </Glass>

      <ListGroup title={L.t('account.whatSynced')} footer={`${L.t('account.localOnly')} ${L.t('account.privacy')}`}>
        <View style={{ paddingVertical: 12 }}>
          <Txt variant="body" tone="soft">
            {L.t('account.syncedList')}
          </Txt>
        </View>
      </ListGroup>

      <ListGroup footer={L.t('account.signOutNote')}>
        <ListRow icon="logOut" title={L.t('account.signOut')} onPress={() => void signOut()} />
        <ListRow icon="trash" title={L.t('account.delete')} destructive onPress={() => setConfirm(true)} last />
      </ListGroup>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title={L.t('account.delete')}>
        <View style={{ gap: 14 }}>
          <Txt variant="body" tone="soft">
            {L.t('account.deleteBody')}
          </Txt>
          {deleteError && (
            <Txt variant="caption" tone="soft">
              {L.t('account.deleteFail')}
            </Txt>
          )}
          <Press
            onPress={async () => {
              setDeleting(true);
              setDeleteError(false);
              try {
                await deleteAccount();
                setConfirm(false);
              } catch {
                setDeleteError(true);
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            scaleTo={0.97}
            accessibilityRole="button"
          >
            <View style={{ height: 52, borderRadius: 26, backgroundColor: '#C8413B', alignItems: 'center', justifyContent: 'center' }}>
              {deleting ? <ActivityIndicator color="#FFFFFF" /> : <Txt variant="title" color="#FFFFFF">{L.t('account.delete')}</Txt>}
            </View>
          </Press>
          <Button label={L.t('common.cancel')} quiet onPress={() => setConfirm(false)} />
        </View>
      </Sheet>
    </>
  );
}

export default function AccountScreen() {
  const L = useT();
  const { session, ready } = useAccount();

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('account.title')} subtitle={L.t('account.subtitle')} />
      {!session && (
        <Txt variant="body" tone="soft" style={{ paddingHorizontal: 4 }}>
          {L.t('account.pitch')}
        </Txt>
      )}
      <Reveal index={0}>{!ready ? <ActivityIndicator /> : session ? <SignedIn email={session.user.email ?? ''} /> : <SignIn />}</Reveal>
    </Screen>
  );
}
