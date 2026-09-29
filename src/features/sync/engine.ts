import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSavedDuas } from '@/features/duas/data';
import { useFasting } from '@/features/fasting/store';
import { useJournal } from '@/features/journal/store';
import { usePrayerLog } from '@/features/prayer/log';
import { useQuranProgress } from '@/features/quran/progress';
import { useRamadan } from '@/features/ramadan/store';
import { useRewards } from '@/features/rewards/store';
import { useSettings } from '@/features/settings/store';
import { useTasbih } from '@/features/tasbih/store';
import { mergeSyncData, SYNCED_SETTINGS, type SyncData, type SyncedSettings } from './merge';
import { useSyncMeta } from './store';

// One row per account in `user_data` (see supabase/migrations). Normally a phone just pushes its
// copy after changes and takes the cloud copy when another phone wrote; only when both changed
// are the two merged (merge.ts), so an un-ticked prayer stays un-ticked in the usual case.

const TABLE = 'user_data';

function collect(): SyncData {
  const s = useSettings.getState();
  const q = useQuranProgress.getState();
  const r = useRamadan.getState();
  const settings = Object.fromEntries(SYNCED_SETTINGS.map((k) => [k, s[k]])) as SyncedSettings;
  return {
    v: 1,
    settings: { at: useSyncMeta.getState().settingsAt, value: settings },
    prayers: usePrayerLog.getState().days,
    reading: q.readingSeconds,
    lastRead: q.lastRead,
    bookmarks: q.bookmarks,
    goalMinutes: q.goalMinutes,
    journal: useJournal.getState().entries,
    fasts: useFasting.getState().days,
    dhikr: useTasbih.getState().daily,
    savedDuas: useSavedDuas.getState().saved,
    juzRead: r.juzRead,
    taraweeh: r.taraweeh,
    earned: useRewards.getState().earned,
  };
}

let applying = false;

function apply(d: SyncData) {
  applying = true;
  try {
    useSettings.setState(d.settings.value);
    useSyncMeta.getState().set({ settingsAt: d.settings.at });
    usePrayerLog.setState({ days: d.prayers });
    useQuranProgress.setState({ readingSeconds: d.reading, lastRead: d.lastRead, bookmarks: d.bookmarks, goalMinutes: d.goalMinutes });
    useJournal.setState({ entries: d.journal });
    useFasting.setState({ days: d.fasts });
    useTasbih.setState({ daily: d.dhikr });
    useSavedDuas.setState({ saved: d.savedDuas });
    useRamadan.setState({ juzRead: d.juzRead, taraweeh: d.taraweeh });
    useRewards.setState({ earned: d.earned });
  } finally {
    applying = false;
  }
}

export type SyncResult = 'synced' | 'signedOut' | 'off' | 'failed';

let running: Promise<SyncResult> | null = null;

/** Bring this phone and the account up to date with each other. */
export function syncNow(): Promise<SyncResult> {
  running ??= run().finally(() => (running = null));
  return running;
}

async function run(): Promise<SyncResult> {
  if (!supabase) return 'off';
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return 'signedOut';
  const meta = useSyncMeta.getState();
  try {
    const { data: row, error } = await supabase.from(TABLE).select('data, updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw error;

    const firstHere = meta.userId !== user.id;
    const changedHere = meta.dirty || firstHere;
    // Clear first: anything edited while this runs marks the phone dirty again for the next sync.
    meta.set({ dirty: false });
    let next = collect();
    const cloudMoved = !!row && row.updated_at !== meta.remoteAt;
    if (cloudMoved) {
      next = changedHere ? mergeSyncData(next, row.data as SyncData) : (row.data as SyncData);
      apply(next);
    }

    let remoteAt = row?.updated_at ?? null;
    if (!row || changedHere) {
      remoteAt = new Date().toISOString();
      const { error: upsertError } = await supabase.from(TABLE).upsert({ user_id: user.id, data: next, updated_at: remoteAt });
      if (upsertError) throw upsertError;
    }
    meta.set({ userId: user.id, email: user.email ?? null, remoteAt, lastSync: Date.now() });
    return 'synced';
  } catch {
    useSyncMeta.getState().set({ dirty: true });
    return 'failed';
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
const soon = () => {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), 4000);
};

/** Watch for changes and keep the account in step. Returns a function that stops watching. */
export function startCloudSync(): () => void {
  if (!supabase) return () => {};
  const markDirty = () => {
    if (applying) return;
    useSyncMeta.getState().set({ dirty: true });
    soon();
  };
  const stores = [usePrayerLog, useQuranProgress, useJournal, useFasting, useTasbih, useSavedDuas, useRamadan, useRewards] as const;
  const subs = stores.map((store) => (store as { subscribe: (fn: () => void) => () => void }).subscribe(markDirty));
  subs.push(
    useSettings.subscribe((s, prev) => {
      if (applying || !SYNCED_SETTINGS.some((k) => s[k] !== prev[k])) return;
      useSyncMeta.getState().set({ settingsAt: Date.now() });
      markDirty();
    }),
  );
  const auth = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') void syncNow();
  });
  const appState = AppState.addEventListener('change', (state) => state === 'active' && void syncNow());
  void syncNow();
  return () => {
    clearTimeout(timer);
    subs.forEach((unsub) => unsub());
    auth.data.subscription.unsubscribe();
    appState.remove();
  };
}

// ——— Account actions ———

export async function sendCode(email: string) {
  if (!supabase) throw new Error('accounts off');
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
  if (!supabase) throw new Error('accounts off');
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

/** Sign out; everything stays on this phone. */
export async function signOut() {
  await supabase?.auth.signOut();
  useSyncMeta.getState().set({ userId: null, email: null, remoteAt: null, lastSync: null });
}

/** Delete the account and its cloud copy for good. This phone keeps its own data. */
export async function deleteAccount() {
  if (!supabase) return;
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await signOut();
}
