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

test('browse search filters the recipe results and opens a recipe', async ({ page }) => {
  await page.goto('/browse.html');
  const search = page.locator('#f-search');
  await search.fill('Baingan Bharta');

  const cards = page.locator('#browse-grid .recipe-card');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().locator('h3')).toContainText('Baingan Bharta');
  await expect(page.locator('#result-count')).toContainText('recipe');

  // Dismiss the first-visit cookie dialog so it cannot cover the recipe card link.
  const cookieReject = page.locator('#cookie-reject');
  if (await cookieReject.isVisible()) await cookieReject.click();

  const recipeLink = cards.first().locator('a.card-hit');
  await expect(recipeLink).toHaveAttribute('href', /recipe-/);
  await recipeLink.click();
  await expect(page.locator('main h1')).toContainText('Baingan Bharta');
  await expect(page.getByRole('heading', { name: 'Method', exact: true })).toBeVisible();
});

test('mobile navigation opens and exposes the primary links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile-only navigation behavior');
  await page.goto('/');
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  await menuButton.click();
  const navigation = page.getByRole('navigation', { name: 'Primary' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Recipes' })).toBeVisible();
});
