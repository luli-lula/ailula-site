import { expect, test } from '@playwright/test';
import { clickPlace } from './helpers';

// Model real browsers: while a tab is hidden, animation frames are held and delivered on return.
const fakeTabVisibility = () => {
  const real = window.requestAnimationFrame.bind(window);
  const realCancel = window.cancelAnimationFrame.bind(window);
  const canceled = new Set<number>();
  const held: { id: number; cb: FrameRequestCallback }[] = [];
  let hidden = false;
  window.requestAnimationFrame = (cb) => {
    const id: number = real((ts) => {
      if (canceled.has(id)) return;
      if (hidden) held.push({ id, cb });
      else cb(ts);
    });
    return id;
  };
  window.cancelAnimationFrame = (id) => { canceled.add(id); realCancel(id); };
  const setHidden = (h: boolean) => {
    hidden = h;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
    if (!h) held.splice(0).forEach(({ id, cb }) => !canceled.has(id) && real(cb));
  };
  (window as any).__hide = () => setHidden(true);
  (window as any).__show = () => setHidden(false);
};

const framesPerSecond = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const v = (window as any).__valley;
    const a = v.frames();
    await new Promise((r) => setTimeout(r, 1000));
    return v.frames() - a;
  });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
});

test('switching tabs never multiplies the render loop', async ({ page }) => {
  await page.addInitScript(fakeTabVisibility);
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  const before = await framesPerSecond(page);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => (window as any).__hide());
    await page.waitForTimeout(150);
    await page.evaluate(() => (window as any).__show());
    await page.waitForTimeout(150);
  }
  const after = await framesPerSecond(page);
  // A doubled loop would give about 2×; 1.5× leaves room for a busy test machine.
  expect(after).toBeLessThanOrEqual(before * 1.5 + 2);
});

test('lo-fi pauses the valley; resizing meanwhile does not break it on return', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.locator('.valley-root').getByRole('button', { name: 'Lo-Fi' }).click();
  expect(await framesPerSecond(page)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 900, height: 700 });
  await page.locator('[data-mode-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'hifi');
  await page.waitForTimeout(400);
  expect(await page.locator('canvas.valley-canvas').evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(0);
  const box = await page.locator('.valley-label[data-zone="workshop"]').boundingBox();
  expect(box && box.width).toBeGreaterThan(0);
  expect(await framesPerSecond(page)).toBeGreaterThan(5);
});

test('flights curve around the sequoia instead of passing through its trunk', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.evaluate(() => (window as any).__valley.focus('lookout'));
  await page.waitForTimeout(2200);
  const samples: number[][] = await page.evaluate(async () => {
    const v = (window as any).__valley;
    v.focus('hollow');
    const out: number[][] = [];
    const end = performance.now() + 2200;
    while (performance.now() < end) {
      out.push(v.cameraPosition());
      await new Promise((r) => requestAnimationFrame(r));
    }
    return out;
  });
  const trunk = (y: number) => (2.75 - (y / 34) * 1.15 + 1.75 * Math.exp(-y / 2.6)) * 1.1;
  for (const [x, y, z] of samples) if (y < 34) expect(Math.hypot(x, z)).toBeGreaterThan(trunk(y));
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('the dog panel sits at the bottom and leaves the top bar usable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
    await page.evaluate(() => (window as any).__valley.select('dog'));
    const panel = page.locator('[data-panel="dog"]');
    await expect(panel).toBeVisible();
    const p = (await panel.boundingBox())!;
    const bar = (await page.locator('.valley-bar').boundingBox())!;
    expect(p.y).toBeGreaterThanOrEqual(bar.y + bar.height);
    expect(p.y + p.height).toBeLessThanOrEqual(812);
  });
});

test('keyboard: focus stays in the valley and moves into and out of panels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.valley-root'))).toBe(true);
  await clickPlace(page, 'workshop');
  await expect(page.locator('[data-panel="workshop"]')).toHaveAttribute('role', 'dialog');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[data-panel="workshop"]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-panel="workshop"]')).toBeHidden();
  expect(await page.evaluate(() => (document.activeElement as HTMLElement)?.dataset.zone)).toBe('workshop');
  await expect(page.locator('.valley-root [data-season-pick="winter"]')).toHaveAttribute('aria-pressed', /true|false/);
});

test('opening the sequoia reveals the years on its rings as the camera rises', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await expect(page.locator('.ring-tag.on')).toHaveCount(0);
  await page.evaluate(() => (window as any).__valley.select('tree'));
  // Still flying down to the roots: no years yet.
  await page.waitForTimeout(800);
  await expect(page.locator('.ring-tag.on')).toHaveCount(0);
  await expect(page.locator('.ring-tag.on').first()).toBeVisible({ timeout: 6000 });
  expect(await page.locator('.ring-tag.on').count()).toBeLessThan(9);
  await expect(page.locator('.ring-tag.on')).toHaveCount(9, { timeout: 12_000 });
  await expect(page.locator('.ring-tag').first()).toHaveText('2011');
  await page.keyboard.press('Escape');
  await expect(page.locator('.ring-tag.on')).toHaveCount(0);
});

test('the valley fades in once its first frame is drawn', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.valley-root')).toHaveClass(/\bready\b/, { timeout: 30_000 });
});

test('trunk rings stay hidden in the home view and fade in only for the tree story', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-night', '1'));
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as any).__valley.ringOpacity())).toBe(0);
  await page.evaluate(() => (window as any).__valley.select('tree'));
  await expect.poll(() => page.evaluate(() => (window as any).__valley.ringOpacity()), { timeout: 8000 }).toBeGreaterThan(0.3);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as any).__valley.ringOpacity()), { timeout: 5000 }).toBe(0);
});
