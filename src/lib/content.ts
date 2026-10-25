// Groups per-language entries ("<slug>/<lang>.md") and picks the one to show for a language.
import { getCollection, type CollectionEntry } from 'astro:content';
import { pickTranslation, type Lang } from './i18n';

type Name = 'posts' | 'projects';

export function slugOf(entry: { filePath?: string }): string {
  const parts = (entry.filePath ?? '').split('/');
  return parts[parts.length - 2];
}

export async function localized<N extends Name>(name: N, lang: Lang) {
  // Drafts stay in the repo but are never listed or built.
  const all = ((await getCollection(name)) as CollectionEntry<N>[]).filter((e) => !(e.data as { draft?: boolean }).draft);
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

export const CATEGORY_ORDER = ['plants', 'learning', 'tools'] as const;
export type Category = (typeof CATEGORY_ORDER)[number];

// Projects grouped for display: plants first; inside a group featured first, then by order, then newest.
export async function projectGroups(lang: Lang) {
  const items = await localized('projects', lang);
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items
      .filter((p) => p.entry.data.category === category)
      .sort(
        (a, b) =>
          Number(b.entry.data.featured) - Number(a.entry.data.featured) ||
          (a.entry.data.order ?? Infinity) - (b.entry.data.order ?? Infinity) ||
          byDateDesc(a, b),
      ),
  })).filter((g) => g.items.length > 0);
}

export const hostOf = (url: string) => new URL(url).host + new URL(url).pathname.replace(/\/$/, '');

export const STATUS_KEY = { live: 'statusLive', wip: 'statusWip', paused: 'statusPaused', done: 'statusDone' } as const;
