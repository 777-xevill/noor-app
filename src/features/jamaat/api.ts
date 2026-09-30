import { supabase } from '@/lib/supabase';
import { type JamaatTimes, hasAnyTime, sanitizeTimes } from './rules';

// Times shared by people who pray at a mosque (supabase/migrations/0005_jamaat.sql). Reading is open;
// sharing, confirming and reporting need an account. Off, like the other online features, until Supabase is set up.
export const jamaatSharingEnabled = supabase !== null;

export type SharedJamaat = { times: JamaatTimes; updatedAt: string; confirmations: number };

function client() {
  if (!supabase) throw new Error('sharing off');
  return supabase;
}

export async function fetchShared(osmId: string): Promise<SharedJamaat | null> {
  const { data, error } = await client().from('jamaat_public').select('times, updated_at, confirmations').eq('osm_id', osmId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const times = sanitizeTimes(data.times);
  return hasAnyTime(times) ? { times, updatedAt: data.updated_at as string, confirmations: data.confirmations as number } : null;
}

export async function shareTimes(osmId: string, name: string, times: JamaatTimes) {
  const { error } = await client().rpc('share_jamaat', { p_osm_id: osmId, p_name: name, p_times: sanitizeTimes(times) });
  if (error) throw error;
}

export async function confirmTimes(osmId: string) {
  const { error } = await client().rpc('confirm_jamaat', { p_osm_id: osmId });
  if (error) throw error;
}

export async function reportTimes(osmId: string) {
  const { error } = await client().rpc('report_jamaat', { p_osm_id: osmId });
  if (error) throw error;
}
