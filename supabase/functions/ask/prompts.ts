// Prompts for Ask Noor. A copy lives in supabase/functions/ask/prompts.ts, which is what runs in
// production; `npm run verify` checks the two files are identical. No imports: it runs in Deno too.

export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export type Message = { role: 'system' | 'user'; content: string };
export type SourceForModel = { tag: string; text: string };

export const MAX_QUESTION = 500;

/** Step 1: turn a question (English or Bangla) into English words to search the translations. */
export function keywordMessages(question: string): Message[] {
  return [
    {
      role: 'system',
      content:
        'You help search English translations of the Quran and a book of authentic duas (Hisnul Muslim). ' +
        'Given a question in any language, reply with 5 to 10 English search words or short phrases that such a ' +
        'translation would use, including close synonyms, as one comma-separated line and nothing else.',
    },
    { role: 'user', content: question.slice(0, MAX_QUESTION) },
  ];
}

export function parseKeywords(reply: string): string[] {
  return reply
    .replace(/<[^>]*>/g, ' ')
    .split(/[,\n]/)
    .map((w) => w.replace(/^[\s"'*\-•\d.)]+|[\s"'*.]+$/g, '').trim())
    .filter((w) => w.length > 1 && w.length < 40)
    .slice(0, 12);
}

/** Step 2: answer from the numbered sources only, citing them by tag. */
export function answerMessages(question: string, lang: 'en' | 'bn', sources: SourceForModel[]): Message[] {
  const language = lang === 'bn' ? 'Bangla (Bengali)' : 'English';
  return [
    {
      role: 'system',
      content: [
        'You are the assistant in Noor, a Muslim app. Answer using ONLY the sources below, which are translations of the Quran (tags like [Q 2:153]) and duas from Hisnul Muslim (tags like [D 45]).',
        'Rules:',
        '- Cite every statement with the tag of the source it comes from, exactly as written, e.g. [Q 2:153]. Use no other tags.',
        '- Never quote or invent a verse, hadith or dua that is not in the sources. Do not write Arabic.',
        '- If the sources do not answer the question, say so plainly and suggest asking a knowledgeable scholar or local imam.',
        '- For questions about rulings (halal, haram, obligations), explain what the sources say, note that scholars may differ, and advise asking a qualified scholar. Do not issue fatwas.',
        '- Be gentle, humble and brief: at most 150 words. No headings.',
        `- Write in ${language}.`,
        '',
        'Sources:',
        ...sources.map((s) => `[${s.tag}] ${s.text}`),
      ].join('\n'),
    },
    { role: 'user', content: question.slice(0, MAX_QUESTION) },
  ];
}

/**
 * Keep only citations to sources that were actually given; drop anything else the model wrote in
 * brackets. Returns the cleaned text and the tags cited, in order of first use.
 */
export function cleanAnswer(answer: string, allowed: string[]): { text: string; cited: string[]; dropped: number } {
  const ok = new Set(allowed);
  const cited: string[] = [];
  let dropped = 0;
  const text = answer
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]{1,20})\]/g, (whole, inner: string) => {
      const tag = inner.trim().replace(/\s+/g, ' ');
      if (!/^(Q \d{1,3}:\d{1,3}|D \d{1,3})$/.test(tag)) return whole;
      if (!ok.has(tag)) {
        dropped++;
        return '';
      }
      if (!cited.includes(tag)) cited.push(tag);
      return `[${tag}]`;
    })
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return { text, cited, dropped };
}
