import { supabase } from '@/lib/supabase';
import type { Lang } from '@/i18n/langs';
import { loadCorpus } from './corpus';
import { answerMessages, cleanAnswer, DEFAULT_MODEL, keywordMessages, type Message, parseKeywords } from './prompts';
import { type Passage, search } from './search';

// Ask Noor runs through the `ask` edge function (supabase/functions/ask), which keeps the Groq key
// on the server. For testing without Supabase, EXPO_PUBLIC_GROQ_API_KEY calls Groq directly;
// never ship a build with that set, because anyone could read the key out of the app.
const DIRECT_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const askEnabled = supabase !== null || !!DIRECT_KEY;

export class AskError extends Error {
  constructor(public code: 'off' | 'signin' | 'limit' | 'network') {
    super(code);
  }
}

async function direct(messages: Message[], maxTokens: number) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DIRECT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEFAULT_MODEL, messages, temperature: 0.2, max_tokens: maxTokens }),
  });
  if (res.status === 429) throw new AskError('limit');
  if (!res.ok) throw new AskError('network');
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? '';
}

async function viaServer(body: Record<string, unknown>): Promise<string> {
  const { data: session } = await supabase!.auth.getSession();
  if (!session.session) throw new AskError('signin');
  const { data, error } = await supabase!.functions.invoke('ask', { body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    throw new AskError(status === 429 ? 'limit' : status === 401 ? 'signin' : 'network');
  }
  return (data as { text?: string })?.text ?? '';
}

export type AskResult = { text: string; sources: Passage[] };
export type AskStage = 'searching' | 'writing';

/** Answer a question from the app's own Quran and dua texts, citing only what was given. */
export async function askNoor(question: string, lang: Lang, onStage: (s: AskStage) => void): Promise<AskResult> {
  if (!askEnabled) throw new AskError('off');
  onStage('searching');
  const [keywordReply, index] = await Promise.all([
    supabase ? viaServer({ phase: 'keywords', question }) : direct(keywordMessages(question), 120),
    loadCorpus(),
  ]);
  const passages = search(index, [...parseKeywords(keywordReply), question], 8);

  onStage('writing');
  const forModel = passages.map((p) => ({ tag: p.tag, text: p.en }));
  const reply = supabase
    ? await viaServer({ phase: 'answer', question, lang, sources: forModel })
    : await direct(answerMessages(question, lang, forModel), 700);
  const { text, cited } = cleanAnswer(reply, passages.map((p) => p.tag));
  // Show the sources the answer cites; if it cites none, show what it was given.
  const shown = cited.length ? cited.map((tag) => passages.find((p) => p.tag === tag)!) : passages.slice(0, 3);
  return { text, sources: shown };
}
