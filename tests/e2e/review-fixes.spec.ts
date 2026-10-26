import { expect, test, type Page } from '@playwright/test';

const lofi = (page: Page) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));

test('switching Films/Books quickly never leaves books on the Films tab', async ({ page, request }) => {
  const films: { t: string }[] = await (await request.get('/douban/movies.json')).json();
  await lofi(page);
  await page.route('**/douban/books.json', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  await page.goto('/zh/cinema/');
  await expect(page.locator('.tile').first()).toBeVisible();
  await page.getByRole('tab', { name: /书/ }).click();
  await page.getByRole('tab', { name: /电影/ }).click();
  await page.waitForTimeout(2200);
  await expect(page.locator('[data-stats]')).toContainText(`${films.length} 部电影`);
  await expect(page.locator('.tile').first()).toHaveAttribute('title', films[0].t);
});

test('the year index moves keyboard focus to that year', async ({ page }) => {
  await lofi(page);
  await page.goto('/zh/cinema/');
  const btn = page.locator('[data-years] button[data-year="2015"]');
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cin-year[data-year="2015"] h3')).toBeFocused();
});

test('the cinema filters stay in view while the wall scrolls', async ({ page }) => {
  await lofi(page);
  await page.goto('/zh/cinema/');
  await expect(page.locator('.tile').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 4000));
  await page.waitForTimeout(200);
  const top = await page.locator('.cin-tools').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(120);
});

test('Esc in the cinema search clears the field without closing the cinema', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('hollow'));
  const overlay = page.locator('.cinema-overlay');
  await expect(overlay).toBeVisible({ timeout: 5_000 });
  await overlay.locator('[data-cin-search]').fill('海');
  await overlay.locator('[data-cin-search]').press('Escape');
  await page.waitForTimeout(300);
  await expect(overlay).toBeVisible();
});

test('Lo-Fi visitors can reach the footprint map', async ({ page }) => {
  await lofi(page);
  await page.goto('/zh/');
  await expect(page.locator('main a[href="/zh/map/"]').first()).toBeVisible();
});

test('the English feed lists only posts readable in English', async ({ request }) => {
  const xml = await (await request.get('/index.xml')).text();
  const titles = [...xml.matchAll(/<item><title>([^<]*)<\/title>/g)].map((m) => m[1]);
  expect(titles.length).toBeGreaterThanOrEqual(10);
  for (const t of titles) expect(t, t).not.toMatch(/[一-鿿]/);
});

test('the map credits the data it uses', async ({ page }) => {
  await lofi(page);
  await page.goto('/map/');
  for (const source of ['Natural Earth', 'OCHA', 'Census']) await expect(page.locator('.fmap-credit')).toContainText(source);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the route map stacks its two maps and its dots are big enough to tap', async ({ page }) => {
    await lofi(page);
    await page.goto('/zh/');
    const insets = page.locator('main .route-map .inset');
    const [a, b] = [await insets.nth(0).boundingBox(), await insets.nth(1).boundingBox()];
    expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height - 1);
    expect((await page.locator('main .route-map [data-chapter="beijing"] circle').boundingBox())!.width).toBeGreaterThanOrEqual(14);
  });

  test('the footprint map keeps a usable size and scrolls inside itself', async ({ page }) => {
    await lofi(page);
    await page.goto('/zh/map/');
    expect((await page.locator('[data-map-view="world"]').boundingBox())!.width).toBeGreaterThanOrEqual(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
