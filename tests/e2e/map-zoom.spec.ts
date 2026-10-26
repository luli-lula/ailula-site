import { expect, test, type Page } from '@playwright/test';

const vb = (page: Page, view = 'world') => page.locator(`[data-map-view="${view}"]`).evaluate((el) => el.getAttribute('viewBox')!.split(' ').map(Number));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
  await page.goto('/zh/map/');
  await expect(page.locator('[data-map-view="world"] .base path').first()).toBeAttached({ timeout: 10_000 });
});

test('zoom buttons zoom in, out, and back to the whole map', async ({ page }) => {
  const [, , w0] = await vb(page);
  await page.locator('[data-zoom="in"]').click();
  const [, , w1] = await vb(page);
  expect(w1).toBeLessThan(w0 * 0.8);
  await page.locator('[data-zoom="out"]').click();
  expect((await vb(page))[2]).toBeGreaterThan(w1);
  await page.locator('[data-zoom="in"]').click();
  await page.locator('[data-zoom="reset"]').click();
  expect((await vb(page))[2]).toBeCloseTo(w0, 0);
  await expect(page.locator('[data-zoom="in"]')).toHaveAttribute('aria-label', '放大');
});

test('the wheel zooms where the pointer is, and dragging pans', async ({ page }) => {
  const box = (await page.locator('[data-map-view="world"]').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(100);
  const [x1, , w1] = await vb(page);
  expect(w1).toBeLessThan(960 * 0.7);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 5 });
  await page.mouse.up();
  const [x2] = await vb(page);
  expect(x2).toBeLessThan(x1);
});

test('lines stay thin when zoomed', async ({ page }) => {
  const effect = await page.locator('[data-map-view="world"] .base path').first().evaluate((el) => getComputedStyle(el).vectorEffect);
  expect(effect).toBe('non-scaling-stroke');
  expect(await page.locator('[data-map-view="world"] .lit').first().evaluate((el) => getComputedStyle(el).vectorEffect)).toBe('non-scaling-stroke');
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });
  test('the map fits the screen and can still zoom', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const w = (await page.locator('[data-map-view="world"]').boundingBox())!.width;
    expect(w).toBeLessThanOrEqual(375);
    await page.locator('[data-zoom="in"]').tap();
    expect((await vb(page))[2]).toBeLessThan(960 * 0.8);
  });
});
