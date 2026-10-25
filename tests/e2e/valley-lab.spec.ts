import { expect, test } from '@playwright/test';

test('valley lab renders six places and flies to the one clicked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/lab/valley/');
  await expect(page.locator('canvas#valley')).toBeVisible();
  await expect(page.locator('.valley-label')).toHaveCount(7);
  await page.mouse.move(200, 200); // a visitor moving the pointer stops the idle rotation
  await page.locator('.valley-label[data-zone="workshop"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-zone', 'workshop');
  // Rapid selections must not stack flights: the camera ends on the last place chosen.
  await page.evaluate(() => { const v = (window as any).__valley; v.focus('garden'); v.focus('lookout'); });
  await expect(page.locator('html')).toHaveAttribute('data-zone', 'lookout');
  await page.waitForTimeout(2200);
  const target = await page.evaluate(() => (window as any).__valley.cameraTarget());
  expect(target[0]).toBeCloseTo(10, 0);
  expect(target[2]).toBeCloseTo(-19, 0);
  expect(await page.evaluate(() => (window as any).__valley.drawCalls())).toBeLessThanOrEqual(120);
  await page.getByRole('button', { name: 'Winter' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-season', 'winter');
  expect(errors).toEqual([]);
});
