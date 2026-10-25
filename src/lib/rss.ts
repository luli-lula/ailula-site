import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { byDateDesc, localized } from './content';
import { localizedPath, t, type Lang } from './i18n';

// Same feed addresses as the old Hugo site (/index.xml, /zh/index.xml).
export async function feed(context: APIContext, lang: Lang) {
  const posts = (await localized('posts', lang)).sort(byDateDesc);
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
