import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  // WebGL scenes use software rendering in headless Chromium; too many at once starve each other.
  workers: 2,
  use: { baseURL: 'http://localhost:4322' },
  webServer: {
    command: 'npm run build && npx astro preview --port 4322 --ignore-lock',
    url: 'http://localhost:4322/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
