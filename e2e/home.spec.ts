import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check if the page title contains the app name
    await expect(page).toHaveTitle(/GolfCompete/);
    
    // Check if the main heading is visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('should have navigation elements', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (isMobile) {
      // For mobile: First check if the menu button exists
      const menuButton = page.getByRole('button', { name: 'menu' });
      await expect(menuButton).toBeVisible();
      
      // Click the menu button to open the drawer
      await menuButton.click();
      
      // Wait for the menu to open
      await page.waitForTimeout(500);
      
      // Check if there's a link to the About page in the menu
      const aboutMenuItem = page.getByRole('menuitem').filter({ hasText: 'About' });
      await expect(aboutMenuItem).toBeVisible();
    } else {
      // For desktop: Check if there's a link to the About page in the header
      const aboutLink = page.locator('header a[href="/about"]').first();
      await expect(aboutLink).toBeVisible();
    }
  });

  test('should have a footer', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check if the footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check if the footer contains copyright information or the current year
    const currentYear = new Date().getFullYear().toString();
    await expect(footer).toContainText(currentYear);
  });
}); 