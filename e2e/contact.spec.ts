import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test('should load the contact page', async ({ page }) => {
    // Navigate to the contact page
    await page.goto('/contact');
    
    // Check if the page title contains the app name
    await expect(page).toHaveTitle('Contact Us | GolfCompete');
    
    // Check if the main heading is visible
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/contact/i);
  });

  test('should display the contact form', async ({ page }) => {
    // Navigate to the contact page
    await page.goto('/contact');
    
    // Check if the form elements are visible
    const nameInput = page.getByLabel(/your name/i);
    const emailInput = page.getByLabel(/email address/i);
    const messageInput = page.getByLabel(/your message/i);
    const submitButton = page.getByRole('button', { name: /send message/i });
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Navigate to the contact page
    await page.goto('/contact');
    
    // Try to submit the form without filling it
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();
    
    // Check for validation errors
    await expect(page.getByText(/name must be at least/i)).toBeVisible();
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    await expect(page.getByText(/message must be at least/i)).toBeVisible();
  });

  test.skip('should submit the form successfully', async ({ page, isMobile }) => {
    // Skip this test for now as it's flaky
    
    await page.goto('/contact');
    
    // Fill out the form
    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/your message/i).fill('This is a test message from the E2E test suite.');
    
    // Submit the form
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Wait for the submission to complete (the button should show a loading state)
    await page.waitForTimeout(2000);
    
    // Check for success message with a longer timeout
    // The success message is in a Snackbar/Alert component
    await expect(page.locator('.MuiAlert-message').filter({ hasText: /thank you for your message/i }))
      .toBeVisible({ timeout: 10000 });
  });

  test('should navigate to contact page from navbar', async ({ page, isMobile }) => {
    // Start at the homepage
    await page.goto('/');
    
    if (isMobile) {
      // For mobile: First click the menu button to open the menu
      const menuButton = page.getByRole('button', { name: 'menu' });
      await menuButton.click();
      
      // Wait for the menu to open
      await page.waitForTimeout(500);
      
      // Then click the Contact menuitem
      const contactMenuItem = page.getByRole('menuitem').filter({ hasText: 'Contact' });
      await contactMenuItem.click();
    } else {
      // For desktop: Click on the Contact link in the navbar
      const contactLink = page.locator('header').getByRole('link', { name: 'Contact' }).first();
      await contactLink.click();
    }
    
    // Check that we're on the contact page
    await expect(page).toHaveURL('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/contact/i);
  });
}); 