-- Noor: jamaat (iqamah) times of mosques, shared by the people who pray there.
--
-- Anyone can read. Signed-in people can share a mosque's times, confirm times someone else shared, or
-- report a wrong entry (three reports hide it until a moderator looks). Times are community-shared and
-- shown as unverified, so nobody is told they are official. Clients use the functions below and never
-- touch the tables.

create table if not exists public.mosque_jamaat (
  osm_id        text primary key check (osm_id ~ '^(node|way|relation)/[0-9]{1,15}$'),
  name          text check (name is null or char_length(name) <= 120),
  times         jsonb       not null,
  updated_by    uuid        not null references auth.users (id) on delete cascade,
  updated_at    timestamptz not null default now(),
  confirmations int         not null default 0,
  report_count  int         not null default 0,
  hidden        boolean     not null default false
);

create table if not exists public.jamaat_votes (
  osm_id     text not null references public.mosque_jamaat (osm_id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('confirm', 'report')),
  created_at timestamptz not null default now(),
  primary key (osm_id, user_id, kind)
);

alter table public.mosque_jamaat enable row level security;
alter table public.jamaat_votes  enable row level security;
revoke all on public.mosque_jamaat, public.jamaat_votes from anon, authenticated;

-- What the app reads: one mosque's shared times, unless hidden.
create or replace view public.jamaat_public as
  select osm_id, name, times, updated_at, confirmations
    from public.mosque_jamaat
   where not hidden;
grant select on public.jamaat_public to anon, authenticated;

-- Share (or replace) a mosque's times. Only the five prayers are accepted, each a valid "HH:MM" or a
-- number of minutes after the adhan. Mirrors src/features/jamaat/rules.ts.
create or replace function public.share_jamaat(p_osm_id text, p_name text, p_times jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  k text;
  v jsonb;
begin
  if uid is null then raise exception 'sign in'; end if;
  if jsonb_typeof(p_times) <> 'object' or length(p_times::text) > 600 then raise exception 'shape'; end if;
  for k, v in select * from jsonb_each(p_times) loop
    if k not in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha') then raise exception 'prayer'; end if;
    if v->>'kind' = 'fixed' then
      if coalesce(v->>'at', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'time'; end if;
    elsif v->>'kind' = 'after' then
      if coalesce(v->>'minutes', '') !~ '^[0-9]{1,2}$' or (v->>'minutes')::int not between 1 and 90 then raise exception 'minutes'; end if;
    else
      raise exception 'kind';
    end if;
  end loop;
  if (select count(*) from public.mosque_jamaat where updated_by = uid and updated_at > now() - interval '1 day') >= 10 then
    raise exception 'rate';
  end if;
  -- Times other people have confirmed can't be quietly replaced: report them first, or wait a month.
  if exists (
    select 1 from public.mosque_jamaat
     where osm_id = p_osm_id and updated_by <> uid and not hidden
       and confirmations >= 2 and updated_at > now() - interval '30 days'
  ) then raise exception 'locked'; end if;
  insert into public.mosque_jamaat (osm_id, name, times, updated_by)
  values (p_osm_id, nullif(btrim(p_name), ''), p_times, uid)
  on conflict (osm_id) do update
    set times = excluded.times, name = excluded.name, updated_by = uid, updated_at = now(),
        confirmations = 0, report_count = 0, hidden = false;
  delete from public.jamaat_votes where osm_id = p_osm_id;
end $$;

-- Say the shown times are right (one vote each).
create or replace function public.confirm_jamaat(p_osm_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in'; end if;
  insert into public.jamaat_votes (osm_id, user_id, kind) values (p_osm_id, uid, 'confirm') on conflict do nothing;
  if found then update public.mosque_jamaat set confirmations = confirmations + 1 where osm_id = p_osm_id; end if;
end $$;

-- Report wrong times. Three reports hide the entry until a moderator looks.
create or replace function public.report_jamaat(p_osm_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in'; end if;
  insert into public.jamaat_votes (osm_id, user_id, kind) values (p_osm_id, uid, 'report') on conflict do nothing;
  if found then
    update public.mosque_jamaat set report_count = report_count + 1, hidden = hidden or report_count + 1 >= 3 where osm_id = p_osm_id;
  end if;
end $$;

revoke all on function public.share_jamaat(text, text, jsonb), public.confirm_jamaat(text), public.report_jamaat(text) from public, anon;
grant execute on function public.share_jamaat(text, text, jsonb), public.confirm_jamaat(text), public.report_jamaat(text) to authenticated;
