import { expect, test, type Page } from '@playwright/test';

const hifi = (page: Page) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
const lofi = (page: Page) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));

test('the tree panel has a route map of the places lula lived; a dot leads to its chapter', async ({ page }) => {
  await hifi(page);
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('tree'));
  const panel = page.locator('[data-panel="tree"]');
  const dots = panel.locator('.route-map [data-chapter]');
  expect(await dots.count()).toBeGreaterThanOrEqual(4);
  await panel.locator('.chapter[data-id="roots"]').evaluate((el) => el.closest('.vbody')!.scrollTo(0, 0));
  await dots.and(page.locator('[data-chapter="roots"]')).click();
  await page.waitForTimeout(600);
  const inView = await panel.locator('.chapter[data-id="roots"]').evaluate((el) => {
    const r = el.getBoundingClientRect(), b = el.closest('.vbody')!.getBoundingClientRect();
    return r.top >= b.top - 2 && r.top < b.bottom;
  });
  expect(inView).toBe(true);
});

test.describe('footprint map page', () => {
  test.beforeEach(({ page }) => lofi(page));

  test('a dark map lights the cities lula has been to, with no route lines', async ({ page }) => {
    await page.goto('/zh/map/');
    const bg = await page.locator('.fmap-view').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = (bg.match(/\d+/g) ?? []).map(Number);
    expect(r + g + b).toBeLessThan(120);
    await expect(page.locator('.fmap .route')).toHaveCount(0);
    for (const name of ['广州市', '北京市']) await expect(page.locator(`[data-map-view="cn"] .lit[data-name="${name}"]`)).toHaveCount(1);
    await expect(page.locator('[data-map-view="us"] .lit[data-name="Albany"]')).toHaveCount(1);
  });

  test('switches views and names a lit place on hover', async ({ page }) => {
    await page.goto('/zh/map/');
    await expect(page.locator('[data-view-pick="world"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-view-pick="cn"]').click();
    await expect(page.locator('[data-map-view="cn"]')).toBeVisible();
    await expect(page.locator('[data-map-view="world"]')).toBeHidden();
    await page.locator('[data-map-view="cn"] .lit[data-name="广州市"]').hover();
    await expect(page.locator('[data-map-tip]')).toContainText('广州市');
  });

  test('shows a few numbers about where lula has been', async ({ page }) => {
    await page.goto('/zh/map/');
    const stats = page.locator('.fmap-stats');
    await expect(stats).toContainText('国家和地区');
    await expect(stats).toContainText('/ 361');
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('no horizontal scroll', async ({ page }) => {
      await page.goto('/map/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});

test('the footprint editor exists only on lula’s machine', async ({ page, request }) => {
  await page.goto('/map/edit/');
  await expect(page.locator('body')).toContainText('只在本地开发时可用');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await (await request.get('/sitemap-0.xml')).text()).not.toContain('/map/edit/');
});

test('the home page does not carry the footprint map', async ({ request }) => {
  expect(await (await request.get('/zh/')).text()).not.toContain('data-place=');
});

test('the lookout opens the footprint map full screen; Esc closes it', async ({ page }) => {
  await hifi(page);
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('lookout'));
  const open = page.locator('[data-panel="lookout"] [data-open-map]');
  await open.click();
  const overlay = page.locator('.map-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('.lit').first()).toBeAttached({ timeout: 10_000 });
  const box = (await overlay.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(open).toBeFocused();
});
