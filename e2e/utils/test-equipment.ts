import { Page, expect } from '@playwright/test';

/**
 * Interface for club creation options
 */
export interface ClubOptions {
  name: string;
  brand: string;
  type: string;
  loft?: string;
  notes?: string;
}

/**
 * Interface for bag creation options
 */
export interface BagOptions {
  name: string;
  description?: string;
  isDefault?: boolean;
  handicap?: number;
  clubIds?: string[];
}

/**
 * TestEquipment class for managing golf equipment in tests
 * This uses real interactions with the application - no mocking
 */
export class TestEquipment {
  /**
   * Create a new golf club
   */
  async createClub(page: Page, options: ClubOptions): Promise<string> {
    console.log('Creating a new club with options:', JSON.stringify(options));
    
    // Assume we're already on the clubs page - the test should handle navigation
    console.log('Current URL before club creation:', page.url());
    
    // Check if we're on the clubs page
    if (!page.url().includes('/profile/clubs')) {
      console.log('Not on clubs page, current URL:', page.url());
      throw new Error(`Not on clubs page, unexpected URL: ${page.url()}`);
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on the clubs page
    await page.screenshot({ path: 'clubs-page-before-adding.png' });
    
    // Look for the "Add New Club" button with various possible texts
    console.log('Looking for Add New Club button...');
    
    // Log all buttons on the page first for debugging
    const allButtonsDebug = await page.getByRole('button').all();
    console.log(`Found ${allButtonsDebug.length} buttons on the page before searching:`);
    for (let i = 0; i < allButtonsDebug.length; i++) {
      console.log(`Button ${i+1} text:`, await allButtonsDebug[i].textContent());
    }
    
    // Try different approaches to find the button
    let addNewClubButton: any = null;
    
    // Approach 1: Try exact button text with the plus sign
    console.log('Approach 1: Looking for exact button text "Add New Club"');
    addNewClubButton = page.getByRole('button', { name: 'Add New Club', exact: true });
    if (await addNewClubButton.count() > 0) {
      console.log('Found button with exact text: Add New Club');
    } else {
      // Approach 2: Try button with partial text
      console.log('Approach 2: Looking for button with partial text');
      const buttonTexts = ['Add New Club', 'Add Club', 'New Club', 'Add', 'Club', 'Create'];
      
      for (const buttonText of buttonTexts) {
        console.log(`Looking for button with text: ${buttonText}`);
        const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
        if (await button.count() > 0) {
          console.log(`Found button with text: ${buttonText}`);
          addNewClubButton = button;
          break;
        }
      }
      
      // Approach 3: Try any button with add/new/create text
      if (addNewClubButton === null || await addNewClubButton.count() === 0) {
        console.log('Approach 3: Looking for any button with add/new/create text');
        addNewClubButton = page.getByRole('button').filter({ hasText: /add|new|create/i });
      }
      
      // Approach 4: Try any clickable element with add/new/create text
      if (addNewClubButton === null || await addNewClubButton.count() === 0) {
        console.log('Approach 4: Looking for any clickable element with add/new/create text');
        addNewClubButton = page.locator('a, button, [role="button"], .btn, [class*="button"]').filter({ hasText: /add|new|create/i });
      }
    }
    
    // Check if we found the button
    const buttonExists = addNewClubButton !== null && await addNewClubButton.count() > 0;
    console.log('Add New Club button found:', buttonExists);
    
    if (!buttonExists) {
      console.log('Add New Club button not found');
      // List all buttons on the page for debugging
      const allButtons = await page.getByRole('button').all();
      console.log(`Found ${allButtons.length} buttons on the page`);
      for (let i = 0; i < allButtons.length; i++) {
        console.log(`Button ${i+1} text:`, await allButtons[i].textContent());
      }
      
      // Take screenshot of the page
      await page.screenshot({ path: 'add-club-button-not-found.png' });
      
      throw new Error('Add New Club button not found on clubs page');
    }
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-clicking-add-club-button.png' });
    
    console.log('Clicking Add New Club button');
    await addNewClubButton.click();
    console.log('Clicked Add New Club button');
    
    // Wait for the dialog to appear
    console.log('Waiting for club form dialog');
    try {
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      console.log('Dialog is visible');
      
      // Take screenshot of dialog
      await page.screenshot({ path: 'club-creation-dialog.png' });
      
      // Log dialog content for debugging
      console.log('Dialog content:');
      const dialogText = await page.getByRole('dialog').textContent();
      console.log(dialogText);
      
      // Fill out the club form using tab navigation
      console.log('Filling out club form using tab navigation');
      
      // First, focus on the first input field (Club Name)
      console.log('Focusing on first input field (Club Name)');
      await page.getByRole('dialog').locator('input').first().focus();
      await page.getByRole('dialog').locator('input').first().fill(options.name);
      console.log('Filled Club Name field with:', options.name);
      
      // Tab to the Brand field (which is a select/dropdown)
      console.log('Tabbing to Brand field');
      await page.keyboard.press('Tab');
      
      // Click to open the dropdown
      console.log('Clicking to open Brand dropdown');
      await page.keyboard.press('Enter');
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500);
      
      // Type the brand name to filter options
      console.log('Typing brand name:', options.brand);
      await page.keyboard.type(options.brand);
      
      // Press Enter to select the first matching option
      console.log('Pressing Enter to select brand');
      await page.keyboard.press('Enter');
      
      // Tab to the Club Type field
      console.log('Tabbing to Club Type field');
      await page.keyboard.press('Tab');
      
      // Click to open the dropdown
      console.log('Clicking to open Club Type dropdown');
      await page.keyboard.press('Enter');
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500);
      
      // Type the club type to filter options
      console.log('Typing club type:', options.type);
      await page.keyboard.type(options.type);
      
      // Press Enter to select the first matching option
      console.log('Pressing Enter to select club type');
      await page.keyboard.press('Enter');
      
      // Tab to the Loft field
      console.log('Tabbing to Loft field');
      await page.keyboard.press('Tab');
      
      // Fill loft if provided
      if (options.loft) {
        console.log('Filling Loft field with:', options.loft);
        await page.keyboard.type(options.loft);
      }
      
      // Tab to the Notes field
      console.log('Tabbing to Notes field');
      await page.keyboard.press('Tab');
      
      // Fill notes if provided
      if (options.notes) {
        console.log('Filling Notes field with:', options.notes);
        await page.keyboard.type(options.notes);
      }
      
      // Take screenshot after filling form
      await page.screenshot({ path: 'club-form-filled.png' });
      
      // Tab to the Add button and press Enter
      console.log('Tabbing to Add button');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need an extra tab to get past the Cancel button
      
      // Press Enter to submit the form
      console.log('Pressing Enter to submit form');
      await page.keyboard.press('Enter');
      
      // Wait for the success notification
      console.log('Waiting for success notification');
      await expect(page.getByText('Club added successfully')).toBeVisible();
      
      // Take screenshot after club creation
      await page.screenshot({ path: 'after-club-creation-success.png' });
      
      console.log(`Club "${options.name}" created successfully`);
      // Return the club name as an identifier
      return options.name;
    } catch (error) {
      console.log('Error during club creation dialog handling:', error);
      await page.screenshot({ path: 'club-creation-dialog-error.png' });
      throw error;
    }
  }

  /**
   * Create a new golf bag
   */
  async createBag(page: Page, options: BagOptions): Promise<string> {
    console.log('Creating a new bag with options:', JSON.stringify(options));
    
    // Assume we're already on the bags page - the test should handle navigation
    console.log('Current URL before bag creation:', page.url());
    
    // Check if we're on the bags page
    if (!page.url().includes('/profile/bags')) {
      console.log('Not on bags page, current URL:', page.url());
      throw new Error(`Not on bags page, unexpected URL: ${page.url()}`);
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on the bags page
    await page.screenshot({ path: 'bags-page-before-adding.png' });
    
    // Look for the "Add New Bag" button with various possible texts
    console.log('Looking for Add New Bag button...');
    
    // Log all buttons on the page first for debugging
    const allButtonsDebug = await page.getByRole('button').all();
    console.log(`Found ${allButtonsDebug.length} buttons on the page before searching:`);
    for (let i = 0; i < allButtonsDebug.length; i++) {
      console.log(`Button ${i+1} text:`, await allButtonsDebug[i].textContent());
    }
    
    // Try different approaches to find the button
    let addNewBagButton: any = null;
    
    // Approach 1: Try exact button text with the plus sign
    console.log('Approach 1: Looking for exact button text "Add New Bag"');
    addNewBagButton = page.getByRole('button', { name: 'Add New Bag', exact: true });
    if (await addNewBagButton.count() > 0) {
      console.log('Found button with exact text: Add New Bag');
    } else {
      // Approach 2: Try button with partial text
      console.log('Approach 2: Looking for button with partial text');
      const buttonTexts = ['Add New Bag', 'Add Bag', 'New Bag', 'Add', 'Bag', 'Create'];
      
      for (const buttonText of buttonTexts) {
        console.log(`Looking for button with text: ${buttonText}`);
        const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
        if (await button.count() > 0) {
          console.log(`Found button with text: ${buttonText}`);
          addNewBagButton = button;
          break;
        }
      }
      
      // Approach 3: Try any button with add/new/create text
      if (addNewBagButton === null || await addNewBagButton.count() === 0) {
        console.log('Approach 3: Looking for any button with add/new/create text');
        addNewBagButton = page.getByRole('button').filter({ hasText: /add|new|create/i }).filter({ hasText: /bag/i });
      }
      
      // Approach 4: Try any clickable element with add/new/create text
      if (addNewBagButton === null || await addNewBagButton.count() === 0) {
        console.log('Approach 4: Looking for any clickable element with add/new/create text');
        addNewBagButton = page.locator('a, button, [role="button"], .btn, [class*="button"]').filter({ hasText: /add|new|create/i }).filter({ hasText: /bag/i });
      }
    }
    
    // Check if we found the button
    const buttonExists = addNewBagButton !== null && await addNewBagButton.count() > 0;
    console.log('Add New Bag button found:', buttonExists);
    
    if (!buttonExists) {
      console.log('Add New Bag button not found');
      // List all buttons on the page for debugging
      const allButtons = await page.getByRole('button').all();
      console.log(`Found ${allButtons.length} buttons on the page`);
      for (let i = 0; i < allButtons.length; i++) {
        console.log(`Button ${i+1} text:`, await allButtons[i].textContent());
      }
      
      // Take screenshot of the page
      await page.screenshot({ path: 'add-bag-button-not-found.png' });
      
      throw new Error('Add New Bag button not found on bags page');
    }
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-clicking-add-bag-button.png' });
    
    console.log('Clicking Add New Bag button');
    await addNewBagButton.click();
    console.log('Clicked Add New Bag button');
    
    // Wait for the dialog to appear
    console.log('Waiting for bag form dialog');
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Take screenshot of dialog
    await page.screenshot({ path: 'bag-creation-dialog.png' });
    
    // Log dialog content for debugging
    console.log('Dialog content:');
    const dialogText = await page.getByRole('dialog').textContent();
    console.log(dialogText);
    
    // Fill out the bag form using tab navigation
    console.log('Filling out bag form using tab navigation');
    
    // First, focus on the first input field (Bag Name)
    console.log('Focusing on first input field (Bag Name)');
    await page.getByRole('dialog').locator('input').first().focus();
    await page.getByRole('dialog').locator('input').first().fill(options.name);
    console.log('Filled Bag Name field with:', options.name);
    
    // Tab to the Description field
    console.log('Tabbing to Description field');
    await page.keyboard.press('Tab');
    
    // Fill description if provided
    if (options.description) {
      console.log('Filling Description field with:', options.description);
      await page.keyboard.type(options.description);
    }
    
    // Tab to the Handicap field
    console.log('Tabbing to Handicap field');
    await page.keyboard.press('Tab');
    
    // Fill handicap if provided
    if (options.handicap !== undefined) {
      console.log('Filling Handicap field with:', options.handicap);
      await page.keyboard.type(options.handicap.toString());
    }
    
    // Tab to the Default Bag checkbox
    console.log('Tabbing to Default Bag checkbox');
    await page.keyboard.press('Tab');
    
    // Check the default bag checkbox if needed
    if (options.isDefault) {
      console.log('Checking Default Bag checkbox');
      await page.keyboard.press('Space');
    }
    
    // If club IDs are provided, select those clubs
    if (options.clubIds && options.clubIds.length > 0) {
      console.log('Selecting clubs for the bag');
      
      // Tab to the clubs section
      console.log('Tabbing to clubs section');
      await page.keyboard.press('Tab');
      
      // For each club, we need to find and click it
      for (const clubId of options.clubIds) {
        console.log(`Looking for club: ${clubId}`);
        const clubElement = page.getByText(clubId, { exact: true }).first();
        
        if (await clubElement.count() > 0) {
          console.log(`Found club: ${clubId}, clicking it`);
          await clubElement.click();
        } else {
          console.log(`Club not found: ${clubId}`);
        }
      }
    }
    
    // Take screenshot after filling form
    await page.screenshot({ path: 'bag-form-filled.png' });
    
    // Tab to the Add button and press Enter
    console.log('Tabbing to Add button');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need an extra tab to get past the Cancel button
    
    // Press Enter to submit the form
    console.log('Pressing Enter to submit form');
    await page.keyboard.press('Enter');
    
    // Wait for the success notification
    console.log('Waiting for success notification');
    await expect(page.getByText('Bag added successfully')).toBeVisible();
    
    // Take screenshot after bag creation
    await page.screenshot({ path: 'after-bag-creation-success.png' });
    
    console.log(`Bag "${options.name}" created successfully`);
    // Return the bag name as an identifier
    return options.name;
  }

  /**
   * Delete a golf club
   */
  async deleteClub(page: Page, clubName: string): Promise<void> {
    console.log(`Deleting club: ${clubName}`);
    
    // Assume we're already on the clubs page - the test should handle navigation
    console.log('Current URL before club deletion:', page.url());
    
    // Check if we're on the clubs page
    if (!page.url().includes('/profile/clubs')) {
      console.log('Not on clubs page, current URL:', page.url());
      throw new Error(`Not on clubs page, unexpected URL: ${page.url()}`);
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot before deletion
    await page.screenshot({ path: 'before-club-deletion.png' });
    
    // Find the club by name
    console.log(`Looking for club: ${clubName}`);
    const clubElement = page.getByText(clubName, { exact: true }).first();
    
    if (await clubElement.count() === 0) {
      console.log(`Club not found: ${clubName}`);
      throw new Error(`Club not found: ${clubName}`);
    }
    
    // Find the club card by name
    console.log('Looking for club card');
    const clubCard = clubElement.locator('..').locator('..');
    
    // Look for delete button
    console.log('Looking for delete button');
    let deleteButton = clubCard.getByRole('button', { name: 'delete', exact: true });
    
    if (await deleteButton.count() === 0) {
      console.log('Exact "delete" button not found, trying alternatives');
      deleteButton = clubCard.getByRole('button').filter({ hasText: /delete|remove|trash/i });
      
      if (await deleteButton.count() === 0) {
        console.log('No delete button found by text, looking for icon buttons');
        // Look for any button that might be a delete button (icon buttons often don't have text)
        deleteButton = clubCard.locator('button').last();
      }
    }
    
    console.log('Clicking delete button');
    await deleteButton.click();
    
    // Look for confirmation dialog or button if needed
    const confirmationDialog = page.getByRole('dialog');
    if (await confirmationDialog.count() > 0) {
      console.log('Confirmation dialog found, looking for confirm button');
      
      // Try different button texts for confirmation
      const confirmButtonTexts = ['Confirm', 'Yes', 'Delete', 'Remove'];
      let confirmButton;
      
      for (const buttonText of confirmButtonTexts) {
        console.log(`Looking for confirm button with text: ${buttonText}`);
        confirmButton = page.getByRole('button', { name: buttonText, exact: true });
        if (await confirmButton.count() > 0) {
          console.log(`Found confirm button with text: ${buttonText}`);
          break;
        }
      }
      
      if (!confirmButton || await confirmButton.count() === 0) {
        console.log('No specific confirm button found, looking for any confirm button');
        confirmButton = page.getByRole('button').filter({ hasText: /confirm|yes|delete|remove/i });
      }
      
      console.log('Clicking confirm button');
      await confirmButton.click();
    }
    
    // Wait for the success notification
    console.log('Waiting for success notification');
    await expect(page.getByText('Club removed successfully')).toBeVisible();
    
    // Take screenshot after deletion
    await page.screenshot({ path: 'after-club-deletion.png' });
    
    console.log(`Club "${clubName}" deleted successfully`);
  }

  /**
   * Delete a golf bag
   */
  async deleteBag(page: Page, bagName: string): Promise<void> {
    console.log(`Deleting bag: ${bagName}`);
    
    // Navigate to bags page
    console.log('Navigating to bags page for deletion');
    await page.goto('/profile/bags');
    console.log('Current URL after navigation:', page.url());
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot before deletion
    await page.screenshot({ path: 'before-bag-deletion.png' });
    
    // Find the bag by name - try multiple approaches
    console.log(`Looking for bag: ${bagName}`);
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'bags-page-before-deletion.png' });
    
    // Try different approaches to find the bag card
    let bagCard;
    
    // Approach 1: Try to find by exact text match
    console.log('Approach 1: Looking for bag by exact text match');
    const bagElement = page.getByText(bagName, { exact: true }).first();
    
    if (await bagElement.count() > 0) {
      console.log('Found bag by exact text match');
      // Find the bag card - try different parent levels
      bagCard = bagElement.locator('..').locator('..');
    } else {
      console.log('Bag not found by exact text match, trying alternative approaches');
      
      // Approach 2: Try to find by heading
      console.log('Approach 2: Looking for bag by heading');
      const bagHeading = page.getByRole('heading').filter({ hasText: bagName }).first();
      
      if (await bagHeading.count() > 0) {
        console.log('Found bag by heading');
        bagCard = bagHeading.locator('..').locator('..');
      } else {
        // Approach 3: Try to find any element with the bag name
        console.log('Approach 3: Looking for any element with the bag name');
        const anyBagElement = page.locator('*').filter({ hasText: bagName }).first();
        
        if (await anyBagElement.count() > 0) {
          console.log('Found bag by any element with text');
          bagCard = anyBagElement.locator('..').locator('..');
        } else {
          console.log(`Bag not found: ${bagName}`);
          throw new Error(`Bag not found: ${bagName}`);
        }
      }
    }
    
    // Take screenshot of the bag card
    await page.screenshot({ path: 'bag-card-found.png' });
    
    // Look for delete button - try multiple approaches
    console.log('Looking for delete button');
    
    // Log all buttons in the card for debugging
    const cardButtons = await bagCard.locator('button').all();
    console.log(`Found ${cardButtons.length} buttons in the bag card:`);
    for (let i = 0; i < cardButtons.length; i++) {
      console.log(`Button ${i+1} text:`, await cardButtons[i].textContent());
    }
    
    // Try different approaches to find the delete button
    let deleteButton;
    
    // Approach 1: Try to find by exact text match
    console.log('Approach 1: Looking for delete button by exact text match');
    deleteButton = bagCard.getByRole('button', { name: 'delete', exact: true });
    
    if (await deleteButton.count() === 0) {
      console.log('Exact "delete" button not found, trying alternatives');
      
      // Approach 2: Try to find by text content
      console.log('Approach 2: Looking for delete button by text content');
      deleteButton = bagCard.getByRole('button').filter({ hasText: /delete|remove|trash/i });
      
      if (await deleteButton.count() === 0) {
        console.log('No delete button found by text, looking for icon buttons');
        
        // Approach 3: Try to find by position (last button in the card)
        console.log('Approach 3: Looking for last button in the card');
        
        // Log all buttons on the page for debugging
        const allButtons = await page.getByRole('button').all();
        console.log(`Found ${allButtons.length} buttons on the page:`);
        for (let i = 0; i < allButtons.length; i++) {
          console.log(`Button ${i+1} text:`, await allButtons[i].textContent());
        }
        
        // Try the last button in the card (often delete is the last action)
        if (cardButtons.length > 0) {
          console.log('Using last button in the card as delete button');
          deleteButton = bagCard.locator('button').last();
        } else {
          // If no buttons in the card, try to find buttons within the card's parent
          console.log('No buttons in card, looking for buttons in parent container');
          const parentButtons = await bagCard.locator('..').locator('button').all();
          if (parentButtons.length > 0) {
            console.log(`Found ${parentButtons.length} buttons in parent container`);
            // Often the delete button is the last one
            deleteButton = bagCard.locator('..').locator('button').last();
          } else {
            // Last resort: try to find any button that might be a delete button
            console.log('No buttons in parent, trying to find any delete-like button on page');
            deleteButton = page.getByRole('button').filter({ hasText: /delete|remove|trash/i }).first();
          }
        }
      }
    }
    
    // Check if we found the delete button
    if (await deleteButton.count() === 0) {
      console.log('Delete button not found, cannot proceed with deletion');
      throw new Error('Delete button not found, cannot proceed with deletion');
    }
    
    console.log('Delete button found, clicking it');
    await deleteButton.click({ timeout: 10000 });
    
    // Look for confirmation dialog or button if needed
    console.log('Checking for confirmation dialog');
    const confirmationDialog = page.getByRole('dialog');
    
    if (await confirmationDialog.count() > 0) {
      console.log('Confirmation dialog found, looking for confirm button');
      
      // Take screenshot of confirmation dialog
      await page.screenshot({ path: 'bag-deletion-confirmation-dialog.png' });
      
      // Log dialog content for debugging
      console.log('Dialog content:');
      const dialogText = await confirmationDialog.textContent();
      console.log(dialogText);
      
      // Try different button texts for confirmation
      const confirmButtonTexts = ['Confirm', 'Yes', 'Delete', 'Remove', 'OK', 'Confirm Delete'];
      let confirmButton;
      
      for (const buttonText of confirmButtonTexts) {
        console.log(`Looking for confirm button with text: ${buttonText}`);
        confirmButton = confirmationDialog.getByRole('button', { name: buttonText, exact: false });
        if (await confirmButton.count() > 0) {
          console.log(`Found confirm button with text: ${buttonText}`);
          break;
        }
      }
      
      if (!confirmButton || await confirmButton.count() === 0) {
        console.log('No specific confirm button found, looking for any confirm button');
        confirmButton = confirmationDialog.getByRole('button').filter({ hasText: /confirm|yes|delete|remove|ok/i });
        
        if (await confirmButton.count() === 0) {
          console.log('No confirm button found by text, trying buttons by index');
          const dialogButtons = await confirmationDialog.getByRole('button').all();
          console.log(`Found ${dialogButtons.length} buttons in dialog`);
          
          // Log all dialog buttons for debugging
          for (let i = 0; i < dialogButtons.length; i++) {
            console.log(`Dialog button ${i+1} text:`, await dialogButtons[i].textContent());
          }
          
          if (dialogButtons.length > 0) {
            // Usually the last button is the confirm button
            confirmButton = confirmationDialog.getByRole('button').nth(dialogButtons.length - 1);
          }
        }
      }
      
      if (await confirmButton.count() > 0) {
        console.log('Clicking confirm button');
        await confirmButton.click();
      } else {
        console.log('No confirm button found, dialog may auto-confirm');
      }
    } else {
      console.log('No confirmation dialog found, deletion may be immediate');
    }
    
    // Wait for the success notification with multiple possible messages
    console.log('Waiting for success notification');
    
    try {
      // First try the most common success message
      await expect(page.getByText('Bag removed successfully')).toBeVisible({ timeout: 5000 });
      console.log('Found success message: "Bag removed successfully"');
    } catch (error) {
      console.log('Standard success message not found, checking if bag is gone');
      
      // Wait a bit longer for the deletion to complete
      console.log('Waiting for deletion to complete...');
      await page.waitForTimeout(2000);
      
      // Refresh the page to ensure we have the latest state
      console.log('Refreshing page to verify bag removal');
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot after refresh
      await page.screenshot({ path: 'after-bag-deletion-refresh.png' });
      
      // Try a different approach to check if the bag is still visible
      console.log('Checking if bag is still visible after refresh');
      
      // First approach: Check by exact text
      let bagStillVisible = await page.getByText(bagName, { exact: true }).count() > 0;
      
      if (bagStillVisible) {
        console.log('Bag still visible by exact text, trying heading check');
        // Second approach: Check by heading
        bagStillVisible = await page.getByRole('heading').filter({ hasText: bagName }).count() > 0;
        
        if (bagStillVisible) {
          console.log('Bag still visible by heading, trying general text check');
          // Third approach: Check by any text containing the bag name
          const textElements = await page.locator(`text="${bagName}"`).all();
          bagStillVisible = textElements.length > 0;
        }
      }
      
      if (bagStillVisible) {
        console.log(`Bag "${bagName}" is still visible after deletion attempt`);
        
        // One more attempt to delete if the bag is still visible
        console.log('Making one more attempt to delete the bag');
        
        // Find the bag again
        const bagElementRetry = page.getByText(bagName, { exact: true }).first();
        if (await bagElementRetry.count() > 0) {
          const bagCardRetry = bagElementRetry.locator('..').locator('..');
          const deleteButtonRetry = bagCardRetry.locator('button').last();
          
          if (await deleteButtonRetry.count() > 0) {
            console.log('Found delete button on retry, clicking it');
            await deleteButtonRetry.click();
            
            // Handle confirmation dialog if it appears
            if (await page.getByRole('dialog').count() > 0) {
              console.log('Confirmation dialog found on retry');
              await page.getByRole('button').last().click();
            }
            
            // Wait and refresh again
            await page.waitForTimeout(2000);
            await page.reload();
            await page.waitForLoadState('networkidle');
            
            // Check one more time
            bagStillVisible = await page.getByText(bagName, { exact: true }).count() > 0;
          }
        }
        
        if (bagStillVisible) {
          throw new Error(`Failed to delete bag: ${bagName} is still visible`);
        } else {
          console.log(`Bag "${bagName}" deleted successfully on retry`);
        }
      } else {
        console.log(`Bag "${bagName}" is no longer visible, deletion successful`);
      }
    }
    
    // Take screenshot after deletion
    await page.screenshot({ path: 'after-bag-deletion.png' });
    
    console.log(`Bag "${bagName}" deleted successfully`);
  }
} 