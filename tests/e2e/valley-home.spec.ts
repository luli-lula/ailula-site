import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
});

test('hi-fi home is the valley; a place opens a panel of real content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.valley-root')).toBeVisible();
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.mouse.move(300, 300);
  await page.locator('.valley-label[data-zone="workshop"]').click();
  const panel = page.locator('[data-panel="workshop"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('link', { name: /CELPIP12/ })).toHaveAttribute('href', '/projects/celpip12/');
  await panel.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-zone', '');
  expect(errors).toEqual([]);
});

test('season choice survives switching language', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.locator('.valley-root').getByRole('button', { name: 'Winter' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-season', 'winter');
  await page.locator('.valley-root').getByRole('link', { name: '中文' }).click();
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await expect(page.locator('html')).toHaveAttribute('data-season', 'winter');
  await expect(page.locator('.valley-label[data-zone="workshop"]')).toHaveText('工坊 · 项目');
});

test('the valley offers a way back to lo-fi', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-root')).toBeVisible();
  await page.locator('.valley-root').getByRole('button', { name: 'Lo-Fi' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'lofi');
  await expect(page.locator('.valley-root')).toBeHidden();
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('valley fits the screen and panels can be opened and closed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await page.mouse.move(100, 100);
    await page.locator('.valley-label[data-zone="garden"]').click();
    const panel = page.locator('[data-panel="garden"]');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    await panel.getByRole('button', { name: 'Close' }).click();
    await expect(panel).toBeHidden();
  });
});

test('the greenhouse gathers the plant work, Floradex first, with photos', async ({ page }) => {
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await expect(page.locator('.valley-label[data-zone="greenhouse"]')).toHaveText('温室 · 植物');
  await page.evaluate(() => (window as any).__valley.select('greenhouse'));
  const panel = page.locator('[data-panel="greenhouse"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.cards li').first()).toContainText('Floradex');
  await expect(panel.locator('.photos img')).not.toHaveCount(0);
  await expect(page.locator('[data-panel="workshop"] .cards')).not.toContainText('Floradex');
});
