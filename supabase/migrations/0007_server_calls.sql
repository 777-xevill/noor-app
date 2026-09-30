-- Server calls that run inside the database, so the app works without deploying edge functions:
--   * ask_noor: Ask Noor's two Groq calls (search words, then the answer), with the Groq key kept here.
--   * create_account: email + password sign-up that doesn't depend on delivering a confirmation email
--     (the project's built-in mailer only reaches its own team, so code and link emails never arrive).
-- Secrets live in Vault (scripts/db/set-secrets.mjs); prompt templates in private.ask_prompts
-- (scripts/db/ask-prompts.mts, generated from src/features/ask/prompts.ts so the wording stays in one place).

create extension if not exists http with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.secret(secret_name text) returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1
$$;
revoke all on function private.secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Ask Noor
-- ---------------------------------------------------------------------------------------------

create table if not exists private.ask_prompts (
  key text primary key,          -- 'keywords' | 'answer'
  content text not null,         -- system prompt; the answer's has {language} and ends at "Sources:"
  options jsonb not null,        -- temperature, max_tokens, reasoning_effort
  model text not null
);

-- Guests are counted per install (a random id the app keeps); signed-in users per account (ask_usage).
create table if not exists private.ask_device_usage (
  device text not null,
  day date not null,
  count int not null default 0,
  primary key (device, day)
);
-- A ceiling for the whole app per day, whoever is asking.
create table if not exists private.ask_daily (
  day date primary key,
  count int not null default 0
);

-- Each question makes two calls (keywords, answer), so the limits below are calls, not questions.
create or replace function public.ask_noor(phase text, question text, lang text default 'en', sources jsonb default '[]'::jsonb, device text default null)
returns text
language plpgsql volatile security definer
set search_path = ''
set statement_timeout = '50s'
as $$
#variable_conflict use_column
declare
  q text := left(btrim(coalesce(question, '')), 500);
  uid uuid := auth.uid();
  dev text := left(btrim(coalesce(device, '')), 64);
  used int;
  tmpl private.ask_prompts;
  sys text;
  src_lines text;
  resp extensions.http_response;
begin
  if q = '' then
    raise exception 'question' using errcode = '22023';
  end if;
  if phase not in ('keywords', 'answer') then
    raise exception 'phase' using errcode = '22023';
  end if;

  if uid is not null then
    insert into public.ask_usage as u (user_id, day, count) values (uid, current_date, 1)
      on conflict (user_id, day) do update set count = u.count + 1
      returning count into used;
    if used > 60 then raise exception 'limit' using errcode = 'P0001'; end if;
  else
    if dev = '' then raise exception 'signin' using errcode = 'P0001'; end if;
    insert into private.ask_device_usage as d (device, day, count) values (dev, current_date, 1)
      on conflict (device, day) do update set count = d.count + 1
      returning count into used;
    if used > 40 then raise exception 'limit' using errcode = 'P0001'; end if;
  end if;
  insert into private.ask_daily as a (day, count) values (current_date, 1)
    on conflict (day) do update set count = a.count + 1
    returning count into used;
  if used > 6000 then raise exception 'limit' using errcode = 'P0001'; end if;

  select * into tmpl from private.ask_prompts where key = phase;
  if not found then raise exception 'upstream' using errcode = 'P0001'; end if;

  if phase = 'keywords' then
    sys := tmpl.content;
  else
    sys := replace(tmpl.content, '{language}', case when lang = 'bn' then 'Bangla (Bengali)' else 'English' end);
    select string_agg('[' || left(e ->> 'tag', 12) || '] ' || left(e ->> 'text', 1200), E'\n' order by ord)
      into src_lines
      from jsonb_array_elements(case when jsonb_typeof(sources) = 'array' then sources else '[]'::jsonb end) with ordinality as x(e, ord)
      where ord <= 12 and jsonb_typeof(e -> 'tag') = 'string' and jsonb_typeof(e -> 'text') = 'string';
    if src_lines is not null then sys := sys || E'\n' || src_lines; end if;
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '45');
  select * into resp from extensions.http((
    'POST',
    'https://api.groq.com/openai/v1/chat/completions',
    array[extensions.http_header('Authorization', 'Bearer ' || private.secret('noor_groq_api_key'))],
    'application/json',
    (jsonb_build_object(
      'model', tmpl.model,
      'messages', jsonb_build_array(
        jsonb_build_object('role', 'system', 'content', sys),
        jsonb_build_object('role', 'user', 'content', q)
      )
    ) || tmpl.options)::text
  )::extensions.http_request);

  if resp.status = 429 then raise exception 'limit' using errcode = 'P0001'; end if;
  if resp.status <> 200 then raise exception 'upstream' using errcode = 'P0001'; end if;
  return coalesce(resp.content::jsonb #>> '{choices,0,message,content}', '');
end
$$;
revoke all on function public.ask_noor(text, text, text, jsonb, text) from public;
grant execute on function public.ask_noor(text, text, text, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------------------------

create table if not exists private.signups (at timestamptz not null default now());

-- Returns 'ok', 'exists', 'email', 'password', 'limit' or 'error'. The app then signs in with the password.
create or replace function public.create_account(email text, password text)
returns text
language plpgsql volatile security definer
set search_path = ''
set statement_timeout = '20s'
as $$
declare
  e text := lower(btrim(coalesce(email, '')));
  key text := private.secret('noor_service_role_key');
  recent int;
  resp extensions.http_response;
  code text;
begin
  if length(e) > 254 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return 'email'; end if;
  if length(coalesce(password, '')) < 8 or length(password) > 72 then return 'password'; end if;
  if exists (select 1 from auth.users u where lower(u.email) = e) then return 'exists'; end if;

  -- A ceiling on new accounts per hour, so the endpoint can't be used to flood the user table.
  delete from private.signups where at < now() - interval '1 day';
  select count(*) into recent from private.signups where at > now() - interval '1 hour';
  if recent >= 60 then return 'limit'; end if;
  insert into private.signups default values;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '15');
  select * into resp from extensions.http((
    'POST',
    private.secret('noor_supabase_url') || '/auth/v1/admin/users',
    array[extensions.http_header('apikey', key), extensions.http_header('Authorization', 'Bearer ' || key)],
    'application/json',
    jsonb_build_object('email', e, 'password', password, 'email_confirm', true)::text
  )::extensions.http_request);

  if resp.status in (200, 201) then return 'ok'; end if;
  begin
    code := resp.content::jsonb ->> 'error_code';
  exception when others then
    code := null;
  end;
  if code = 'email_exists' then return 'exists'; end if;
  if code = 'weak_password' then return 'password'; end if;
  return 'error';
end
$$;
revoke all on function public.create_account(text, text) from public;
grant execute on function public.create_account(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
