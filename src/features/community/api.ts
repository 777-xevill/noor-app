import { supabase } from '@/lib/supabase';
import type { Lang } from '@/i18n/langs';

// The dua request wall (supabase/migrations/0003_community.sql). Reading is open; posting,
// saying Ameen, reporting and blocking need an account.

export type DuaRequest = {
  id: string;
  text: string;
  display_name: string | null;
  lang: Lang;
  created_at: string;
  mine: boolean;
  ameens: number;
  said_ameen: boolean;
};

export type ReportReason = 'inappropriate' | 'not_a_dua' | 'spam' | 'personal_info';

export const communityEnabled = supabase !== null;

function client() {
  if (!supabase) throw new Error('community off');
  return supabase;
}

export async function listRequests(lang: Lang): Promise<DuaRequest[]> {
  const { data, error } = await client().from('dua_feed').select('*').eq('lang', lang).order('created_at', { ascending: false }).limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function postRequest(text: string, displayName: string | null, lang: Lang) {
  const { error } = await client().rpc('post_dua_request', { p_text: text, p_display_name: displayName, p_lang: lang });
  if (error) throw error;
}

export async function toggleAmeen(id: string): Promise<boolean> {
  const { data, error } = await client().rpc('toggle_ameen', { p_request: id });
  if (error) throw error;
  return data as boolean;
}

export async function report(id: string, reason: ReportReason) {
  const { error } = await client().rpc('report_dua_request', { p_request: id, p_reason: reason });
  if (error) throw error;
}

export async function blockAuthor(id: string) {
  const { error } = await client().rpc('block_dua_author', { p_request: id });
  if (error) throw error;
}

export async function deleteMine(id: string) {
  const { error } = await client().rpc('delete_my_dua_request', { p_request: id });
  if (error) throw error;
}
