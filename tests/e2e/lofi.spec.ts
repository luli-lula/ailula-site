import { expect, test } from '@playwright/test';

test('a Chinese-only post on the English site shows the original with a label', async ({ page }) => {
  await page.goto('/writing/029-好的产品遍地都是/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('好的产品遍地都是');
  await expect(page.getByText('Chinese only')).toBeVisible();
});

test('the language toggle switches to the Chinese page', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('link', { name: '中文' }).click();
  await expect(page).toHaveURL(/\/zh\/projects\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('lands in lo-fi with a notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'lofi');
    await expect(page.getByTestId('lofi-notice')).toBeVisible();
    await page.getByRole('button', { name: 'Try Hi-Fi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'hifi');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'hifi');
  });
});

test('home shows who lula is and the plain-text essentials', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('lula');
  await expect(page.locator('.hero').getByText('Growing slowly, like a redwood.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'CELPIP12' }).first()).toBeVisible();
  // Unfinished content is still marked in the built page (for scripts/content-todo.mjs) but never shown.
  expect(await page.locator('[data-todo]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-todo]').first()).toBeHidden();
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  for (const path of ['/', '/writing/', '/projects/', '/zh/', '/cinema/', '/writing/029-好的产品遍地都是/']) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(375);
    });
  }
});

