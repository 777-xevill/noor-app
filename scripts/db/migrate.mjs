// Apply Supabase migrations to the project's database, each in its own transaction.
//   node scripts/db/migrate.mjs supabase/migrations/0007_example.sql
// Connection details come from .env.server.local (git-ignored). Only pass migrations that haven't run yet:
// 0001–0006 were applied on 30 Sep 2026.
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

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/db/migrate.mjs <migration.sql> [...]');
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
for (const f of files) {
  try {
    await client.query('begin');
    await client.query(readFileSync(join(root, f), 'utf8'));
    await client.query('commit');
    console.log('applied', f);
  } catch (e) {
    await client.query('rollback');
    console.error('FAILED', f, e.message);
    process.exitCode = 1;
    break;
  }
}
await client.end();
