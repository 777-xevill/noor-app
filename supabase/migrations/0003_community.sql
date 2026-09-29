-- Noor community: a wall of dua requests. People ask others to pray for them; others answer only
-- with "Ameen". No comments, links or images. Reported posts hide automatically for review, anyone
-- can block an author, and posts disappear from the wall after 30 days.
--
-- Clients never touch the tables directly. They read the `dua_feed` view, which never exposes who
-- wrote a post (so an anonymous request can't be tied to its author), and write through the
-- functions below, which check every request.

create table if not exists public.dua_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  text         text        not null check (char_length(text) between 3 and 280),
  display_name text        check (display_name is null or char_length(display_name) between 1 and 40),
  lang         text        not null check (lang in ('en', 'bn')),
  created_at   timestamptz not null default now(),
  report_count int         not null default 0,
  hidden       boolean     not null default false
);
create index if not exists dua_requests_feed on public.dua_requests (lang, created_at desc);

create table if not exists public.dua_ameens (
  request_id uuid not null references public.dua_requests (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table if not exists public.dua_reports (
  request_id uuid not null references public.dua_requests (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  reason     text not null check (reason in ('inappropriate', 'not_a_dua', 'spam', 'personal_info')),
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table if not exists public.user_blocks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

-- Locked down: row-level security on, and no table access for app users at all.
alter table public.dua_requests enable row level security;
alter table public.dua_ameens   enable row level security;
alter table public.dua_reports  enable row level security;
alter table public.user_blocks  enable row level security;
revoke all on public.dua_requests, public.dua_ameens, public.dua_reports, public.user_blocks from anon, authenticated;

-- The wall. Runs as its owner so it can count Ameens, and applies the rules itself: visible,
-- recent, and not from someone the reader has blocked. It never returns user_id.
create or replace view public.dua_feed as
  select r.id, r.text, r.display_name, r.lang, r.created_at,
         (r.user_id = auth.uid()) as mine,
         (select count(*) from public.dua_ameens a where a.request_id = r.id)::int as ameens,
         exists (select 1 from public.dua_ameens a where a.request_id = r.id and a.user_id = auth.uid()) as said_ameen
    from public.dua_requests r
   where not r.hidden
     and r.created_at > now() - interval '30 days'
     and not exists (select 1 from public.user_blocks b where b.user_id = auth.uid() and b.blocked_id = r.user_id);
grant select on public.dua_feed to anon, authenticated;

-- Post a request. Mirrors the app's own checks (src/features/community/rules.ts).
create or replace function public.post_dua_request(p_text text, p_display_name text, p_lang text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  body text := btrim(p_text);
  new_id uuid;
begin
  if uid is null then raise exception 'sign in to post'; end if;
  if char_length(body) < 3 or char_length(body) > 280 then raise exception 'length'; end if;
  if body ~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|io|me|bd|xyz)\b)' then raise exception 'links'; end if;
  if regexp_replace(body, '[\s().+-]', '', 'g') ~ '[0-9০-৯]{7,}' then raise exception 'phone'; end if;
  if (select count(*) from public.dua_requests where user_id = uid and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate';
  end if;
  insert into public.dua_requests (user_id, text, display_name, lang)
  values (uid, body, nullif(btrim(p_display_name), ''), p_lang)
  returning id into new_id;
  return new_id;
end $$;

-- Say or take back "Ameen". Returns whether the caller has now said it.
create or replace function public.toggle_ameen(p_request uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in'; end if;
  if exists (select 1 from public.dua_ameens where request_id = p_request and user_id = uid) then
    delete from public.dua_ameens where request_id = p_request and user_id = uid;
    return false;
  end if;
  insert into public.dua_ameens (request_id, user_id) values (p_request, uid);
  return true;
end $$;

-- Report a request. Three reports hide it until a moderator looks (see supabase/README.md).
create or replace function public.report_dua_request(p_request uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in'; end if;
  insert into public.dua_reports (request_id, user_id, reason) values (p_request, uid, p_reason)
  on conflict do nothing;
  if found then
    update public.dua_requests set report_count = report_count + 1, hidden = hidden or report_count + 1 >= 3
     where id = p_request;
  end if;
end $$;

-- Hide everything from a request's author, without revealing who they are.
create or replace function public.block_dua_author(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); author uuid;
begin
  if uid is null then raise exception 'sign in'; end if;
  select user_id into author from public.dua_requests where id = p_request;
  if author is null or author = uid then return; end if;
  insert into public.user_blocks (user_id, blocked_id) values (uid, author) on conflict do nothing;
end $$;

-- Delete one's own request.
create or replace function public.delete_my_dua_request(p_request uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.dua_requests where id = p_request and user_id = auth.uid();
$$;

revoke all on function public.post_dua_request(text, text, text), public.toggle_ameen(uuid), public.report_dua_request(uuid, text),
  public.block_dua_author(uuid), public.delete_my_dua_request(uuid) from public, anon;
grant execute on function public.post_dua_request(text, text, text), public.toggle_ameen(uuid), public.report_dua_request(uuid, text),
  public.block_dua_author(uuid), public.delete_my_dua_request(uuid) to authenticated;
