import { supabase } from '@/lib/supabase';
import { useSettings } from '@/features/settings/store';
import type { Lang } from '@/i18n/langs';
import { SURAHS } from '@/data/surahs';
import { loadCorpus } from './corpus';
import { ANSWER_OPTIONS, answerMessages, cleanAnswer, DEFAULT_MODEL, KEYWORD_OPTIONS, keywordMessages, type Message, parseKeywords } from './prompts';
import { type Passage, search } from './search';

// Ask Noor runs through the database function `ask_noor` (supabase/migrations/0007_server_calls.sql),
// which keeps the Groq key on the server, builds the prompts from the same text as prompts.ts, and
// limits questions per account (or per install for guests). Only without Supabase does
// EXPO_PUBLIC_GROQ_API_KEY call Groq directly, for local testing; never ship a build with that set.
const DIRECT_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const askEnabled = supabase !== null || !!DIRECT_KEY;
const useServer = supabase !== null;

function installId(): string {
  const { installId: id, set } = useSettings.getState();
  if (id) return id;
  const next = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  set({ installId: next });
  return next;
}

export class AskError extends Error {
  constructor(public code: 'off' | 'signin' | 'limit' | 'network') {
    super(code);
  }
}

async function direct(messages: Message[], options: Record<string, unknown>) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DIRECT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEFAULT_MODEL, messages, ...options }),
  });
  if (res.status === 429) throw new AskError('limit');
  if (!res.ok) throw new AskError('network');
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? '';
}

async function viaServer(body: { phase: 'keywords' | 'answer'; question: string; lang?: Lang; sources?: { tag: string; text: string }[] }): Promise<string> {
  const { data, error } = await supabase!.rpc('ask_noor', { ...body, device: installId() });
  if (error) {
    const code = error.message;
    throw new AskError(code === 'limit' ? 'limit' : code === 'signin' ? 'signin' : 'network');
  }
  return typeof data === 'string' ? data : '';
}

export type AskResult = { text: string; sources: Passage[] };
export type AskStage = 'searching' | 'writing';

/** Answer a question from the app's own Quran and dua texts, citing only what was given. */
export async function askNoor(question: string, lang: Lang, onStage: (s: AskStage) => void): Promise<AskResult> {
  if (!askEnabled) throw new AskError('off');
  onStage('searching');
  const [keywordReply, index] = await Promise.all([
    useServer ? viaServer({ phase: 'keywords', question }) : direct(keywordMessages(question), KEYWORD_OPTIONS),
    loadCorpus(),
  ]);
  const passages = search(index, [...parseKeywords(keywordReply), question], 8);

  onStage('writing');
  // In Bangla, give the model the published Bangla translation, so any quote is Muhiuddin Khan's words.
  const forModel = passages.map((p) => ({
    tag: p.tag,
    text: `(${p.surah ? `Surah ${SURAHS[p.surah - 1].name}` : `Hisnul Muslim: ${p.chapter}`}) ${lang === 'bn' && p.bn ? p.bn : p.en}`,
  }));
  const reply = useServer
    ? await viaServer({ phase: 'answer', question, lang, sources: forModel })
    : await direct(answerMessages(question, lang, forModel), ANSWER_OPTIONS);
  const { text, cited } = cleanAnswer(reply, passages.map((p) => p.tag));
  // Show the sources the answer cites; if it cites none, show what it was given.
  const shown = cited.length ? cited.map((tag) => passages.find((p) => p.tag === tag)!) : passages.slice(0, 3);
  return { text, sources: shown };
}
