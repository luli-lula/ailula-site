// One-off: copy the old Hugo posts and projects into src/content (old repo is read only).
// Run: npx tsx scripts/migrate.ts
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { migratePost, migrateProject } from './migrate-lib';

const OLD = '/Users/lu/Documents/Side-Projects/luli-lula.github.io/content';
const OUT = new URL('../src/content/', import.meta.url).pathname;

function run(dir: string, out: string, migrate: typeof migratePost | typeof migrateProject) {
  let n = 0;
  for (const name of readdirSync(join(OLD, dir))) {
    if (!/\.(zh|en)\.md$/.test(name) || name.startsWith('_index')) continue;
    const { slug, lang, frontmatter, body } = migrate({ name, raw: readFileSync(join(OLD, dir, name), 'utf8') });
    mkdirSync(join(OUT, out, slug), { recursive: true });
    writeFileSync(join(OUT, out, slug, `${lang}.md`), matter.stringify(body, frontmatter));
    n++;
  }
  console.log(`${out}: ${n} files`);
}

run('posts', 'posts', migratePost);
run('projects', 'projects', migrateProject);
