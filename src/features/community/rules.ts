// What a dua request may contain. The server (post_dua_request in
// supabase/migrations/0003_community.sql) applies the same rules; checking here first gives a
// friendly message instead of a failed post.

export type RuleProblem = 'short' | 'long' | 'links' | 'phone';

export const MAX_LENGTH = 280;

export function checkRequest(text: string): RuleProblem | null {
  const body = text.trim();
  if (body.length < 3) return 'short';
  if (body.length > MAX_LENGTH) return 'long';
  if (/(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|me|bd|xyz)\b)/i.test(body)) return 'links';
  if (/[0-9০-৯]{7,}/.test(body.replace(/[\s().+-]/g, ''))) return 'phone';
  return null;
}
