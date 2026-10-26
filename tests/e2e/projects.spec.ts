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

test.describe('project page framework', () => {
  test('the native plant care signs case study leads with its numbers and keeps the section order', async ({ page }) => {
    await page.goto('/zh/projects/plant-care-signs/');
    await expect(page.locator('main h1')).toHaveText('本土植物养护卡片');
    await expect(page.locator('main .facts')).toContainText('151');
    const order = ['为什么做', '我做了什么', '怎么做的', '结果', '学到了什么', '下一步'];
    const h2s = (await page.locator('main article h2').allInnerTexts()).map((t) => t.trim()).filter((t) => order.includes(t));
    expect(h2s.length).toBeGreaterThanOrEqual(4);
    expect(h2s).toEqual(order.filter((o) => h2s.includes(o)));
    await expect(page.locator('main .gallery img').first()).toBeVisible();
  });

  test('English case study has the same frame', async ({ page }) => {
    await page.goto('/projects/plant-care-signs/');
    await expect(page.locator('main h1')).toHaveText('Native Plant Care Signs');
    await expect(page.locator('main .facts')).toContainText('151');
    await expect(page.locator('main article h2').first()).toHaveText('Why');
  });

  test('the live-site link carries an external-link icon and its address', async ({ page }) => {
    await page.goto('/projects/plant-care-signs/');
    const link = page.locator('main a.visit');
    await expect(link).toHaveAttribute('href', 'https://ailula.top/plant-care-signs/');
    await expect(link.locator('svg')).toHaveCount(1);
    await expect(link).toContainText('ailula.top/plant-care-signs');
  });

  test('a draft project has no page', async ({ request }) => {
    expect((await request.get('/projects/research-workbench/')).status()).toBe(404);
  });
});
