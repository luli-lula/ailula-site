// Copies lula's Douban marks (from the douban-data repo, read only) into the cinema:
// public/douban/{movies,books}.json (compact rows, newest first) and 160px WebP covers in
// public/posters/{movies,books}/. Covers come from douban-data's local images when it has them,
// otherwise from Douban (with a Douban Referer, at most 3 a second). One failed cover never stops the run.
// Run: node scripts/sync-douban.mjs [movies|books] [--no-covers]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { watched } from './douban-lib.mjs';

const LOCAL = new URL('../../douban-data/', import.meta.url).pathname;
const RAW = 'https://raw.githubusercontent.com/luli-lula/douban-data/main/';
const hidden = JSON.parse(readFileSync(new URL('../src/data/douban/hidden.json', import.meta.url), 'utf8'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function source(kind) {
  const local = `${LOCAL}data/${kind}.json`;
  if (existsSync(local)) return JSON.parse(readFileSync(local, 'utf8'));
  const res = await fetch(`${RAW}data/${kind}.json`);
  if (!res.ok) throw new Error(`douban-data ${kind}: HTTP ${res.status}`);
  return res.json();
}

async function cover(kind, item, to) {
  const local = `${LOCAL}images/${kind}/${item.id}.jpg`;
  let input;
  if (existsSync(local)) input = readFileSync(local);
  else {
    if (!item.poster_url) return 'no url';
    const res = await fetch(item.poster_url, { headers: { Referer: `https://${kind === 'movies' ? 'movie' : 'book'}.douban.com/`, 'User-Agent': UA } });
    if (!res.ok) return `HTTP ${res.status}`;
    input = Buffer.from(await res.arrayBuffer());
    await sleep(340);
  }
  await sharp(input).resize({ width: 160, withoutEnlargement: true }).webp({ quality: 70 }).toFile(to);
  return null;
}

const args = process.argv.slice(2);
const noCovers = args.includes('--no-covers');
const only = args.find((a) => !a.startsWith('--'));
for (const kind of only ? [only] : ['movies', 'books']) {
  const items = await source(kind);
  const byId = new Map(items.map((i) => [String(i.id), i]));
  const rows = watched(items, hidden, kind);
  const dir = new URL(`../public/posters/${kind}/`, import.meta.url).pathname;
  mkdirSync(dir, { recursive: true });
  const failed = [];
  for (const row of rows) {
    const to = `${dir}${row.id}.webp`;
    if (!noCovers && !existsSync(to)) {
      try {
        const why = await cover(kind, byId.get(row.id), to);
        if (why) failed.push(`${row.id} ${why}`);
      } catch (e) {
        failed.push(`${row.id} ${e.message}`);
      }
    }
    if (existsSync(to)) row.p = 1;
  }
  mkdirSync(new URL('../public/douban/', import.meta.url), { recursive: true });
  writeFileSync(new URL(`../public/douban/${kind}.json`, import.meta.url), JSON.stringify(rows));
  console.log(`${kind}: ${rows.length} rows, ${rows.filter((r) => r.p).length} covers, ${failed.length} failed`);
  if (failed.length) console.log(failed.slice(0, 20).join('\n'));
}
