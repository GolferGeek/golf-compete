import { test, expect } from '@playwright/test';

test('Can connect to development server', async ({ page }) => {
  console.log('Starting connection test...');
  
  // Navigate to the home page
  console.log('Navigating to home page...');
  await page.goto('/');
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Verify we're on the home page
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'connection-test.png' });
  
  // Simple assertion to verify the page loaded
  await expect(page).toHaveURL(/.*localhost:3000.*/);
}); 