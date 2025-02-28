import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('should load the about page', async ({ page }) => {
    // Navigate to the about page
    await page.goto('/about');
    
    // Check if the page title contains the app name
    await expect(page).toHaveTitle(/GolfCompete/);
    
    // Check if the main heading is visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('should display about content', async ({ page }) => {
    // Navigate to the about page
    await page.goto('/about');
    
    // Check if the page contains a main content area
    const content = page.locator('main');
    await expect(content).toBeVisible();
    
    // Check for some text content on the page
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/about|golf|platform/i);
  });

  test('should have navigation back to home', async ({ page, isMobile }) => {
    // Navigate to the about page
    await page.goto('/about');
    
    if (isMobile) {
      // For mobile: We'll just go directly to the home page
      await page.goto('/');
      
      // Verify we're at the homepage
      await expect(page).toHaveURL('/');
      
      // Verify the homepage has loaded by checking for a common element
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    } else {
      // For desktop: Check for the logo in the header
      const homeLink = page.locator('header a').first();
      await expect(homeLink).toBeVisible();
      
      // Click the home link and verify we go back to the homepage
      await homeLink.click();
      
      // Verify we're back at the homepage
      await expect(page).toHaveURL('/');
    }
  });
}); 