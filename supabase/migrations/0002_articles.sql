-- Noor: articles, written in Supabase Studio. Anyone can read an article only once it has a named
-- reviewer and its publish time has passed. Writing is for the project's editors (service role).

create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text        not null,
  lang         text        not null check (lang in ('en', 'bn')),
  title        text        not null,
  summary      text        not null default '',
  -- Plain text: paragraphs separated by a blank line; "## " starts a heading, "- " a list item,
  -- "> " a quotation. Quran and hadith quotes must match a named source exactly.
  body         text        not null,
  author       text        not null,
  -- The scholar who checked the article. Left empty, the article stays hidden.
  reviewed_by  text,
  sources      jsonb       not null default '[]'::jsonb,  -- [{ "title": "...", "url": "..." }]
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (slug, lang)
);

alter table public.articles enable row level security;

create policy "read reviewed, published articles" on public.articles for select
  using (reviewed_by is not null and published_at is not null and published_at <= now());
