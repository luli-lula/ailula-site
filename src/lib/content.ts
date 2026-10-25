// Groups per-language entries ("<slug>/<lang>.md") and picks the one to show for a language.
import { getCollection, type CollectionEntry } from 'astro:content';
import { pickTranslation, type Lang } from './i18n';

type Name = 'posts' | 'projects';

export function slugOf(entry: { filePath?: string }): string {
  const parts = (entry.filePath ?? '').split('/');
  return parts[parts.length - 2];
}

export async function localized<N extends Name>(name: N, lang: Lang) {
  const all = (await getCollection(name)) as CollectionEntry<N>[];
  const bySlug = new Map<string, CollectionEntry<N>[]>();
  for (const e of all) {
    const s = slugOf(e);
    bySlug.set(s, [...(bySlug.get(s) ?? []), e]);
  }
  return [...bySlug.entries()].map(([slug, entries]) => {
    const { entry, fallback } = pickTranslation(entries.map((e) => ({ ...e, lang: e.data.lang as Lang })), lang);
    return { slug, entry: entry as unknown as CollectionEntry<N>, fallback };
  });
}

export const byDateDesc = (a: { entry: { data: { date?: Date } } }, b: { entry: { data: { date?: Date } } }) =>
  (b.entry.data.date?.getTime() ?? 0) - (a.entry.data.date?.getTime() ?? 0);
