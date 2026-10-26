import { describe, expect, test } from 'vitest';
// @ts-expect-error plain ESM script without types
import { compact, watched, stats } from '../../scripts/douban-lib.mjs';

const movie = { title: '海街日记', id: '25895901', status: 'done', rating: '5', poster_url: 'https://img/p.jpg', douban_url: 'https://movie.douban.com/subject/25895901/', mark_date: '2016-01-02', comment: '  好看  ', tags: '', genres: ['剧情'], year: '2015', directors: ['是枝裕和', 'x'] };
const book = { title: 'Light and Thread', id: '37868908', status: 'done', rating: 'unrated', mark_date: '2026-10-08', comment: '', year: '2026', author: ['Han Kang'], publisher: 'Hogarth' };

describe('douban data for the cinema', () => {
  test('a movie becomes a compact row', () => {
    expect(compact(movie, 'movies')).toEqual({ id: '25895901', t: '海街日记', y: '2015', r: 5, d: '2016-01-02', c: '好看', by: '是枝裕和' });
  });
  test('a book keeps its author; unrated becomes 0', () => {
    expect(compact(book, 'books')).toEqual({ id: '37868908', t: 'Light and Thread', y: '2026', r: 0, d: '2026-10-08', c: '', by: 'Han Kang' });
  });
  test('only watched or read items, minus hidden ones, newest first', () => {
    const items = [
      { ...movie, id: '1', mark_date: '2014-01-01' },
      { ...movie, id: '2', status: 'mark' },
      { ...movie, id: '3', mark_date: '2020-05-05' },
      { ...movie, id: '4', mark_date: '2019-01-01' },
    ];
    expect(watched(items, ['4'], 'movies').map((r: { id: string }) => r.id)).toEqual(['3', '1']);
  });
  test('stats count items and comments and find the first year', () => {
    const rows = [{ d: '2016-01-02', c: 'a' }, { d: '2013-03-28', c: '' }, { d: '2020-01-01', c: 'b' }];
    expect(stats(rows)).toEqual({ count: 3, comments: 2, since: 2013 });
  });
});
