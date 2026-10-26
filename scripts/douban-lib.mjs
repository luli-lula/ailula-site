// Pure helpers for the cinema's data, shared by scripts/sync-douban.mjs and its unit test.

// One compact row per film or book: id, title, year, rating (0 = unrated), date marked, comment, and
// the first director (films) or author (books).
export function compact(item, kind) {
  const r = Number.parseInt(item.rating, 10);
  const by = (kind === 'movies' ? item.directors : item.author) ?? [];
  return { id: String(item.id), t: item.title, y: item.year ?? '', r: Number.isFinite(r) ? r : 0, d: item.mark_date ?? '', c: (item.comment ?? '').trim(), by: by[0] ?? '' };
}

// Only what lula watched or read, minus the ids she hid, newest first.
export function watched(items, hidden, kind) {
  const skip = new Set(hidden.map(String));
  return items
    .filter((i) => i.status === 'done' && !skip.has(String(i.id)))
    .map((i) => compact(i, kind))
    .sort((a, b) => b.d.localeCompare(a.d));
}

export function stats(rows) {
  const years = rows.map((r) => Number(r.d.slice(0, 4))).filter(Boolean);
  return { count: rows.length, comments: rows.filter((r) => r.c).length, since: Math.min(...years) };
}
