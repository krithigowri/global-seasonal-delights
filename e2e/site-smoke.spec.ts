import { test, expect } from '@playwright/test';

test('home page loads and exposes primary navigation on desktop', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  // The site collapses its desktop navigation at mobile widths.
  // Keep the navigation assertion on desktop; mobile still verifies page load.
  if (testInfo.project.name === 'chromium-desktop') {
    const primaryNavigation = page.getByRole('navigation', { name: 'Primary' });
    await expect(primaryNavigation).toBeVisible();
    await expect(primaryNavigation.getByRole('link', { name: 'Recipes' }))
      .toHaveAttribute('href', 'browse.html');
  }
});

test('recipe browse page exposes search and filters', async ({ page }) => {
  await page.goto('/browse.html');
  await expect(page.getByRole('heading', { name: 'Browse recipes' })).toBeVisible();
  await expect(page.locator('#f-search')).toBeVisible();
  await expect(page.locator('#f-region')).toBeVisible();
  await expect(page.locator('#f-season')).toBeVisible();
  await expect(page.locator('#browse-grid')).toBeVisible();
});

test('festival collections page displays collection links', async ({ page }) => {
  await page.goto('/festivals.html');
  await expect(page.getByRole('heading', { name: 'Celebrate with food' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Diwali/ }).first())
    .toHaveAttribute('href', 'festival-diwali.html');
});
