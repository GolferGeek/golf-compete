import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Navigate to the homepage
    await page.goto('/');
    
    // Check if the mobile menu button is visible (hamburger icon or similar)
    const mobileMenuButton = page.locator('header button').first();
    await expect(mobileMenuButton).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'e2e-results/mobile-home.png' });
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    
    // Navigate to the homepage
    await page.goto('/');
    
    // Check if the layout adapts to tablet size
    const content = page.locator('main');
    await expect(content).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'e2e-results/tablet-home.png' });
  });

  test('should adapt to desktop viewport', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Navigate to the homepage
    await page.goto('/');
    
    // Check if the desktop navigation is visible
    const desktopNav = page.locator('header');
    await expect(desktopNav).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'e2e-results/desktop-home.png' });
  });
}); 