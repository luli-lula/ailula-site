import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });

test('without WebGL the page lands in lo-fi and offers no way into hi-fi', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-webgl', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'lofi');
  await expect(page.getByTestId('lofi-notice')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try Hi-Fi' })).toBeHidden();
  await expect(page.locator('[data-mode-toggle]')).toBeHidden();
});
