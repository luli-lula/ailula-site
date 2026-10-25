import { expect, test } from '@playwright/test';

test('climb v2 renders and reaches the canopy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/lab/climb-v2/');
  await expect(page.locator('canvas#scene')).toBeVisible();
  await expect(page.getByTestId('loading')).toHaveCount(0, { timeout: 90_000 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByTestId('altitude')).toContainText('115m', { timeout: 10_000 });
  await expect(page.getByTestId('ring-label')).toHaveText('2026');
  expect(errors).toEqual([]);
});
