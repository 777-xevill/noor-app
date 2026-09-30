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
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useNow } from '@/lib/useNow';
import { accountsEnabled } from '@/lib/supabase';
import { timeAgo } from '@/lib/timeAgo';
import { useT } from '@/i18n';
import { AccountError, createAccount, deleteAccount, signInWithPassword, signOut, syncNow, type SyncResult } from '@/features/sync/engine';
import { useSyncMeta } from '@/features/sync/store';
import { useAccount } from '@/features/sync/useAccount';
import { useTheme } from '@/theme/useTheme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = EMAIL.test(email.trim()) && password.length >= (mode === 'create' ? 8 : 1);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'create') await createAccount(email, password);
      else await signInWithPassword(email, password);
    } catch (e) {
      const code = e instanceof AccountError ? e.code : 'network';
      setError(L.t(`account.err.${code}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Glass radius={26} padding={18} style={{ gap: 14 }}>
      <Segmented<'signin' | 'create'>
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: 'signin', label: L.t('account.signInTab') },
          { value: 'create', label: L.t('account.createTab') },
        ]}
      />
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
      <Field
        icon="lock"
        placeholder={L.t(mode === 'create' ? 'account.newPasswordPh' : 'account.passwordPh')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
        textContentType={mode === 'create' ? 'newPassword' : 'password'}
        editable={accountsEnabled}
        onSubmitEditing={() => valid && !busy && submit()}
      />
      <Button label={L.t(mode === 'create' ? 'account.create' : 'account.verify')} onPress={submit} busy={busy} disabled={!accountsEnabled || !valid} />
      {mode === 'create' && (
        <Txt variant="caption" tone="muted">
          {L.t('account.passwordNote')}
        </Txt>
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
    state === 'busy' ? L.t('account.syncing') : state === 'failed' ? L.t('account.syncFailed') : lastSync ? L.t('account.lastSync', { when: timeAgo(L, lastSync, now) }) : L.t('account.never');

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
