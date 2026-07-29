import { test, expect } from '@playwright/test';
import { BASE_URL, USERNAME, PASSWORD, doLogin } from '../helpers';

test.describe('Sample AIV Login Test', () => {
  test('Sample Login - Login to AIV Application', async ({ page }) => {
    // 1. Navigate to AIV Application URL
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // 2. Perform AIV Login
    await doLogin(page);

    // 3. Wait 2 seconds for main application dashboard to load
    await page.waitForTimeout(2000);

    // 4. Verify login success
    await expect(page).not.toHaveURL(/login/i);
    console.log('Sample AIV Login Test completed successfully!');
  });
});
