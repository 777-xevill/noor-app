-- Ask Noor: questions asked per user per day, so one account can't run up the Groq bill.
-- Only the `ask` edge function (service role) reads or writes it.
create table if not exists public.ask_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ask_usage enable row level security;
revoke all on public.ask_usage from anon, authenticated;
