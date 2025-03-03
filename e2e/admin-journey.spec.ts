import { test, expect } from '@playwright/test';
import { TestUser } from './utils/test-user';
import { TestAdmin } from './utils/test-admin';

// Only use Chrome for these tests
test.use({ 
  browserName: 'chromium'
});

// Use a describe block to group related tests
test.describe('Admin functionality', () => {
  // Setup: Create a unique identifier for this test run to avoid conflicts
  const testId = `test-${Date.now()}`;
  const courseName = `Test Course ${testId}`;
  const seriesName = `Test Series ${testId}`;
  const eventName = `Test Event ${testId}`;
  
  // Store IDs for cleanup
  let courseId: string;
  let seriesId: string;
  let eventId: string;

  // Use the admin test user
  const adminUser = new TestUser({
    email: 'admin@golfcompete.com', // Replace with your admin test user
    password: 'adminpassword!' // Replace with your admin password
  });

  // Before each test, sign in as admin
  test.beforeEach(async ({ page }) => {
    await adminUser.signIn(page);
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  // Test 1: Create, view, and delete a course
  test('Course management lifecycle', async ({ page }) => {
    // Create a course
    courseId = await TestAdmin.createCourse(page, courseName);
    console.log(`Created course with ID: ${courseId}`);
    
    // Add a tee box
    await TestAdmin.addTeeBox(page, courseId, 'Championship', 'Black', '74.2', '142');
    
    // Add scorecard data (simplified for test)
    await page.goto(`/admin/courses/${courseId}`);
    await page.getByRole('button', { name: 'Edit Scorecard' }).click();
    
    // Fill in some basic hole data (just a few holes for the test)
    for (let i = 1; i <= 3; i++) {
      await page.getByLabel(`Hole ${i} Par`).fill('4');
      await page.getByLabel(`Hole ${i} Yards`).fill('400');
      await page.getByLabel(`Hole ${i} Handicap`).fill(i.toString());
    }
    
    await page.getByRole('button', { name: 'Save Scorecard' }).click();
    
    // Verify scorecard was saved
    await expect(page.getByText('Scorecard saved successfully')).toBeVisible();
    
    // Navigate back to courses list
    await page.goto('/admin/courses');
    
    // Verify our course is in the list
    await expect(page.getByText(courseName)).toBeVisible();
  });

  // Test 2: Create, view, and add a participant to a series
  test('Series management lifecycle', async ({ page }) => {
    // Create a series
    seriesId = await TestAdmin.createSeries(page, seriesName);
    console.log(`Created series with ID: ${seriesId}`);
    
    // Add a participant to the series
    await TestAdmin.addSeriesParticipant(page, seriesId, 'Test User');
    
    // Navigate back to series list
    await page.goto('/admin/series');
    
    // Verify our series is in the list
    await expect(page.getByText(seriesName)).toBeVisible();
  });

  // Test 3: Create, view, and add a participant to an event
  test('Event management lifecycle', async ({ page }) => {
    // Create an event
    eventId = await TestAdmin.createEvent(page, eventName, seriesName, courseName);
    console.log(`Created event with ID: ${eventId}`);
    
    // Add a participant to the event
    await TestAdmin.addEventParticipant(page, eventId, 'Test User');
    
    // Navigate back to events list
    await page.goto('/admin/events');
    
    // Verify our event is in the list
    await expect(page.getByText(eventName)).toBeVisible();
  });

  // Test 4: Delete all created entities (cleanup)
  test('Delete all created entities', async ({ page }) => {
    // Delete the event
    await TestAdmin.deleteEvent(page, eventId);
    
    // Verify event was deleted
    await page.goto('/admin/events');
    await expect(page.getByText(eventName)).not.toBeVisible();
    
    // Delete the series
    await TestAdmin.deleteSeries(page, seriesId);
    
    // Verify series was deleted
    await page.goto('/admin/series');
    await expect(page.getByText(seriesName)).not.toBeVisible();
    
    // Delete the course
    await TestAdmin.deleteCourse(page, courseId);
    
    // Verify course was deleted
    await page.goto('/admin/courses');
    await expect(page.getByText(courseName)).not.toBeVisible();
  });
}); 