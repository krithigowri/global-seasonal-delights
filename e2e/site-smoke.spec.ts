import { test, expect } from '@playwright/test';

test('home page loads and exposes primary navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Recipes' })).toHaveAttribute('href', 'browse.html');
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
  await expect(page.getByRole('link', { name: /Diwali/ }).first()).toHaveAttribute('href', 'festival-diwali.html');
});
