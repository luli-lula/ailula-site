import { expect, test } from '@playwright/test';

const NOW_ZH = '一边做自己喜欢的产品，一边慢慢长向植物和生态。也欢迎聊产品相关的机会。';
const NOW_EN = 'Building products I care about, and slowly growing toward plants and ecology. Happy to talk about product roles.';

test('the lookout says what lula is doing now and leads to the projects', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('lookout'));
  const panel = page.locator('[data-panel="lookout"]');
  await expect(panel).toContainText(NOW_ZH);
  await panel.locator('[data-go="workshop"]').click();
  await expect(page.locator('[data-panel="workshop"]')).toBeVisible();
  await expect(panel).toBeHidden();
});

test('the Lo-Fi home has the same now line and a link to the projects', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
  await page.goto('/');
  await expect(page.locator('main')).toContainText(NOW_EN);
  await expect(page.locator('main a[href="/projects/"]').first()).toBeVisible();
});

test('the company name of her current work is not on the site', async ({ request }) => {
  for (const path of ['/', '/zh/', '/projects/', '/zh/projects/']) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toMatch(/[公司]|[company]/);
  }
});
