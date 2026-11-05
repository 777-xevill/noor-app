// Review what people have reported, without the Supabase dashboard. Connection details come from
// .env.server.local (git-ignored).
//   node scripts/db/reports.mjs                     list everything waiting for review
//   node scripts/db/reports.mjs dua-keep <id>       the request is fine: show it again and clear its reports
//   node scripts/db/reports.mjs dua-remove <id>     delete the request
//   node scripts/db/reports.mjs jamaat-keep <id>    the times are fine: show them again and clear the reports
//   node scripts/db/reports.mjs jamaat-remove <id>  delete the times
//   node scripts/db/reports.mjs ask-done <id>       mark a reported Ask Noor answer as reviewed
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const root = join(import.meta.dirname, '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env.server.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);

const ACTIONS = {
  'dua-keep': 'update public.dua_requests set hidden = false, report_count = 0 where id = $1',
  'dua-remove': 'delete from public.dua_requests where id = $1',
  'jamaat-keep': 'update public.mosque_jamaat set hidden = false, report_count = 0 where osm_id = $1',
  'jamaat-remove': 'delete from public.mosque_jamaat where osm_id = $1',
  'ask-done': 'update private.ask_reports set reviewed = true where id = $1',
};

const [action, id] = process.argv.slice(2);
if (action && (!ACTIONS[action] || !id)) {
  console.error('Usage: see the top of scripts/db/reports.mjs');
  process.exit(1);
}

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT),
  user: env.SUPABASE_DB_USER,
  database: env.SUPABASE_DB_NAME,
  password: env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

if (action) {
  const { rowCount } = await client.query(ACTIONS[action], [id]);
  console.log(rowCount ? 'Done.' : 'Nothing found with that id.');
} else {
  const show = (title, rows) => {
    console.log(`\n${title}: ${rows.length}`);
    rows.forEach((r) => console.log(r));
  };
  show('Dua requests', (await client.query('select id, text, report_count, hidden, created_at from public.dua_requests where report_count > 0 or hidden order by created_at desc')).rows);
  show('Jamaat times', (await client.query('select osm_id as id, name, times, report_count, hidden from public.mosque_jamaat where report_count > 0 or hidden')).rows);
  show('Ask Noor answers', (await client.query('select id, at, lang, question, answer from private.ask_reports where not reviewed order by at desc')).rows);
}
await client.end();
