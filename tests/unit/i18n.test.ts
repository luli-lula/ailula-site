import { describe, expect, test } from 'vitest';
import { localizedPath, pickTranslation, t } from '../../src/lib/i18n';
import { ui } from '../../src/i18n/ui';

describe('localizedPath', () => {
  test('adds and removes the /zh prefix', () => {
    expect(localizedPath('/writing/a/', 'zh')).toBe('/zh/writing/a/');
    expect(localizedPath('/zh/writing/a/', 'en')).toBe('/writing/a/');
    expect(localizedPath('/zh/writing/a/', 'zh')).toBe('/zh/writing/a/');
  });

  test('home maps to home', () => {
    expect(localizedPath('/', 'zh')).toBe('/zh/');
    expect(localizedPath('/zh/', 'en')).toBe('/');
    expect(localizedPath('/zh', 'en')).toBe('/');
  });
});

describe('pickTranslation', () => {
  test('falls back to the only language available', () => {
    expect(pickTranslation([{ lang: 'zh' as const, id: 1 }], 'en')).toEqual({ entry: { lang: 'zh', id: 1 }, fallback: true });
  });

  test('prefers the requested language', () => {
    const both = [{ lang: 'zh' as const, id: 1 }, { lang: 'en' as const, id: 2 }];
    expect(pickTranslation(both, 'en')).toEqual({ entry: { lang: 'en', id: 2 }, fallback: false });
  });
});

describe('ui strings', () => {
  test('every key exists in both languages', () => {
    expect(Object.keys(ui.zh).sort()).toEqual(Object.keys(ui.en).sort());
  });

  test('language-only labels', () => {
    expect(t('en', 'chineseOnly')).toBe('Chinese only');
    expect(t('zh', 'englishOnly')).toBe('仅英文');
  });
});
