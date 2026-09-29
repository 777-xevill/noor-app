// Ask Noor — calls Groq for a signed-in user, keeping the API key on the server.
// Secrets: GROQ_API_KEY (required), GROQ_MODEL (optional). Deploy: supabase functions deploy ask
// Each user may ask 30 questions a day (table ask_usage, migrations/0004_ask.sql).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ANSWER_OPTIONS, answerMessages, DEFAULT_MODEL, KEYWORD_OPTIONS, keywordMessages, MAX_QUESTION, type Message } from './prompts.ts';

const DAILY_LIMIT = 30;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function groq(messages: Message[], options: Record<string, unknown>): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: Deno.env.get('GROQ_MODEL') ?? DEFAULT_MODEL, messages, ...options }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData.user;
  if (!user) return json({ error: 'sign in' }, 401);

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  if (!question) return json({ error: 'question' }, 400);

  try {
    if (body.phase === 'keywords') {
      // Count a question once, when it starts.
      const day = new Date().toISOString().slice(0, 10);
      const { data: used } = await admin.from('ask_usage').select('count').eq('user_id', user.id).eq('day', day).maybeSingle();
      if ((used?.count ?? 0) >= DAILY_LIMIT) return json({ error: 'limit' }, 429);
      await admin.from('ask_usage').upsert({ user_id: user.id, day, count: (used?.count ?? 0) + 1 });
      return json({ text: await groq(keywordMessages(question), KEYWORD_OPTIONS) });
    }
    if (body.phase === 'answer') {
      const lang = body.lang === 'bn' ? 'bn' : 'en';
      const sources = Array.isArray(body.sources)
        ? body.sources
            .slice(0, 12)
            .filter((s: unknown): s is { tag: string; text: string } => typeof (s as { tag?: unknown })?.tag === 'string' && typeof (s as { text?: unknown })?.text === 'string')
            .map((s: { tag: string; text: string }) => ({ tag: s.tag.slice(0, 12), text: s.text.slice(0, 1200) }))
        : [];
      return json({ text: await groq(answerMessages(question, lang, sources), ANSWER_OPTIONS) });
    }
    return json({ error: 'phase' }, 400);
  } catch {
    return json({ error: 'upstream' }, 502);
  }
});
