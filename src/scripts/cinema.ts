// The tree-hollow cinema: a wall of everything lula has watched (or read), newest first, grouped by year.
// Data is loaded on first use from /douban/{movies,books}.json (written by scripts/sync-douban.mjs), so the
// home page does not carry it.
type Row = { id: string; t: string; y: string; r: number; d: string; c: string; by: string; p?: 1 };
type Kind = 'movies' | 'books';
type Lang = 'en' | 'zh';

const cache: Partial<Record<Kind, Promise<Row[]>>> = {};
const load = (kind: Kind) => (cache[kind] ??= fetch(`/douban/${kind}.json`).then((r) => r.json()));

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const stars = (r: number) => (r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '');

const TEXT = {
  zh: {
    stats: (k: Kind, n: number, c: number, y: number) => (k === 'movies' ? `${y} 年起在豆瓣标记了 ${n} 部电影，写了 ${c} 条短评。` : `${y} 年起在豆瓣标记了 ${n} 本书，写了 ${c} 条短评。`),
    watched: (k: Kind) => (k === 'movies' ? '看过' : '读过'),
    noNote: '没有写短评。',
    unrated: '没有打分',
  },
  en: {
    stats: (k: Kind, n: number, c: number, y: number) => `Since ${y}, ${n} ${k === 'movies' ? 'films' : 'books'} logged on Douban, ${c} with a short note.`,
    watched: (k: Kind) => (k === 'movies' ? 'Watched' : 'Read'),
    noNote: 'No note.',
    unrated: 'Not rated',
  },
};

function tile(kind: Kind, row: Row, i: number) {
  const text = `<span class="tile-text"><b>${esc(row.t)}</b><i>${stars(row.r)}</i></span>`;
  const img = row.p ? `<img src="/posters/${kind}/${row.id}.webp" alt="" loading="lazy" width="160" height="230" />` : text;
  return `<button type="button" class="tile" data-i="${i}" data-r="${row.r}" data-c="${row.c ? 1 : 0}" title="${esc(row.t)}" aria-label="${esc(row.t)}">${img}</button>`;
}

export function mountCinema(root: HTMLElement) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';
  const lang = (root.dataset.lang as Lang) ?? 'en';
  const T = TEXT[lang];
  const wall = root.querySelector<HTMLElement>('[data-wall]')!;
  const years = root.querySelector<HTMLElement>('[data-years]')!;
  const statsEl = root.querySelector<HTMLElement>('[data-stats]')!;
  const card = root.querySelector<HTMLDialogElement>('dialog[data-card]')!;
  const search = root.querySelector<HTMLInputElement>('[data-cin-search]')!;
  let kind: Kind = 'movies';
  let rows: Row[] = [];
  let filter = 'all';
  let query = '';

  // A cover that fails to load turns into a text tile.
  wall.addEventListener('error', (e) => {
    const img = e.target as HTMLElement;
    if (img.tagName !== 'IMG') return;
    const row = rows[Number(img.closest<HTMLElement>('.tile')!.dataset.i)];
    img.outerHTML = `<span class="tile-text"><b>${esc(row.t)}</b><i>${stars(row.r)}</i></span>`;
  }, true);

  const apply = () => {
    const q = query.trim().toLowerCase();
    wall.querySelectorAll<HTMLElement>('.tile').forEach((el) => {
      const row = rows[Number(el.dataset.i)];
      const byFilter = filter === 'all' || (filter === 'five' && row.r === 5) || (filter === 'commented' && !!row.c);
      el.hidden = !byFilter || (!!q && !`${row.t} ${row.by}`.toLowerCase().includes(q));
    });
    wall.querySelectorAll<HTMLElement>('.cin-year').forEach((s) => (s.hidden = !s.querySelector('.tile:not([hidden])')));
    years.querySelectorAll<HTMLElement>('button').forEach((b) => (b.hidden = !!wall.querySelector(`.cin-year[data-year="${b.dataset.year}"][hidden]`)));
  };

  const render = async () => {
    wall.setAttribute('aria-busy', 'true');
    rows = await load(kind);
    const groups = new Map<string, number[]>();
    rows.forEach((r, i) => {
      const y = r.d.slice(0, 4) || '—';
      groups.set(y, [...(groups.get(y) ?? []), i]);
    });
    wall.innerHTML = [...groups].map(([y, idx]) => `<section class="cin-year" data-year="${y}"><h3>${y}</h3><div class="cin-grid">${idx.map((i) => tile(kind, rows[i], i)).join('')}</div></section>`).join('');
    years.innerHTML = [...groups.keys()].map((y) => `<button type="button" data-year="${y}">${y}</button>`).join('');
    const commented = rows.filter((r) => r.c).length;
    const since = Math.min(...rows.map((r) => Number(r.d.slice(0, 4))).filter(Boolean));
    statsEl.textContent = T.stats(kind, rows.length, commented, since);
    wall.removeAttribute('aria-busy');
    apply();
  };

  years.addEventListener('click', (e) => {
    const y = (e.target as HTMLElement).closest<HTMLElement>('button')?.dataset.year;
    if (y) wall.querySelector(`.cin-year[data-year="${y}"]`)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  wall.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.tile');
    if (!el) return;
    const row = rows[Number(el.dataset.i)];
    const host = kind === 'movies' ? 'movie' : 'book';
    card.querySelector('[data-card-body]')!.innerHTML = `
      <h3>${esc(row.t)}</h3>
      <p class="cin-meta">${[row.y, esc(row.by)].filter(Boolean).join(' · ')}</p>
      <p class="cin-stars" aria-label="${row.r}/5">${stars(row.r) || T.unrated}</p>
      <p class="cin-date">${T.watched(kind)} ${row.d}</p>
      ${row.c ? `<blockquote>${esc(row.c)}</blockquote>` : `<p class="cin-none">${T.noNote}</p>`}
      <p><a href="https://${host}.douban.com/subject/${row.id}/" target="_blank" rel="noopener">Douban ↗</a></p>`;
    card.showModal();
  });
  card.addEventListener('click', (e) => {
    if (e.target === card || (e.target as HTMLElement).closest('[data-card-close]')) card.close();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-cin-filter] button').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.f!;
      root.querySelectorAll('[data-cin-filter] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }),
  );
  let timer = 0;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => { query = search.value; apply(); }, 150);
  });

  root.querySelectorAll<HTMLButtonElement>('[role="tab"][data-kind]').forEach((tab) =>
    tab.addEventListener('click', () => {
      if (tab.dataset.kind === kind) return;
      kind = tab.dataset.kind as Kind;
      root.querySelectorAll('[role="tab"][data-kind]').forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
      render();
    }),
  );

  render();
}
