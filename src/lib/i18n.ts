import { ui, type UiKey } from '../i18n/ui';

export type Lang = 'en' | 'zh';
export const LANGS: Lang[] = ['en', 'zh'];

// English lives at the root, Chinese under /zh/.
export function localizedPath(path: string, lang: Lang): string {
  const bare = path.replace(/^\/zh(?=\/|$)/, '') || '/';
  return lang === 'zh' ? `/zh${bare === '/' ? '/' : bare}` : bare;
}

export function langFromPath(path: string): Lang {
  return /^\/zh(\/|$)/.test(path) ? 'zh' : 'en';
}

export function pickTranslation<T extends { lang: Lang }>(entries: T[], lang: Lang): { entry: T; fallback: boolean } {
  const exact = entries.find((e) => e.lang === lang);
  if (exact) return { entry: exact, fallback: false };
  return { entry: entries[0], fallback: true };
}

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}
