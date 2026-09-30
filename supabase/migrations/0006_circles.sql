-- Noor family circles: a small private group (family, friends) that reads the Quran together. The group
-- shares out the 30 juz; each person takes some, marks them done, and when all 30 are done the group has
-- completed a khatm and can begin the next.
--
-- People join with a 6-letter code. Members see each other's first names (the name each chose for the
-- circle) and nothing else: no email, no account id. Clients use the functions below and never touch
-- the tables. There is no chat and no free text beyond names.

create table if not exists public.circles (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) between 2 and 40),
  code       text        not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  owner      uuid        not null references auth.users (id) on delete cascade,
  khatm      int         not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id    uuid not null references public.circles (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at    timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.circle_juz (
  circle_id uuid not null references public.circles (id) on delete cascade,
  khatm     int  not null,
  juz       int  not null check (juz between 1 and 30),
  user_id   uuid not null references auth.users (id) on delete cascade,
  done      boolean not null default false,
  done_at   timestamptz,
  primary key (circle_id, khatm, juz)
);

alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_juz     enable row level security;
revoke all on public.circles, public.circle_members, public.circle_juz from anon, authenticated;

create or replace function public.is_circle_member(p_circle uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.circle_members where circle_id = p_circle and user_id = auth.uid());
$$;

-- Start a circle. The creator becomes its first member.
create or replace function public.create_circle(p_name text, p_display_name text)
returns table (id uuid, code text) language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  new_id uuid;
begin
  if uid is null then raise exception 'sign in'; end if;
  if char_length(btrim(p_name)) < 2 or char_length(btrim(p_name)) > 40 then raise exception 'name'; end if;
  if char_length(btrim(p_display_name)) < 1 or char_length(btrim(p_display_name)) > 40 then raise exception 'name'; end if;
  if (select count(*) from public.circle_members where user_id = uid) >= 5 then raise exception 'too many circles'; end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.circles c where c.code = new_code);
  end loop;
  insert into public.circles (name, code, owner) values (btrim(p_name), new_code, uid) returning circles.id into new_id;
  insert into public.circle_members (circle_id, user_id, display_name) values (new_id, uid, btrim(p_display_name));
  return query select new_id, new_code;
end $$;

