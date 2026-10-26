import { expect, type Page } from '@playwright/test';

// Click a place label the way a visitor does. Moving the pointer stops the idle rotation, but rotation
// resumes after 8 s without pointer movement; on a busy test machine Playwright can wait that long for the
// label to hold still. So each attempt moves the pointer first, then clicks.
export async function clickPlace(page: Page, zone: string, pointer: [number, number] = [300, 300]) {
  await expect(async () => {
    await page.mouse.move(...pointer);
    await page.locator(`.valley-label[data-zone="${zone}"]`).click({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
}
