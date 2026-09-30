import { supabase } from '@/lib/supabase';
import type { JuzClaim } from './rules';

// Family circles (supabase/migrations/0006_circles.sql). Needs an account; off until Supabase is set up.
export const circlesEnabled = supabase !== null;

export type CircleSummary = { id: string; name: string; code: string; khatm: number; members: number; juz_done: number };
export type CircleState = {
  id: string;
  name: string;
  code: string;
  khatm: number;
  mineOwner: boolean;
  members: { name: string; mine: boolean }[];
  juz: JuzClaim[];
};

function client() {
  if (!supabase) throw new Error('circles off');
  return supabase;
}

const check = (error: { message: string } | null) => {
  if (error) throw error;
};

export async function myCircles(): Promise<CircleSummary[]> {
  const { data, error } = await client().rpc('my_circles');
  check(error);
  return (data ?? []) as CircleSummary[];
}

export async function createCircle(name: string, displayName: string): Promise<string> {
  const { data, error } = await client().rpc('create_circle', { p_name: name, p_display_name: displayName });
  check(error);
  return (data as { id: string }[])[0].id;
}

export async function joinCircle(code: string, displayName: string): Promise<string> {
  const { data, error } = await client().rpc('join_circle', { p_code: code, p_display_name: displayName });
  check(error);
  return data as string;
}

export async function circleState(id: string): Promise<CircleState> {
  const { data, error } = await client().rpc('circle_state', { p_circle: id });
  check(error);
  return data as CircleState;
}

export async function claimJuz(id: string, juz: number) {
  check((await client().rpc('claim_juz', { p_circle: id, p_juz: juz })).error);
}

export async function releaseJuz(id: string, juz: number) {
  check((await client().rpc('release_juz', { p_circle: id, p_juz: juz })).error);
}

export async function finishJuz(id: string, juz: number, done: boolean) {
  check((await client().rpc('finish_juz', { p_circle: id, p_juz: juz, p_done: done })).error);
}

export async function nextKhatm(id: string) {
  check((await client().rpc('next_khatm', { p_circle: id })).error);
}

export async function leaveCircle(id: string) {
  check((await client().rpc('leave_circle', { p_circle: id })).error);
}
