import { expect, test, type Page } from '@playwright/test';

const openTree = async (page: Page, path = '/zh/') => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  await page.goto(path);
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('tree'));
  const panel = page.locator('[data-panel="tree"]');
  await expect(panel).toBeVisible();
  return panel;
};

test('the sequoia tells lula’s story by the places she lived, newest first, ending at the roots in Henan', async ({ page }) => {
  const panel = await openTree(page);
  const chapters = panel.locator('.chapter');
  expect(await chapters.count()).toBeGreaterThanOrEqual(6);
  await expect(chapters.first().locator('.years')).toHaveText(/^2024/);
  await expect(chapters.last()).toHaveAttribute('data-id', 'roots');
  await expect(chapters.last()).toContainText('河南');
  for (const c of await chapters.all()) {
    await expect(c.locator('.work')).toHaveCount(1);
    await expect(c.locator('.life')).toHaveCount(1);
  }
});

test('work and life can be read side by side or one at a time, never neither', async ({ page }) => {
  const panel = await openTree(page);
  const work = panel.locator('button[data-side="work"]'), life = panel.locator('button[data-side="life"]');
  await expect(work).toHaveAttribute('aria-pressed', 'true');
  await work.click();
  await expect(work).toHaveAttribute('aria-pressed', 'false');
  await expect(panel.locator('.chapter .work').first()).toBeHidden();
  await expect(panel.locator('.chapter[data-id="upstate-ny"] .life')).toBeVisible();
  await life.click();
  await expect(life).toHaveAttribute('aria-pressed', 'true');
});

test('Lo-Fi home shows the same chapters', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
  await page.goto('/');
  expect(await page.locator('main .chapter').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('main')).toContainText('Upstate New York');
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('work and life stack in one column', async ({ page }) => {
    const panel = await openTree(page);
    const c = panel.locator('.chapter[data-id="upstate-ny"]');
    const [w, l] = [await c.locator('.work').boundingBox(), await c.locator('.life').boundingBox()];
    expect(l!.y).toBeGreaterThan(w!.y + w!.height - 2);
    expect(await panel.evaluate((p) => p.scrollWidth <= p.clientWidth + 1)).toBe(true);
  });
});
