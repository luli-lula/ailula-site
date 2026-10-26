import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'hifi'));
  await page.goto('/');
  await expect(page.locator('.valley-label')).toHaveCount(7, { timeout: 30_000 });
};

test('a visible creek runs to the island edge, with a bridge where a path crosses it', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const scene = (window as any).__valley.scene;
    const creek = scene.getObjectByName('creek');
    if (!creek) return null;
    creek.geometry.computeBoundingBox();
    const b = creek.geometry.boundingBox;
    const reach = Math.max(...[b.min, b.max].flatMap((v: any) => [Math.hypot(v.x, v.z)]));
    let bridges = 0;
    scene.traverse((o: any) => { if (o.name === 'bridge') bridges++; });
    return { reach, bridges, banks: !!scene.getObjectByName('creek-banks') };
  });
  expect(r).not.toBeNull();
  expect(r!.reach).toBeGreaterThan(30);
  expect(r!.bridges).toBeGreaterThanOrEqual(1);
  expect(r!.banks).toBe(true);
});

test('the garden grows different crops in each season', async ({ page }) => {
  await open(page);
  for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    const r = await page.evaluate((s) => {
      const v = (window as any).__valley;
      v.setSeason(s);
      const seasons = ['spring', 'summer', 'autumn', 'winter'].map((x) => [x, v.scene.getObjectByName(`crops-${x}`)?.visible ?? null]);
      const g = v.scene.getObjectByName(`crops-${s}`);
      const colours = new Set<string>();
      g?.traverse((o: any) => o.material && colours.add(o.material.color.getHexString()));
      return { seasons, colours: colours.size };
    }, season);
    for (const [s, visible] of r.seasons) expect(visible, `${season}: crops-${s}`).toBe(s === season);
    expect(r.colours, `${season} colours`).toBeGreaterThanOrEqual(season === 'winter' ? 2 : 4);
  }
});

test('the creek glints, and the whole valley stays within its draw-call budget', async ({ page }) => {
  await open(page);
  const a = await page.evaluate(() => (window as any).__valley.scene.getObjectByName('creek-glints').material.opacity);
  await page.waitForTimeout(700);
  const b = await page.evaluate(() => (window as any).__valley.scene.getObjectByName('creek-glints').material.opacity);
  expect(a).not.toBeCloseTo(b, 3);
  expect(await page.evaluate(() => (window as any).__valley.drawCalls())).toBeLessThanOrEqual(120);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the creek holds still', async ({ page }) => {
    await open(page);
    const a = await page.evaluate(() => (window as any).__valley.scene.getObjectByName('creek-glints').material.opacity);
    await page.waitForTimeout(700);
    const b = await page.evaluate(() => (window as any).__valley.scene.getObjectByName('creek-glints').material.opacity);
    expect(a).toBe(b);
  });
});
