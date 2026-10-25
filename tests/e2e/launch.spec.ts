import { expect, test } from '@playwright/test';

test('sitemap and robots exist; lab pages are hidden from search', async ({ request, page }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://ailula.top/sitemap-index.xml');
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sm = await request.get('/sitemap-0.xml');
  const xml = await sm.text();
  expect(xml).toContain('https://ailula.top/projects/floradex/');
  expect(xml).not.toContain('/lab/');
  await page.goto('/lab/valley/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('pages carry a social preview and a favicon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ailula.top/og.jpg');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /lula/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
});

test('unknown addresses get a friendly 404 with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res!.status()).toBe(404);
  await expect(page.getByRole('link', { name: /home|首页/i }).first()).toBeVisible();
});

test.describe('reduced motion in hi-fi', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no auto-rotation, no falling particles, instant camera moves', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.evaluate(() => (window as any).__valley.select('workshop'));
    await page.waitForTimeout(150);
    const target = await page.evaluate(() => (window as any).__valley.cameraTarget());
    expect(target[0]).toBeCloseTo(-16, 0);
  });
});

test.describe('small phone', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('visible place labels never overlap', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.waitForTimeout(800);
    const boxes = await page.$$eval('.valley-label', (els) =>
      els.filter((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').map((e) => e.getBoundingClientRect().toJSON()),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlap, `labels ${i} and ${j} overlap`).toBe(false);
      }
  });
});