-- Join with a code. Up to 30 people per circle.
create or replace function public.join_circle(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cid uuid;
begin
  if uid is null then raise exception 'sign in'; end if;
  if char_length(btrim(p_display_name)) < 1 or char_length(btrim(p_display_name)) > 40 then raise exception 'name'; end if;
  select c.id into cid from public.circles c where c.code = upper(btrim(p_code));
  if cid is null then raise exception 'no such circle'; end if;
  if not exists (select 1 from public.circle_members where circle_id = cid and user_id = uid) then
    if (select count(*) from public.circle_members where circle_id = cid) >= 30 then raise exception 'full'; end if;
    if (select count(*) from public.circle_members where user_id = uid) >= 5 then raise exception 'too many circles'; end if;
    insert into public.circle_members (circle_id, user_id, display_name) values (cid, uid, btrim(p_display_name));
  end if;
  return cid;
end $$;

-- Leave a circle. Claimed juz that aren't finished are released. The oldest member takes over if the
-- owner leaves, and the circle is removed when the last member goes.
create or replace function public.leave_circle(p_circle uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  heir uuid;
begin
  if uid is null then raise exception 'sign in'; end if;
  delete from public.circle_juz where circle_id = p_circle and user_id = uid and not done;
  delete from public.circle_members where circle_id = p_circle and user_id = uid;
  select user_id into heir from public.circle_members where circle_id = p_circle order by joined_at limit 1;
  if heir is null then
    delete from public.circles where id = p_circle;
  else
    update public.circles set owner = heir where id = p_circle and owner = uid;
  end if;
end $$;

-- Circles I belong to, with progress on the current khatm.
create or replace function public.my_circles()
returns table (id uuid, name text, code text, khatm int, members int, juz_done int)
language sql security definer stable set search_path = '' as $$
  select c.id, c.name, c.code, c.khatm,
         (select count(*)::int from public.circle_members m where m.circle_id = c.id),
         (select count(*)::int from public.circle_juz j where j.circle_id = c.id and j.khatm = c.khatm and j.done)
    from public.circles c
   where public.is_circle_member(c.id)
   order by c.created_at;
$$;

-- Everything the circle screen shows. Names are the ones chosen for this circle; account ids never leave.
create or replace function public.circle_state(p_circle uuid)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare
  uid uuid := auth.uid();
  c public.circles;
begin
  if not public.is_circle_member(p_circle) then raise exception 'not a member'; end if;
  select * into c from public.circles where id = p_circle;
  return jsonb_build_object(
    'id', c.id, 'name', c.name, 'code', c.code, 'khatm', c.khatm, 'mineOwner', c.owner = uid,
    'members', coalesce((select jsonb_agg(jsonb_build_object('name', m.display_name, 'mine', m.user_id = uid) order by m.joined_at)
                           from public.circle_members m where m.circle_id = c.id), '[]'::jsonb),
    'juz', coalesce((select jsonb_agg(jsonb_build_object('juz', j.juz, 'by', m.display_name, 'mine', j.user_id = uid, 'done', j.done))
                       from public.circle_juz j
                       join public.circle_members m on m.circle_id = j.circle_id and m.user_id = j.user_id
                      where j.circle_id = c.id and j.khatm = c.khatm), '[]'::jsonb)
  );
end $$;

create or replace function public.claim_juz(p_circle uuid, p_juz int)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); k int;
begin
  if not public.is_circle_member(p_circle) then raise exception 'not a member'; end if;
  if p_juz not between 1 and 30 then raise exception 'juz'; end if;
  select khatm into k from public.circles where id = p_circle;
  begin
    insert into public.circle_juz (circle_id, khatm, juz, user_id) values (p_circle, k, p_juz, uid);
  exception when unique_violation then
    raise exception 'taken';
  end;
end $$;

create or replace function public.release_juz(p_circle uuid, p_juz int)
returns void language sql security definer set search_path = '' as $$
  delete from public.circle_juz j using public.circles c
   where c.id = p_circle and j.circle_id = c.id and j.khatm = c.khatm and j.juz = p_juz and j.user_id = auth.uid() and not j.done;
$$;

create or replace function public.finish_juz(p_circle uuid, p_juz int, p_done boolean)
returns void language sql security definer set search_path = '' as $$
  update public.circle_juz j set done = p_done, done_at = case when p_done then now() else null end
    from public.circles c
   where c.id = p_circle and j.circle_id = c.id and j.khatm = c.khatm and j.juz = p_juz and j.user_id = auth.uid();
$$;

-- Begin the next khatm once all 30 juz of this one are done.
create or replace function public.next_khatm(p_circle uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare k int;
begin
  if not public.is_circle_member(p_circle) then raise exception 'not a member'; end if;
  select khatm into k from public.circles where id = p_circle;
  if (select count(*) from public.circle_juz where circle_id = p_circle and khatm = k and done) < 30 then raise exception 'not finished'; end if;
  update public.circles set khatm = khatm + 1 where id = p_circle;
end $$;

revoke all on function public.is_circle_member(uuid), public.create_circle(text, text), public.join_circle(text, text), public.leave_circle(uuid),
  public.my_circles(), public.circle_state(uuid), public.claim_juz(uuid, int), public.release_juz(uuid, int),
  public.finish_juz(uuid, int, boolean), public.next_khatm(uuid) from public, anon;
grant execute on function public.create_circle(text, text), public.join_circle(text, text), public.leave_circle(uuid),
  public.my_circles(), public.circle_state(uuid), public.claim_juz(uuid, int), public.release_juz(uuid, int),
  public.finish_juz(uuid, int, boolean), public.next_khatm(uuid) to authenticated;
