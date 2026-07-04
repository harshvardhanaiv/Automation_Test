import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow, assertPageLoaded } from './helpers';

test.describe.serial('AIV Login', () => {

  test('should login successfully', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://aiv.test.oneaiv.com:8086/aiv/', { waitUntil: 'networkidle' });
    
    // Check if login form is visible
    const loginFormVisible = await page.locator('input[placeholder="Your email"]').first().isVisible().catch(() => false);
    
    if (loginFormVisible) {
      // Fill username
      await page.locator('input[placeholder="Your email"]').first().fill('Admin');
      
      // Fill password
      await page.locator('input[placeholder="Password"]').first().fill('Ganesh04');
      
      // Click login button
      await page.locator('button:has-text("Login")').click();
      
      // Wait for navigation to complete
      await page.waitForURL('**/aiv/**', { timeout: 15000 });
    }
    
    // Wait for app shell to load - check for search input
    await page.waitForSelector('input[placeholder="Search files and folders"]', { 
      state: 'visible', 
      timeout: 20000 
    }).catch(async () => {
      // Fallback: try alternative search placeholder
      await page.waitForSelector('input[placeholder="Search files and folders in current section"]', { 
        state: 'visible', 
        timeout: 10000 
      });
    });
    
    // Take screenshot
    await shot(page, 'login-success.png');
    
    // Verify we're logged in
    await expect(page).toHaveURL(/aiv/);
  });

});