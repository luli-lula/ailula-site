import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
});

test('projects page lists the chosen projects in groups, plants first', async ({ page }) => {
  await page.goto('/projects/');
  const groups = page.locator('main section h2');
  await expect(groups.first()).toHaveText('Plants');
  const cards = page.locator('main .pcard');
  await expect(cards).toHaveCount(9);
  await expect(page.locator('main section').first().locator('.pcard').first()).toContainText('Floradex');
  await expect(page.getByText('Floating Thoughts')).toHaveCount(0);
  await expect(page.getByText('JustSay')).toHaveCount(0);
});

test('a live project shows its screenshot and a link to the live site', async ({ page }) => {
  await page.goto('/projects/toefl/');
  await expect(page.locator('main img.shot')).toHaveAttribute('src', /\/assets\/projects\/toefl\.webp$/);
  await expect(page.getByRole('link', { name: /toefl\.ailula\.top/ })).toHaveAttribute('href', 'https://toefl.ailula.top/');
});

test('Floradex is shown as in progress, not released', async ({ page }) => {
  await page.goto('/zh/projects/floradex/');
  await expect(page.locator('main')).toContainText('进行中');
  await expect(page.locator('main')).not.toContainText('App Store 下载');
});

test('every project card has a picture or a cover, never a broken image', async ({ page }) => {
  await page.goto('/projects/');
  const cards = await page.$$eval('main .pcard', (els) => els.map((el) => {
    const img = el.querySelector('img');
    return { cover: !!el.querySelector('.pcover'), ok: img ? img.complete && img.naturalWidth > 0 : false };
  }));
  expect(cards).toHaveLength(9);
  for (const c of cards) expect(c.cover || c.ok).toBe(true);
});

test('project names are names, not sentences', async ({ page }) => {
  await page.goto('/projects/');
  const titles = await page.locator('main .pcard .ptitle').allInnerTexts();
  expect(titles).toHaveLength(9);
  for (const t of titles) {
    expect(t).not.toMatch(/ [–-] /);
    expect(t.length).toBeLessThanOrEqual(30);
  }
});

test.describe('workshop in hi-fi', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  });
  const open = async (page: import('@playwright/test').Page) => {
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.evaluate(() => (window as any).__valley.select('workshop'));
    const panel = page.locator('[data-panel="workshop"]');
    await expect(panel).toBeVisible();
    return panel;
  };

  test('shows every project, Floradex first and large', async ({ page }) => {
    const panel = await open(page);
    await expect(panel.locator('.pcard')).toHaveCount(9);
    await expect(panel.locator('.pcard').first()).toHaveClass(/large/);
    await expect(panel.locator('.pcard').first()).toContainText('Floradex');
    expect((await panel.boundingBox())!.width).toBeGreaterThan(560);
  });

  test('category chips filter the cards', async ({ page }) => {
    const panel = await open(page);
    await panel.locator('button[data-cat="plants"]').click();
    await expect(panel.locator('button[data-cat="plants"]')).toHaveAttribute('aria-pressed', 'true');
    const visible = panel.locator('.pcard:visible');
    await expect(visible).toHaveCount(4);
    for (const c of await visible.all()) await expect(c).toHaveAttribute('data-category', 'plants');
    await panel.locator('button[data-cat="all"]').click();
    await expect(panel.locator('.pcard:visible')).toHaveCount(9);
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('fits the screen', async ({ page }) => {
      const panel = await open(page);
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});
