import { test, expect } from '@playwright/test';

test('Login Flow Scenario', async ({ page }) => {
  // 1. Open the application URL and wait for network to be idle
  await page.goto('https://aiv.test.oneaiv.com:8086/aiv/', { waitUntil: 'networkidle' });

  // 2. Wait for login page components to load
  const usernameInput = page.getByPlaceholder('Your email');
  const passwordInput = page.getByPlaceholder('Password');
  const loginButton = page.getByRole('button', { name: 'Login' });

  await expect(usernameInput).toBeVisible({ timeout: 15000 });

  // 3. Enter username: Admin
  await usernameInput.fill('Admin');

  // 4. Enter password: Ganesh04
  await passwordInput.fill('Ganesh04');

  // 5. Click on Login button
  // Playwright automatically retries if the button is not immediately actionable
  await loginButton.waitFor({ state: 'visible' });
  await loginButton.click();

  // 6. Wait for dashboard/home page to load
  // Verify login is successful by checking for a dashboard-specific element and URL state
  const dashboardIndicator = page.getByPlaceholder('Search files and folders in All sections');
  
  // Using a robust wait for the dashboard element to appear
  await expect(dashboardIndicator).toBeVisible({ timeout: 30000 });

  // Verify URL confirms we are no longer on the login page
  await expect(page).not.toHaveURL(/.*login.*/i);

  // Bonus: Take screenshot after successful login
  await page.screenshot({ path: 'login-success.png', fullPage: true });
});
