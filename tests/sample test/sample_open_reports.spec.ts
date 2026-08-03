import { test, expect } from '@playwright/test';
import { doLogin, goTo, URLS, shot } from '../helpers';

test.describe('Sample Open Reports Test', () => {
  test('Sample - Navigate to Reports Section', async ({ page }) => {
    // 1. Perform Login to establish fresh session & token
    await doLogin(page);
    await shot(page, '01-login-successful.png');

    // 2. Navigate to Reports Section
    await goTo(page, URLS.reports);

    // 3. Verify URL location with auto-retrying assertion & capture screenshot
    await expect(page).toHaveURL(/Documents\/Reports/, { timeout: 30000 });
    await shot(page, '02-reports-section-loaded.png');
    console.log('Sample Open Reports Test completed successfully!');
  });
});
