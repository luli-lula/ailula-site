import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
});

test('projects page lists the chosen projects in groups, plants first', async ({ page }) => {
  await page.goto('/projects/');
  const groups = page.locator('main section h2');
  await expect(groups.first()).toHaveText('Plants');
  const cards = page.locator('main .cards li');
  await expect(cards).toHaveCount(10);
  await expect(page.locator('main section').first().locator('.cards li').first()).toContainText('Floradex');
  await expect(page.getByText('Floating Thoughts')).toHaveCount(0);
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
