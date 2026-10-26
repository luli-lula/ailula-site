import { expect, test, type Page } from '@playwright/test';

type State = { state: string; position: [number, number, number] };
const state = (page: Page): Promise<State> => page.evaluate(() => (window as any).__valley.dogState());
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const open = async (page: Page, night: boolean) => {
  await page.addInitScript((n) => { localStorage.setItem('ailula-mode', 'hifi'); localStorage.setItem('ailula-night', n ? '1' : '0'); }, night);
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
};

test('by day DouDou walks the path', async ({ page }) => {
  await open(page, false);
  const seen = [];
  for (let i = 0; i < 6; i++) { seen.push((await state(page)).position); await page.waitForTimeout(500); }
  const moved = Math.max(...seen.map((p) => dist(p, seen[0])));
  expect(moved).toBeGreaterThan(0.3);
});

test('chosen, she stops and the camera finds her where she is', async ({ page }) => {
  await open(page, false);
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as any).__valley.select('dog'));
  await page.waitForTimeout(1900);
  const a = await state(page);
  await page.waitForTimeout(1000);
  const b = await state(page);
  expect(dist(a.position, b.position)).toBeLessThan(0.02);
  expect(b.state).toBe('sit');
  const target = await page.evaluate(() => (window as any).__valley.cameraTarget());
  expect(dist(target, b.position)).toBeLessThan(2);
});

test('her label follows her', async ({ page }) => {
  await open(page, false);
  const label = page.locator('.valley-label[data-zone="dog"]');
  const pos = async () => { const s = await state(page); return s.position; };
  const anchor = async () => page.evaluate(() => (window as any).__valley.labelAnchor('dog'));
  await page.waitForTimeout(800);
  const [p, a] = [await pos(), await anchor()];
  expect(dist(p, a)).toBeLessThan(0.2);
  await expect(label).toBeAttached();
});

test('at night she sleeps by the lantern', async ({ page }) => {
  await open(page, true);
  const a = await state(page);
  await page.waitForTimeout(1200);
  const b = await state(page);
  expect(b.state).toBe('sleep');
  expect(dist(a.position, b.position)).toBeLessThan(0.01);
  await expect(page.locator('.valley-label[data-zone="dog"]')).toContainText('zzz');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('she lies still', async ({ page }) => {
    await open(page, false);
    const a = await state(page);
    await page.waitForTimeout(1500);
    const b = await state(page);
    expect(dist(a.position, b.position)).toBeLessThan(0.01);
    expect(b.state).toBe('lie');
  });
});
