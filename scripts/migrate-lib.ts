// Pure helpers for moving the old Hugo content into Astro collections.
import matter from 'gray-matter';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';

export type Lang = 'en' | 'zh';
export type Kind = 'essay' | 'notes' | 'weekly' | 'old-notes';
export type Maturity = 'seedling' | 'growing' | 'mature';

export const MATURITY_BY_KIND: Record<Kind, Maturity> = {
  essay: 'mature',
  notes: 'growing',
  weekly: 'seedling',
  'old-notes': 'mature',
};

// Hugo's urlize: lowercase, spaces become '-', keep letters/digits/-/_/., drop everything else.
export function hugoUrlize(s: string): string {
  let out = '';
  for (const ch of s.toLowerCase()) {
    if (ch === ' ') out += '-';
    else if (/[\p{L}\p{N}\-_.]/u.test(ch)) out += ch;
  }
  return out;
}

export function classifyKind(title: string, tags: string[], date: Date): Kind {
  if (date.getFullYear() <= 2017) return 'old-notes';
  if (/^[📖🎬《]/u.test(title)) return 'notes';
  if (/week|一周一记|小结/i.test(title) || tags.some((t) => t.toLowerCase() === 'life')) return 'weekly';
  return 'essay';
}

function parseFile(raw: string) {
  const toml = raw.trimStart().startsWith('+++');
  return toml
    ? matter(raw, { language: 'toml', delimiters: '+++', engines: { toml: (s: string) => parseToml(s) as object } })
    : // Hugo tolerates duplicated keys in old posts; the last one wins, as in Hugo.
      matter(raw, { engines: { yaml: (s: string) => (parseYaml(s, { uniqueKeys: false }) ?? {}) as object } });
}

function splitName(name: string): { stem: string; lang: Lang } {
  const m = name.match(/^(.*)\.(zh|en)\.md$/);
  if (!m) throw new Error(`unexpected content file name: ${name}`);
  return { stem: m[1], lang: m[2] as Lang };
}

const toDate = (v: unknown) => new Date(v instanceof Date ? v.getTime() : String(v));
const toTags = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

export function migratePost(file: { name: string; raw: string }) {
  const { stem, lang } = splitName(file.name);
  const { data, content } = parseFile(file.raw);
  const slug = hugoUrlize(stem);
  const title = String(data.title ?? stem).trim();
  const date = toDate(data.date);
  const tags = toTags(data.tags);
  const kind = classifyKind(title, tags, date);
  return {
    slug,
    lang,
    frontmatter: {
      title,
      date,
      lang,
      kind,
      maturity: MATURITY_BY_KIND[kind],
      tags,
      legacyPaths: [lang === 'zh' ? `/zh/posts/${slug}/` : `/posts/${slug}/`],
    },
    body: content.trim() + '\n',
  };
}

export function migrateProject(file: { name: string; raw: string }) {
  const { stem, lang } = splitName(file.name);
  const { data, content } = parseFile(file.raw);
  const slug = hugoUrlize(stem);
  const links: { label: string; url: string }[] = [];
  if (data.demoUrl) links.push({ label: 'Demo', url: String(data.demoUrl) });
  if (data.projectUrl) links.push({ label: 'GitHub', url: String(data.projectUrl) });
  return {
    slug,
    lang,
    frontmatter: {
      title: String(data.title ?? stem).trim(),
      date: toDate(data.date),
      lang,
      summary: String(data.description ?? ''),
      status: String(data.status ?? '').toLowerCase() === 'active' ? ('live' as const) : ('wip' as const),
      tags: toTags(data.techStack ?? data.tags),
      links,
      legacyPaths: [lang === 'zh' ? `/zh/projects/${slug}/` : `/projects/${slug}/`],
    },
    body: content.trim() + '\n',
  };
}
