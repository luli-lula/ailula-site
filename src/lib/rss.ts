import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { byDateDesc, localized } from './content';
import { localizedPath, t, type Lang } from './i18n';

// Same feed addresses as the old Hugo site (/index.xml, /zh/index.xml).
export async function feed(context: APIContext, lang: Lang) {
  // Only posts readable in this language (the English feed leaves out the Chinese-only ones).
  const posts = (await localized('posts', lang)).filter((p) => !p.fallback).sort(byDateDesc);
  return rss({
    title: 'lula',
    description: t(lang, 'slogan'),
    site: context.site!,
    items: posts.map(({ slug, entry }) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      link: localizedPath(`/writing/${slug}/`, lang),
    })),
  });
}
