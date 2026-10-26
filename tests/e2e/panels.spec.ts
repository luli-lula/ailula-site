import { expect, test, type Page } from '@playwright/test';

// Valley panels are frosted glass over the scene. Text must stay readable whatever the scene behind it,
// so contrast is checked with the panel colour composited over the lightest and darkest scene colours.
const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number) as [number, number, number, number?];
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const over = (top: number[], a: number, under: number[]) => top.slice(0, 3).map((v, i) => v * a + under[i] * (1 - a));
const ratio = (x: number[], y: number[]) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const SCENE = [[255, 255, 255], [32, 38, 64], [61, 106, 60], [196, 67, 44]]; // sky, night, fir, dogwood

async function openGarden(page: Page, night = false) {
  await page.addInitScript((n) => { localStorage.setItem('ailula-mode', 'hifi'); localStorage.setItem('ailula-night', n ? '1' : '0'); }, night);
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('garden'));
  const panel = page.locator('[data-panel="garden"]');
  await expect(panel).toBeVisible();
  return panel;
}

const colours = (page: Page) => page.evaluate(() => {
  const p = document.querySelector<HTMLElement>('[data-panel="garden"]')!;
  const cs = getComputedStyle(p);
  const link = p.querySelector<HTMLElement>('.vlist a')!;
  return { bg: cs.backgroundColor, filter: cs.backdropFilter || (cs as any).webkitBackdropFilter, text: cs.color, link: getComputedStyle(link).color };
});

test('panel is frosted glass', async ({ page }) => {
  await openGarden(page);
  const c = await colours(page);
  expect(c.filter).toContain('blur');
  expect(parse(c.bg)[3] ?? 1).toBeLessThan(0.9);
});

test('panel text stays readable over any part of the scene', async ({ page }) => {
  for (const night of [false, true]) {
    await openGarden(page, night);
    const c = await colours(page);
    const bg = parse(c.bg), a = bg[3] ?? 1;
    for (const under of SCENE) for (const fg of [c.text, c.link]) expect(ratio(parse(fg), over(bg, a, under)), `night=${night} ${fg} over ${under}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('night panel is dark glass with light text', async ({ page }) => {
  await openGarden(page, true);
  const c = await colours(page);
  expect(lum(parse(c.bg))).toBeLessThan(0.1);
  expect(lum(parse(c.text))).toBeGreaterThan(0.6);
});

test('list rows keep the date and the title side by side', async ({ page }) => {
  await openGarden(page);
  const rows = await page.$$eval('[data-panel="garden"] .vlist li', (lis) => lis.map((li) => {
    const t = li.querySelector('time')!.getBoundingClientRect(), a = li.querySelector('a')!.getBoundingClientRect();
    return { dt: Math.abs(t.top - a.top), left: a.left > t.right };
  }));
  expect(rows.length).toBeGreaterThan(3);
  for (const r of rows) { expect(r.dt).toBeLessThanOrEqual(4); expect(r.left).toBe(true); }
});

test('Chinese-only posts carry a small badge, not the words "Chinese only"', async ({ page }) => {
  const panel = await openGarden(page);
  await expect(panel).not.toContainText('Chinese only');
  expect(await panel.locator('.zh-badge').count()).toBeGreaterThan(0);
  await expect(panel.locator('.zh-badge').first()).toHaveAttribute('title', 'Chinese only');
});

test('panel title and close stay in view while the list scrolls', async ({ page }) => {
  const panel = await openGarden(page);
  const scrolled = await panel.evaluate((p) => {
    const scroller = [p, ...p.querySelectorAll<HTMLElement>('*')].find((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY))!;
    scroller.scrollTop = 400;
    return scroller.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(100);
  await page.waitForTimeout(100);
  const [pr, cr] = await Promise.all([panel.boundingBox(), panel.locator('[data-close]').boundingBox()]);
  expect(cr!.y).toBeGreaterThanOrEqual(pr!.y);
  expect(cr!.y).toBeLessThan(pr!.y + 60);
});
