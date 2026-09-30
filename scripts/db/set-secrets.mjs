// Store the server-side secrets that database functions need (migration 0007) in Supabase Vault.
//   node scripts/db/set-secrets.mjs
// Reads .env.server.local (Supabase) and .env.local (Groq). Safe to re-run: existing secrets are updated.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const root = join(import.meta.dirname, '..', '..');
const read = (file) =>
  Object.fromEntries(
    readFileSync(join(root, file), 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  );
const env = { ...read('.env.local'), ...read('.env.server.local') };

const secrets = {
  noor_supabase_url: env.SUPABASE_URL,
  // The legacy service_role JWT works as both apikey and bearer token for the Auth admin API.
  noor_service_role_key: env.SUPABASE_SERVICE_ROLE_KEY,
  noor_groq_api_key: env.GROQ_API_KEY || env.EXPO_PUBLIC_GROQ_API_KEY,
};
for (const [name, value] of Object.entries(secrets)) if (!value) throw new Error(`missing value for ${name}`);

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT),
  user: env.SUPABASE_DB_USER,
  database: env.SUPABASE_DB_NAME,
  password: env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
for (const [name, value] of Object.entries(secrets)) {
  const { rows } = await client.query('select id from vault.secrets where name = $1', [name]);
  if (rows.length) await client.query('select vault.update_secret($1, $2)', [rows[0].id, value]);
  else await client.query('select vault.create_secret($1, $2)', [value, name]);
  console.log(`${rows.length ? 'updated' : 'stored'} ${name}`);
}
await client.end();
