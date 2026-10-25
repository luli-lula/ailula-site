import { expect, test } from '@playwright/test';

test('an old percent-encoded Chinese post URL lands on the new page', async ({ page }) => {
  await page.goto('/zh/posts/029-%E5%A5%BD%E7%9A%84%E4%BA%A7%E5%93%81%E9%81%8D%E5%9C%B0%E9%83%BD%E6%98%AF/');
  await expect(page).toHaveURL(/\/zh\/writing\/029-/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('好的产品遍地都是');
});

test('old movies page lands on the cinema', async ({ page }) => {
  await page.goto('/movies/');
  await expect(page).toHaveURL(/\/cinema\/$/);
});

test('RSS feeds keep working at the old addresses', async ({ request }) => {
  for (const path of ['/index.xml', '/zh/index.xml']) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<item>');
  }
});
