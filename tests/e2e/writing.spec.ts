import { expect, test } from '@playwright/test';

test.describe('lo-fi writing page', () => {
  test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi')));

  test('topic chips filter the list', async ({ page }) => {
    await page.goto('/zh/writing/');
    await page.locator('button[data-key="books"]').click();
    await expect(page.locator('button[data-key="books"]')).toHaveAttribute('aria-pressed', 'true');
    const visible = page.locator('main [data-keys]:visible');
    expect(await visible.count()).toBeGreaterThan(3);
    for (const k of await visible.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.keys!))) expect(k.split(' ')).toContain('books');
    await page.locator('button[data-key="all"]').click();
    expect(await page.locator('main [data-keys]:visible').count()).toBeGreaterThan(30);
  });

  test('English list puts translated posts first and the rest under "More in Chinese" with English titles', async ({ page }) => {
    await page.goto('/writing/');
    await expect(page.locator('main')).not.toContainText('Chinese only');
    const more = page.locator('#more-in-chinese');
    await expect(more.locator('h2')).toHaveText('More in Chinese');
    const link = more.getByRole('link', { name: 'Good Products Are Everywhere' });
    await expect(link).toHaveAttribute('href', /^\/zh\/writing\/029-/);
    await expect(more.locator('.zh-badge').first()).toBeVisible();
  });

  test('no growth-stage emoji anywhere in the writing list', async ({ page }) => {
    await page.goto('/zh/writing/');
    await expect(page.locator('main')).not.toContainText(/🌱|🌿|🌳/);
  });
});

test.describe('garden in hi-fi', () => {
  test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi')));
  const open = async (page: import('@playwright/test').Page, path = '/') => {
    await page.goto(path);
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.evaluate(() => (window as any).__valley.select('garden'));
    const panel = page.locator('[data-panel="garden"]');
    await expect(panel).toBeVisible();
    return panel;
  };

  test('the Chinese garden filters by topic', async ({ page }) => {
    const panel = await open(page, '/zh/');
    await panel.locator('button[data-key="movies"]').click();
    const keys = await panel.locator('[data-keys]:visible').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.keys!));
    expect(keys.length).toBeGreaterThan(2);
    for (const k of keys) expect(k.split(' ')).toContain('movies');
  });

  test('the English garden lists translated posts and points to the rest', async ({ page }) => {
    const panel = await open(page);
    await expect(panel.locator('.zh-badge')).toHaveCount(0);
    await expect(panel.getByRole('link', { name: /More in Chinese/ })).toHaveAttribute('href', '/writing/#more-in-chinese');
    await expect(panel).toContainText('Woolf');
  });

  test('the glasshouse is now an opaque writing hut', async ({ page }) => {
    await open(page);
    const transparent = await page.evaluate(() => {
      const g = (window as any).__valley.scene.getObjectByName('garden');
      if (!g) return null;
      let n = 0;
      g.traverse((o: any) => { const m = o.material; if (m && (Array.isArray(m) ? m : [m]).some((x: any) => x.transparent)) n++; });
      return n;
    });
    expect(transparent).toBe(0);
  });
});
