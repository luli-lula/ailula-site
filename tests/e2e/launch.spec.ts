import { expect, test } from '@playwright/test';

test('sitemap and robots exist; lab pages are hidden from search', async ({ request, page }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://ailula.top/sitemap-index.xml');
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sm = await request.get('/sitemap-0.xml');
  const xml = await sm.text();
  expect(xml).toContain('https://ailula.top/projects/floradex/');
  expect(xml).not.toContain('/lab/');
  await page.goto('/lab/valley/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('pages carry a social preview and a favicon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ailula.top/og.jpg');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /lula/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
});

test('unknown addresses get a friendly 404 with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res!.status()).toBe(404);
  await expect(page.getByRole('link', { name: /home|首页/i }).first()).toBeVisible();
});

test.describe('reduced motion in hi-fi', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no auto-rotation, no falling particles, instant camera moves', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.evaluate(() => (window as any).__valley.select('workshop'));
    await page.waitForTimeout(150);
    const target = await page.evaluate(() => (window as any).__valley.cameraTarget());
    expect(target[0]).toBeCloseTo(-16, 0);
  });
});

test.describe('small phone', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('visible place labels never overlap', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.waitForTimeout(800);
    const boxes = await page.$$eval('.valley-label', (els) =>
      els.filter((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').map((e) => e.getBoundingClientRect().toJSON()),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlap, `labels ${i} and ${j} overlap`).toBe(false);
      }
  });
});

test('an English page that only has the Chinese original points search engines at the original', async ({ page, request }) => {
  await page.goto('/writing/029-好的产品遍地都是/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ailula.top/zh/writing/029-%E5%A5%BD%E7%9A%84%E4%BA%A7%E5%93%81%E9%81%8D%E5%9C%B0%E9%83%BD%E6%98%AF/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  const xml = await (await request.get('/sitemap-0.xml')).text();
  expect(xml).not.toContain('https://ailula.top/writing/029-');
  expect(xml).toContain('https://ailula.top/zh/writing/029-');
});

test('old post images still load', async ({ page }) => {
  await page.goto('/zh/writing/032-拖延了一年时间项目花了5天上线了/');
  const imgs = page.locator('article img[src^="/images/"]');
  expect(await imgs.count()).toBeGreaterThan(0);
  for (const ok of await imgs.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0))) expect(ok).toBe(true);
});

test('visitors never see unfinished-content markers', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
  for (const path of ['/', '/zh/', '/projects/floradex/', '/zh/projects/toefl/', '/cinema/']) {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/待补充|TODO|To be added/);
  }
});

test.describe('phone 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('the cinema label stays visible and no label leaves the screen', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(900);
    await expect(page.locator('.valley-label[data-zone="hollow"]')).not.toHaveCSS('opacity', '0');
    const rects = await page.$$eval('.valley-label', (els) => els.filter((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').map((e) => e.getBoundingClientRect().toJSON()));
    for (const r of rects) { expect(r.left).toBeGreaterThanOrEqual(0); expect(r.right).toBeLessThanOrEqual(375); }
  });
});

test('place labels never cover the top bar or an open panel', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('ailula-mode', 'hifi'); localStorage.setItem('ailula-night', 'false'); });
  await page.goto('/zh/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('greenhouse'));
  await page.waitForTimeout(3500);
  const overlaps = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll<HTMLElement>('.valley-brand, .valley-controls, .vpanel:not([hidden])')].map((e) => e.getBoundingClientRect());
    return [...document.querySelectorAll<HTMLElement>('.valley-label')]
      .filter((e) => getComputedStyle(e).opacity !== '0' && e.getBoundingClientRect().width > 0)
      .filter((e) => { const r = e.getBoundingClientRect(); return boxes.some((b) => r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom); })
      .map((e) => e.dataset.zone);
  });
  expect(overlaps).toEqual([]);
});

test('lula’s answers show up: now, email, DouDou, and JustSay is off the site', async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
  await page.goto('/');
  await expect(page.locator('main').getByText('Building products I care about, and slowly growing toward plants and ecology. Happy to talk about product roles.')).toBeVisible();
  await expect(page.locator('main a[href="mailto:imluli.me@gmail.com"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'JustSay' })).toHaveCount(0);
  expect((await request.get('/projects/justsay/')).status()).toBe(404);
  const dog = page.locator('[data-panel="dog"]');
  await expect(dog).toContainText('This is DouDou, lula’s dog.');
  expect(await dog.locator('img').count()).toBe(2);
});

test('panel close is an icon button with a name for screen readers', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.select('garden'));
  const close = page.locator('[data-panel="garden"] [data-close]');
  await expect(close).toBeVisible();
  await expect(close).toHaveAccessibleName('Close');
  await expect(close).toHaveAttribute('title', 'Close');
  expect((await close.innerText()).trim()).toBe('');
  await expect(close.locator('svg')).toHaveCount(1);
  const box = (await close.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(32);
  expect(box.height).toBeGreaterThanOrEqual(32);
  await close.click();
  await expect(page.locator('[data-panel="garden"]')).toBeHidden();
});

test('no résumé or DouDou-diary markers, and the dog’s label is her name', async ({ page, request }) => {
  const html = await (await request.get('/zh/')).text();
  expect(html).not.toContain('data-todo="简历 PDF"');
  expect(html).not.toMatch(/data-todo="DouDou 日记/);
  await page.addInitScript(() => { localStorage.setItem('ailula-mode', 'hifi'); localStorage.setItem('ailula-night', '0'); });
  await page.goto('/');
  await expect(page.locator('.valley-label[data-zone="dog"]')).toHaveText('DouDou', { timeout: 30_000 });
});
