-- Noor: one private row per account holding the synced copy of the user's data.
-- Row-level security means a signed-in user can read and write only their own row.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "read own data"   on public.user_data for select using (auth.uid() = user_id);
create policy "insert own data" on public.user_data for insert with check (auth.uid() = user_id);
create policy "update own data" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own data" on public.user_data for delete using (auth.uid() = user_id);

-- In-app account deletion (required by the App Store and Google Play). Removing the auth user
-- also removes their user_data row through the foreign key.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
