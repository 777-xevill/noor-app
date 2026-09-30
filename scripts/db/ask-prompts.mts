// Copy Ask Noor's prompts from src/features/ask/prompts.ts into the database (private.ask_prompts),
// where the ask_noor function (migration 0007) reads them. Re-run after changing prompts.ts:
//   npx tsx scripts/db/ask-prompts.mts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { ANSWER_OPTIONS, answerMessages, DEFAULT_MODEL, KEYWORD_OPTIONS, keywordMessages } from '../../src/features/ask/prompts';

const root = join(import.meta.dirname, '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env.server.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);

const keywords = keywordMessages('?')[0].content;
// With no sources the answer prompt ends at "Sources:"; the database appends each source on its own line.
const answerEn = answerMessages('?', 'en', [])[0].content;
const answer = answerEn.replace('Write in English.', 'Write in {language}.');
if (answer === answerEn || !answer.endsWith('Sources:')) throw new Error('prompts.ts changed shape; update this script and ask_noor');
// The template must reproduce prompts.ts exactly for both languages.
if (answer.replace('{language}', 'Bangla (Bengali)') !== answerMessages('?', 'bn', [])[0].content) throw new Error('Bangla prompt mismatch');

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT),
  user: env.SUPABASE_DB_USER,
  database: env.SUPABASE_DB_NAME,
  password: env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
for (const [key, content, options] of [
  ['keywords', keywords, KEYWORD_OPTIONS],
  ['answer', answer, ANSWER_OPTIONS],
] as const) {
  await client.query(
    `insert into private.ask_prompts (key, content, options, model) values ($1, $2, $3, $4)
     on conflict (key) do update set content = excluded.content, options = excluded.options, model = excluded.model`,
    [key, content, JSON.stringify(options), DEFAULT_MODEL],
  );
  console.log(`saved ${key} prompt`);
}
await client.end();
