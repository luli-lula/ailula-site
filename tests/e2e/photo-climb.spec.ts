import { expect, test } from '@playwright/test';

test('photo climb renders with depth parallax and reaches the top', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/lab/photo-climb/');
  await expect(page.locator('.stage')).toHaveClass(/\bgl\b/, { timeout: 20_000 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByTestId('altitude')).toContainText('115m', { timeout: 10_000 });
  await expect(page.locator('[data-fade="now"]')).toHaveCSS('opacity', '1', { timeout: 10_000 });
  expect(errors).toEqual([]);
});
