import { Page, expect } from '@playwright/test';

/**
 * Helper class for admin-specific test utilities
 */
export class TestAdmin {
  /**
   * Create a test course with a unique name
   */
  static async createCourse(page: Page, courseName: string): Promise<string> {
    // Navigate to courses page
    await page.goto('/admin/courses');
    
    // Verify we're on the courses page
    await expect(page.getByRole('heading', { name: 'Courses Management' })).toBeVisible();
    
    // Click on Add Course button
    await page.getByRole('button', { name: 'Add Course' }).click();
    
    // Fill in course details
    await page.getByLabel('Course Name').fill(courseName);
    await page.getByLabel('Address').fill('123 Test Street');
    await page.getByLabel('City').fill('Test City');
    await page.getByLabel('State').fill('TS');
    await page.getByLabel('Zip').fill('12345');
    await page.getByLabel('Phone').fill('555-123-4567');
    await page.getByLabel('Website').fill('https://testcourse.com');
    
    // Save the course
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify course was created
    await expect(page.getByText(courseName)).toBeVisible();
    
    // Extract the course ID from the URL
    const url = page.url();
    const courseId = url.split('/').pop() || '';
    
    return courseId;
  }

  /**
   * Add a tee box to a course
   */
  static async addTeeBox(page: Page, courseId: string, teeName: string, color: string, rating: string, slope: string): Promise<void> {
    // Navigate to course page
    await page.goto(`/admin/courses/${courseId}`);
    
    // Add tee box
    await page.getByRole('button', { name: 'Add Tee Box' }).click();
    await page.getByLabel('Tee Name').fill(teeName);
    await page.getByLabel('Color').fill(color);
    await page.getByLabel('Rating').fill(rating);
    await page.getByLabel('Slope').fill(slope);
    await page.getByRole('button', { name: 'Save Tee Box' }).click();
    
    // Verify tee box was added
    await expect(page.getByText(teeName)).toBeVisible();
  }

  /**
   * Create a test series with a unique name
   */
  static async createSeries(page: Page, seriesName: string): Promise<string> {
    // Navigate to series page
    await page.goto('/admin/series');
    
    // Verify we're on the series page
    await expect(page.getByRole('heading', { name: 'Series Management' })).toBeVisible();
    
    // Click on Add Series button (using the button with the AddIcon)
    await page.getByRole('button', { name: 'Add Series' }).click();
    
    // Fill in series details
    await page.getByLabel('Series Name').fill(seriesName);
    await page.getByLabel('Description').fill('Test series description');
    await page.getByLabel('Start Date').fill('2023-01-01');
    await page.getByLabel('End Date').fill('2023-12-31');
    
    // Save the series
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify series was created
    await expect(page.getByText(seriesName)).toBeVisible();
    
    // Extract the series ID from the URL
    const url = page.url();
    const seriesId = url.split('/').pop() || '';
    
    return seriesId;
  }

  /**
   * Add a participant to a series
   */
  static async addSeriesParticipant(page: Page, seriesId: string, userName: string): Promise<void> {
    // Navigate to series participants page
    await page.goto(`/admin/series/${seriesId}/participants`);
    
    // Add participant
    await page.getByRole('button', { name: 'Add Participant' }).click();
    
    // Select a user from the dropdown
    await page.getByLabel('User').click();
    await page.getByText(userName).click();
    
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Verify participant was added
    await expect(page.getByText(userName)).toBeVisible();
  }

  /**
   * Create a test event with a unique name
   */
  static async createEvent(page: Page, eventName: string, seriesName: string, courseName: string): Promise<string> {
    // Navigate to events page
    await page.goto('/admin/events');
    
    // Verify we're on the events page
    await expect(page.getByRole('heading', { name: 'Events Management' })).toBeVisible();
    
    // Click on Add Event button (using the button with the AddIcon)
    await page.getByRole('button', { name: 'Add Event' }).click();
    
    // Fill in event details
    await page.getByLabel('Event Name').fill(eventName);
    await page.getByLabel('Event Date').fill('2023-06-15');
    
    // Select the series
    await page.getByLabel('Series').click();
    await page.getByText(seriesName).click();
    
    // Select the course
    await page.getByLabel('Course').click();
    await page.getByText(courseName).click();
    
    // Save the event
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify event was created
    await expect(page.getByText(eventName)).toBeVisible();
    
    // Extract the event ID from the URL
    const url = page.url();
    const eventId = url.split('/').pop() || '';
    
    return eventId;
  }

  /**
   * Add a participant to an event
   */
  static async addEventParticipant(page: Page, eventId: string, userName: string): Promise<void> {
    // Navigate to event participants page
    await page.goto(`/events/${eventId}/participants`);
    
    // Add participant
    await page.getByRole('button', { name: 'Add Participant' }).click();
    
    // Select a user from the dropdown
    await page.getByLabel('User').click();
    await page.getByText(userName).click();
    
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Verify participant was added
    await expect(page.getByText(userName)).toBeVisible();
  }

  /**
   * Delete a course
   */
  static async deleteCourse(page: Page, courseId: string): Promise<void> {
    // Navigate to course page
    await page.goto(`/admin/courses/${courseId}`);
    
    // Delete the course
    await page.getByRole('button', { name: 'Delete Course' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Wait for redirect to courses list
    await page.waitForURL('/admin/courses');
  }

  /**
   * Delete a series
   */
  static async deleteSeries(page: Page, seriesId: string): Promise<void> {
    // Navigate to series page
    await page.goto(`/admin/series/${seriesId}`);
    
    // Delete the series
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Wait for redirect to series list
    await page.waitForURL('/admin/series');
  }

  /**
   * Delete an event
   */
  static async deleteEvent(page: Page, eventId: string): Promise<void> {
    // Navigate to event page
    await page.goto(`/events/${eventId}`);
    
    // Delete the event
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Wait for redirect to events list
    await page.waitForURL('/events');
  }
} 