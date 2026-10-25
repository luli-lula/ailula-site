// Lists every 待补充 placeholder in the built site: npm run build && node scripts/content-todo.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : n.endsWith('.html') ? [join(dir, n)] : []));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const rows = [];
for (const f of files(dist).sort()) {
  const notes = [...readFileSync(f, 'utf8').matchAll(/data-todo="([^"]*)"/g)].map((m) => decode(m[1]));
  if (notes.length) rows.push(`- \`/${relative(dist, f).replace(/index\.html$/, '')}\`: ${[...new Set(notes)].join('；')}`);
}
writeFileSync(
  new URL('../CONTENT-TODO.md', import.meta.url),
  `# 待补充内容\n\n由 \`node scripts/content-todo.mjs\` 根据构建结果生成。另外，项目页正文里写着「待补充 / TODO」的地方也需要补。\n\n${rows.join('\n')}\n`,
);
console.log(`${rows.length} pages with placeholders`);
