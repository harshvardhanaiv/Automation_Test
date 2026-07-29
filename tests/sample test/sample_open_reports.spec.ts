import { test, expect } from '@playwright/test';
import { doLogin, goTo, URLS } from '../helpers';

test.describe('Sample Open Reports Test', () => {
  test('Sample - Navigate to Reports Section', async ({ page }) => {
    // 1. Perform Login to establish fresh session & token
    await doLogin(page);

    // 2. Navigate to Reports Section
    await goTo(page, URLS.reports);

    // 3. Verify URL location with auto-retrying web-first assertion
    await expect(page).toHaveURL(/Documents\/Reports/, { timeout: 30000 });
    console.log('Sample Open Reports Test completed successfully!');
  });
});
