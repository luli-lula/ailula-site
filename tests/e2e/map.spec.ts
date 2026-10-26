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

  test('shows lived places as a route and visited places as points, in three views', async ({ page }) => {
    await page.goto('/zh/map/');
    await expect(page.locator('[data-view-pick="world"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('[data-map-view="world"] .lived').count()).toBeGreaterThanOrEqual(4);
    expect(await page.locator('[data-map-view="world"] .visited').count()).toBeGreaterThanOrEqual(2);
    await page.locator('[data-view-pick="cn"]').click();
    await expect(page.locator('[data-map-view="cn"]')).toBeVisible();
    await expect(page.locator('[data-map-view="world"]')).toBeHidden();
  });

  test('the Xinjiang point opens a card that leads to the travel note', async ({ page }) => {
    await page.goto('/zh/map/');
    await page.locator('[data-map-view="world"] [data-point="xinjiang"]').click();
    const card = page.locator('[data-map-card]');
    await expect(card).toBeVisible();
    await expect(card.locator('a[href^="/zh/writing/014-"]')).toBeVisible();
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('no horizontal scroll', async ({ page }) => {
      await page.goto('/map/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
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
  const box = (await overlay.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(open).toBeFocused();
});
