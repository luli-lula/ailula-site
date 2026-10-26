import { expect, test, type Page } from '@playwright/test';

const lofi = (page: Page) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));

test.describe('cinema page', () => {
  test.beforeEach(({ page }) => lofi(page));

  test('says how many films lula has logged, and groups them by year, newest first', async ({ page, request }) => {
    const rows = await (await request.get('/douban/movies.json')).json();
    await page.goto('/zh/cinema/');
    await expect(page.locator('[data-stats]')).toContainText(String(rows.length));
    const years = (await page.locator('.cin-year h3').allInnerTexts()).map(Number);
    expect(years.length).toBeGreaterThan(5);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
  });

  test('a tile opens a card with the date watched and the note', async ({ page }) => {
    await page.goto('/zh/cinema/');
    await page.locator('.tile[data-c="1"]').first().click();
    const card = page.locator('dialog[data-card]');
    await expect(card).toBeVisible();
    await expect(card).toContainText(/\d{4}-\d{2}-\d{2}/);
    await expect(card.locator('blockquote')).not.toBeEmpty();
    await expect(card.locator('a[href^="https://movie.douban.com/subject/"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
  });

  test('five-star filter keeps only five-star tiles', async ({ page }) => {
    await page.goto('/zh/cinema/');
    await page.locator('[data-cin-filter] button[data-f="five"]').click();
    const r = await page.locator('.tile:visible').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.r));
    expect(r.length).toBeGreaterThan(50);
    expect(new Set(r)).toEqual(new Set(['5']));
  });

  test('a cover that fails to load becomes a text tile', async ({ page, request }) => {
    const rows: { p?: number }[] = await (await request.get('/douban/movies.json')).json();
    const i = rows.findIndex((r) => r.p);
    expect(i).toBeGreaterThanOrEqual(0);
    await page.route('**/posters/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/zh/cinema/');
    const tile = page.locator(`.tile[data-i="${i}"]`);
    await tile.scrollIntoViewIfNeeded();
    await expect(tile.locator('.tile-text')).toBeVisible();
    await expect(tile.locator('img')).toHaveCount(0);
  });

  test('the books tab shows books with their authors', async ({ page }) => {
    await page.goto('/zh/cinema/');
    await page.getByRole('tab', { name: /书/ }).click();
    await expect(page.getByRole('tab', { name: /书/ })).toHaveAttribute('aria-selected', 'true');
    await page.locator('.tile').first().click();
    await expect(page.locator('dialog[data-card] a[href^="https://book.douban.com/subject/"]')).toBeVisible();
  });

  test('the English page says the titles and notes are in Chinese', async ({ page }) => {
    await page.goto('/cinema/');
    await expect(page.locator('main')).toContainText('Titles and notes are in Chinese');
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('no horizontal scroll', async ({ page }) => {
      await page.goto('/zh/cinema/');
      await expect(page.locator('.tile').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});

test.describe('the tree hollow in hi-fi', () => {
  test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi')));
  const enter = async (page: Page) => {
    await page.goto('/zh/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.evaluate(() => (window as any).__valley.select('hollow'));
    const overlay = page.locator('.cinema-overlay');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    return overlay;
  };

  test('opens a full-screen cinema, keeps focus inside, and Esc walks back out', async ({ page }) => {
    const overlay = await enter(page);
    const box = (await overlay.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(vp.height - 1);
    await expect(overlay.locator('.tile').first()).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest('.cinema-overlay'))).toBe(true);
    expect(await page.evaluate(() => (document.querySelector('.valley-labels') as HTMLElement).inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(page.locator('.valley-label[data-zone="hollow"]')).toBeFocused();
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the cinema appears without an animation', async ({ page }) => {
      const overlay = await enter(page);
      expect(await overlay.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    });
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('fits the screen', async ({ page }) => {
      await enter(page);
      expect(await page.evaluate(() => document.querySelector('.cinema-overlay')!.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});
