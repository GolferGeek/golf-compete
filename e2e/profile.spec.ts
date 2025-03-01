import { test, expect } from '@playwright/test';
import { TestUser } from './utils/test-user';

test.describe('Profile Management', () => {
  // Use the pre-created test user
  const testUser = new TestUser({
    email: 'testuser@test.com',
    password: 'test01!'
  });

  // Setup: Sign in before tests
  test.beforeEach(async ({ page }) => {
    await testUser.signIn(page);
  });

  test.skip('should allow editing a profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Get current values to restore later
    const originalFirstName = await page.getByLabel('First Name', { exact: true }).inputValue();
    const originalLastName = await page.getByLabel('Last Name', { exact: true }).inputValue();
    
    // Update profile with new values
    const newFirstName = `Test${Date.now()}`;
    const newLastName = `User${Date.now()}`;
    
    await page.getByLabel('First Name', { exact: true }).fill(newFirstName);
    await page.getByLabel('Last Name', { exact: true }).fill(newLastName);
    
    // Submit the form
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify the welcome message includes the updated name
    await expect(page.getByText(new RegExp(`Welcome.*${newFirstName}`, 'i'))).toBeVisible();
    
    // Navigate back to profile to verify changes persisted
    await page.goto('/profile');
    
    // Verify updated values
    await expect(page.getByLabel('First Name', { exact: true })).toHaveValue(newFirstName);
    await expect(page.getByLabel('Last Name', { exact: true })).toHaveValue(newLastName);
    
    // Restore original values
    await page.getByLabel('First Name', { exact: true }).fill(originalFirstName);
    await page.getByLabel('Last Name', { exact: true }).fill(originalLastName);
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  });

  test.skip('should allow updating handicap', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Get current handicap to restore later
    const originalHandicap = await page.getByLabel('Handicap', { exact: true }).inputValue();
    
    // Add handicap
    const handicap = '14.5';
    await page.getByLabel('Handicap', { exact: true }).fill(handicap);
    
    // Submit the form
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Navigate back to profile to verify changes persisted
    await page.goto('/profile');
    
    // Verify handicap value
    await expect(page.getByLabel('Handicap', { exact: true })).toHaveValue(handicap);
    
    // Restore original handicap
    await page.getByLabel('Handicap', { exact: true }).fill(originalHandicap || '');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  });

  test.skip('should allow toggling multiple club sets', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Get current state to restore later
    const isChecked = await page.getByLabel('I carry multiple sets of clubs', { exact: true }).isChecked();
    
    // Toggle multiple club sets
    if (isChecked) {
      await page.getByLabel('I carry multiple sets of clubs', { exact: true }).uncheck();
    } else {
      await page.getByLabel('I carry multiple sets of clubs', { exact: true }).check();
    }
    
    // Submit the form
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Navigate back to profile to verify changes persisted
    await page.goto('/profile');
    
    // Verify multiple club sets is toggled
    if (isChecked) {
      await expect(page.getByLabel('I carry multiple sets of clubs', { exact: true })).not.toBeChecked();
    } else {
      await expect(page.getByLabel('I carry multiple sets of clubs', { exact: true })).toBeChecked();
    }
    
    // Restore original state
    if (!isChecked) {
      await page.getByLabel('I carry multiple sets of clubs', { exact: true }).uncheck();
    } else {
      await page.getByLabel('I carry multiple sets of clubs', { exact: true }).check();
    }
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  });

  test.skip('should validate handicap format', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Get current handicap to restore later
    const originalHandicap = await page.getByLabel('Handicap', { exact: true }).inputValue();
    
    // Enter invalid handicap
    await page.getByLabel('Handicap', { exact: true }).fill('not-a-number');
    
    // Submit the form
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    
    // Verify error message
    await expect(page.getByText(/handicap must be a number|invalid handicap/i)).toBeVisible();
    
    // Verify we're still on the profile page
    await expect(page.url()).toContain('/profile');
    
    // Restore original handicap
    await page.getByLabel('Handicap', { exact: true }).fill(originalHandicap || '');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  });
}); 