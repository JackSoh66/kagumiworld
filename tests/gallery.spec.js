import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const entries = JSON.parse(await readFile(new URL('../data/experiments.json', import.meta.url), 'utf8'));

test('collection lists real work and supports category and text filtering', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /What if/ })).toBeVisible();
  await expect(page.locator('.experiment-card')).toHaveCount(entries.length);
  await page.getByRole('button', { name: 'Little systems' }).click();
  await expect(page.locator('.experiment-card')).toHaveCount(entries.filter((item) => item.category === 'System').length);
  await page.getByRole('button', { name: /Everything/ }).click();
  await page.getByRole('searchbox').fill('no-such-experiment-000');
  await expect(page.getByText('No experiments here just yet.', { exact: false })).toBeVisible();
  await page.getByRole('searchbox').fill('Afterlight');
  await expect(page.locator('.experiment-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Explore Afterlight' }).click();
  await expect(page).toHaveURL(/experiments\/2026-10-21-afterlight\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('gallery is responsive, uses local assets, and has no runtime errors', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const failures = [];
  page.on('requestfailed', (request) => failures.push(request.url()));
  await page.goto('/');
  await page.locator('.card-visual img').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('.card-visual img').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('gallery.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});

for (const entry of entries) {
  test(`archive: ${entry.slug} loads without errors and stays within the viewport`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`/${entry.path}`);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${entry.slug}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
