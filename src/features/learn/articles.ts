import { supabase } from '@/lib/supabase';
import type { Lang } from '@/i18n/langs';

// Articles live in the `articles` table (supabase/migrations/0002_articles.sql) and are written in
// Supabase Studio. Only rows with a named scholar reviewer and a publish time in the past can be
// read by the app; row-level security enforces it, and the queries below ask for the same.

export type Source = { title: string; url?: string };

export type ArticleSummary = { slug: string; title: string; summary: string; author: string; reviewed_by: string; published_at: string };
export type Article = ArticleSummary & { body: string; sources: Source[] };

export const articlesEnabled = supabase !== null;

export async function listArticles(lang: Lang): Promise<ArticleSummary[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, summary, author, reviewed_by, published_at')
    .eq('lang', lang)
    .not('reviewed_by', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getArticle(slug: string, lang: Lang): Promise<Article | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).eq('lang', lang).maybeSingle();
  if (error) throw error;
  return data;
}
