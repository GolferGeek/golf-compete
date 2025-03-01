import { Page, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * TestUser class for managing test user lifecycle
 * This uses real interactions with the application - no mocking
 */
export class TestUser {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly username: string;
  
  constructor(options: { prefix?: string, email?: string, password?: string, firstName?: string, lastName?: string, username?: string } = {}) {
    // Generate unique identifiers for this test user
    const uniqueId = uuidv4().substring(0, 8);
    const prefix = options.prefix || 'test';
    
    // Use provided credentials or generate new ones
    this.email = options.email || `${prefix}-user-${uniqueId}@golfcompete-test.com`;
    this.password = options.password || `TestPass${uniqueId}!`;
    this.firstName = options.firstName || `Test${uniqueId}`;
    this.lastName = options.lastName || `User${uniqueId}`;
    this.username = options.username || `test_user_${uniqueId}`;
  }

  /**
   * Sign up a new test user
   */
  async signUp(page: Page): Promise<void> {
    // Navigate to signup page
    await page.goto('/auth/signup');
    
    // Fill out the signup form
    await page.getByLabel('Email Address').fill(this.email);
    // Use ID selector for password fields to avoid ambiguity
    await page.locator('#password').fill(this.password);
    await page.locator('#confirmPassword').fill(this.password);
    
    // Submit the form - use type="submit" to be more specific
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to profile setup page
    await page.waitForURL('/profile');
    
    // Verify we're on the profile page
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  }

  /**
   * Complete the user profile setup
   */
  async setupProfile(page: Page, options?: { handicap?: number, multipleClubsSets?: boolean }): Promise<void> {
    // Ensure we're on the profile page
    if (!page.url().includes('/profile')) {
      await page.goto('/profile');
    }
    
    // Fill out profile form
    await page.getByLabel('First Name').fill(this.firstName);
    await page.getByLabel('Last Name').fill(this.lastName);
    await page.getByLabel('Username').fill(this.username);
    
    if (options?.handicap !== undefined) {
      await page.getByLabel('Handicap').fill(options.handicap.toString());
    }
    
    if (options?.multipleClubsSets) {
      await page.getByLabel('I carry multiple sets of clubs').check();
    }
    
    // Submit the form - use type="submit" to be more specific
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  }

  /**
   * Sign in with the test user credentials
   */
  async signIn(page: Page): Promise<void> {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Fill out login form
    await page.getByLabel('Email Address').fill(this.email);
    // Use ID selector for password field
    await page.locator('#password').fill(this.password);
    
    // Submit the form - use type="submit" to be more specific
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  }

  /**
   * Sign out the current user
   */
  async signOut(page: Page): Promise<void> {
    // Click on the user menu
    await page.getByRole('button', { name: 'Account' }).click();
    
    // Click the sign out option
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Wait for redirect to home page
    await page.waitForURL('/');
    
    // Verify we're signed out by checking for the login link
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  }

  /**
   * Delete the test user account
   * This should be called in afterAll to clean up test data
   */
  async deleteAccount(page: Page): Promise<void> {
    // First ensure we're signed in
    if (!page.url().includes('/dashboard')) {
      await this.signIn(page);
    }
    
    // Navigate to profile
    await page.goto('/profile');
    
    // Scroll to the bottom of the page where delete account might be
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Click delete account button (this might need adjustment based on your UI)
    await page.getByRole('button', { name: 'Delete Account' }).click();
    
    // Confirm deletion in the modal
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    
    // Wait for redirect to home page
    await page.waitForURL('/');
    
    // Verify we're signed out
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  }
} 