-- Noor: report an Ask Noor answer from inside the app. Google Play requires this for AI-generated answers.
-- Questions aren't normally stored. A report keeps only the one question and answer the person chose to
-- send, for review. Clients can write through the function below but can't read the table.
-- Review with: node scripts/db/reports.mjs

create table if not exists private.ask_reports (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  user_id  uuid references auth.users (id) on delete cascade,
  device   text,
  lang     text,
  question text not null,
  answer   text not null,
  reviewed boolean not null default false
);
create index if not exists ask_reports_open on private.ask_reports (at) where not reviewed;
revoke all on private.ask_reports from public, anon, authenticated;

create or replace function public.report_ask_answer(question text, answer text, lang text default 'en', device text default null)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  q text := left(btrim(coalesce(question, '')), 500);
  a text := left(btrim(coalesce(answer, '')), 4000);
  l text := left(coalesce(lang, ''), 8);
  dev text := left(btrim(coalesce(device, '')), 64);
  uid uuid := auth.uid();
  used int;
begin
  if q = '' or a = '' then
    raise exception 'empty' using errcode = '22023';
  end if;
  if uid is null and dev = '' then
    raise exception 'signin' using errcode = 'P0001';
  end if;

  -- Limits: 20 a day per account or install, and 1,000 a day overall.
  select count(*) into used from private.ask_reports r
   where r.at > now() - interval '1 day' and ((uid is not null and r.user_id = uid) or (uid is null and r.device = dev));
  if used >= 20 then raise exception 'limit' using errcode = 'P0001'; end if;
  select count(*) into used from private.ask_reports r where r.at > now() - interval '1 day';
  if used >= 1000 then raise exception 'limit' using errcode = 'P0001'; end if;

  insert into private.ask_reports (user_id, device, lang, question, answer) values (uid, nullif(dev, ''), l, q, a);
end;
$$;

revoke all on function public.report_ask_answer(text, text, text, text) from public;
grant execute on function public.report_ask_answer(text, text, text, text) to anon, authenticated;
