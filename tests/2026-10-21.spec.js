import { test, expect } from '@playwright/test';

const url = '/experiments/2026-10-21-afterlight/';
const pixels = (page) => page.locator('#light-field').evaluate((canvas) => canvas.toDataURL());

test('palette, detail and remix actually change the generated composition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  const before = await pixels(page);
  await page.getByRole('button', { name: 'Amber palette' }).click();
  await expect(page.getByRole('button', { name: 'Amber palette' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#palette-name')).toHaveText('Amber');
  expect(await pixels(page)).not.toEqual(before);
  const amber = await pixels(page);
  await page.locator('#density').focus();
  await page.locator('#density').press('Home');
  await expect(page.locator('#density-value')).toHaveText('80');
  expect(await pixels(page)).not.toEqual(amber);
  await page.locator('#energy').focus();
  await page.locator('#energy').press('End');
  await expect(page.locator('#energy-value')).toHaveText('100%');
  await page.getByRole('button', { name: 'Remix composition' }).hover();
  const oldComposition = await pixels(page);
  await page.getByRole('button', { name: 'Remix composition' }).click();
  expect(await pixels(page)).not.toEqual(oldComposition);
});

test('reduced motion starts paused and play/pause freezes the actual canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Resume animation' })).toHaveAttribute('aria-pressed', 'true');
  const staticFrame = await pixels(page);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await pixels(page)).toEqual(staticFrame);
  await page.getByRole('button', { name: 'Resume animation' }).click();
  await expect.poll(() => pixels(page)).not.toEqual(staticFrame);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  const pausedFrame = await pixels(page);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await pixels(page)).toEqual(pausedFrame);
});

test('the composition exports a real PNG and the home link works', async ({ page }) => {
  await page.goto(url);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Keep this feeling' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afterlight-sage.png');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBeGreaterThan(10000);
  await page.getByRole('link', { name: 'KAGUMI WORLD' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /What if/ })).toBeVisible();
});

test('pointer movement changes the field even when motion is paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  const before = await pixels(page);
  await page.mouse.move(180, 260);
  expect(await pixels(page)).not.toEqual(before);
});
