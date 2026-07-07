import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('https://aiv.test.oneaiv.com:8086/aiv/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  const emailInput = page.locator("input[placeholder='Your email'], input[name='username']").first();
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill(username);
  await page.locator("input[placeholder='Password'], input[name='password']").first().fill(password);
  await page.locator("button:has-text('Login')").click();
  await Promise.race([
    page.getByRole('searchbox').first().waitFor({ state: 'visible', timeout: 150000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 150000 }),
  ]);
}

async function logout(page: Page) {
  const profileBtn = page.locator("span:has-text('Admin'), [class*='user-name'], [class*='profile']").first();
  if (await profileBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await profileBtn.click();
    await page.waitForTimeout(500);
  }
  const logoutBtn = page.getByText('Logout', { exact: false }).first();
  if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(2000);
  }
}

async function navigateToReports(page: Page) {
  console.log('👉 Navigating to Reports...');
  const hamburger = page.locator('button.smenu_button').first();
  if (await hamburger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(1000);
    
    // Check if Documents is visible in sidebar
    const documentsItem = page.locator('.sidebardiv').getByText('Documents', { exact: false }).first();
    if (await documentsItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await documentsItem.click();
      await page.waitForTimeout(1000);
      
      const reportsItem = page.locator('.sidebardiv').getByText('Reports', { exact: false }).first();
      if (await reportsItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportsItem.click();
        await page.waitForTimeout(3000);
        
        // Close sidebar if still open
        if (await hamburger.isVisible().catch(() => false)) {
          await hamburger.click();
          await page.waitForTimeout(500);
        }
        return;
      }
    }
  }
  
  // Fallback to direct URL navigation
  await goTo(page, URLS.reports);
}

test.describe.serial('AIV Reports - Shared Once Schedule Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Start with saved session state (Admin)
    await ensureLoggedIn(page);
  });

  test('complete shared once schedule workflow', async ({ page, context }) => {
    // Increase test timeout to 7 minutes to accommodate the 2.5 minutes wait time
    test.setTimeout(420000);

    // Step 1: Navigate to Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await shot(page, '02-reports-page.png');
    await assertPageLoaded(page, 'Reports');

    // Step 2: Find and double-click 'Order details AutoTest'
    console.log('👉 Step 2: Finding Order details AutoTest...');
    const targetCell = page.locator('[role="gridcell"]').filter({ hasText: 'Order details AutoTest' }).first();
    await targetCell.scrollIntoViewIfNeeded();
    await targetCell.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '03-scheduler-open.png');

    const schedulerDialog = page.getByRole('dialog').first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });

    // Step 3: Switch to Schedule tab and select Once
    console.log('👉 Step 3: Configuring schedule once...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);
    const onceRadio = schedulerDialog.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);

    // Step 4: Set Start Time as after 1.5 minutes (90 seconds)
    console.log('👉 Step 4: Clicking calendar icon and incrementing minutes...');
    const calendarIcon = schedulerDialog.locator('button.p-datepicker-trigger, button.ui-datepicker-trigger').first();
    await calendarIcon.click();
    await page.waitForTimeout(1000);

    // Read current minutes from the calendar to handle boundary hour rollover
    const hourSpan = page.locator('.p-hour-picker span, .ui-hour-picker span').first();
    const minSpan = page.locator('.p-minute-picker span, .ui-minute-picker span').first();
    await expect(minSpan).toBeVisible({ timeout: 5000 });
    const currentMin = parseInt((await minSpan.textContent() || '0').trim());
    console.log(`🕒 Time picker current minute: ${currentMin}`);

    const hrUpButton = page.locator('.p-hour-picker button, .ui-hour-picker button, .p-hour-picker .pi-chevron-up').first();
    const minUpButton = page.locator('.p-minute-picker button, .ui-minute-picker button, .p-minute-picker .pi-chevron-up').first();

    if (currentMin >= 58) {
      // If current minutes are 58 or 59, we must also click Hour Up once to prevent rolling over into the past
      console.log('👉 Minute is close to hour end. Incrementing Hour up once and Minute up twice.');
      await hrUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
    } else {
      // Otherwise, just click Minute Up twice to schedule ~2 minutes in the future
      await minUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
    }
    await page.waitForTimeout(500);

    // Click the active highlighted day to apply and close the calendar
    const activeDay = page.locator('.p-datepicker-calendar .p-highlight, .ui-datepicker-calendar .ui-state-active').first();
    if (await activeDay.isVisible().catch(() => false)) {
      await activeDay.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1000);
    await shot(page, '04-schedule-once.png');

    // Step 5: Share checkbox, select Users, Visibility Public
    console.log('👉 Step 5: Configuring sharing settings...');
    const shareCheckbox = schedulerDialog.locator('p-checkbox[name="share"] .p-checkbox-box').first();
    await shareCheckbox.scrollIntoViewIfNeeded();
    await shareCheckbox.click({ force: true });
    await page.waitForTimeout(500);

    const usersRadio = schedulerDialog.locator('app-share-content p-radioButton, .schedule-share p-radioButton').first().locator('.p-radiobutton-box');
    await usersRadio.click({ force: true });
    // Wait for 2 seconds to let the Visibility dropdown render and settle after checking Users radio button
    await page.waitForTimeout(2000);

    // Open Visibility dropdown
    const visibilityDropdown = page.locator('p-dropdown[name="visibilityTypes"]').first();
    await expect(visibilityDropdown).toBeVisible({ timeout: 10000 });

    // Resilient click sequence to open the dropdown
    let opened = false;
    for (const selector of ['.p-dropdown-trigger', '.p-dropdown', 'span.p-dropdown-label']) {
      try {
        console.log(`👉 Attempting click on ${selector}...`);
        await visibilityDropdown.locator(selector).first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(500);
        // Check if options overlay is visible
        if (await page.locator('.p-dropdown-items-wrapper, .p-dropdown-item').first().isVisible({ timeout: 1000 }).catch(() => false)) {
          opened = true;
          break;
        }
      } catch (e) {
        // ignore and try next
      }
    }

    if (!opened) {
      console.log('👉 Fallback: Clicking p-dropdown directly...');
      await visibilityDropdown.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Select Public option from dropdown
    const publicOption = page.locator('.p-dropdown-item').filter({ hasText: 'Public' }).first();
    await expect(publicOption).toBeVisible({ timeout: 5000 });
    await publicOption.click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, '05-share-setup.png');

    // Step 6: Search for Demo and click checkbox
    console.log('👉 Step 6: Searching for Demo user and checking box...');
    const userSearchInput = schedulerDialog.locator('app-share-content input[placeholder*="Search"i]:visible, .schedule-share input[placeholder*="Search"i]:visible').first();
    await expect(userSearchInput).toBeVisible({ timeout: 5000 });
    await userSearchInput.click();
    await userSearchInput.clear();
    await userSearchInput.pressSequentially('Demo', { delay: 100 });
    await page.waitForTimeout(2000);

    // Locate the cell containing exactly "Demo" to identify the row inside the dialog
    const demoCell = schedulerDialog.locator('app-share-content td, .sharecontent td, app-share-content .e-rowcell, .sharecontent .e-rowcell').filter({ hasText: /^\s*Demo\s*$/i }).first();
    await expect(demoCell).toBeVisible({ timeout: 10000 });
    
    // Find the parent row of the cell and click the checkbox wrapper/frame directly to toggle selection
    const demoRow = demoCell.locator('xpath=..');
    const demoCheckbox = demoRow.locator('.e-frame, .e-checkbox-wrapper, .p-checkbox-box').first();
    await demoCheckbox.scrollIntoViewIfNeeded();
    await demoCheckbox.click();
    
    // Wait for 5 seconds as requested by user to let the Demo user selection settle
    await page.waitForTimeout(5000);
    await shot(page, '06-user-selected.png');

    // Step 7: Switch to Output and set name as OD AutoTest
    console.log('👉 Step 7: Configuring output settings...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('OD AutoTest');

    const currentFormat = schedulerDialog.getByText('rptdocument', { exact: true }).first();
    if (await currentFormat.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currentFormat.click();
      await page.waitForTimeout(300);
      await page.locator('li, [role="option"]').filter({ hasText: /^rptdocument$/i }).first().click();
    }
    await page.waitForTimeout(500);
    await shot(page, '07-output-setup.png');

    // Step 8: Click Run
    console.log('👉 Step 8: Clicking Run button...');
    const runButton = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await runButton.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog).not.toBeVisible({ timeout: 15000 }).catch(() => { });
    await shot(page, '08-run-clicked.png');

    // Step 9: Navigate to Request section -> Schedule tab
    console.log('👉 Step 9: Verifying in Request Schedule tab...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    const requestScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestScheduleTab.click();
    await page.waitForTimeout(1000);

    // Poll the Requests list until the scheduled item appears
    let found = false;
    const scheduledItem = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'OD AutoTest' }).first();
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    
    for (let i = 0; i < 5; i++) {
      if (await scheduledItem.isVisible().catch(() => false)) {
        found = true;
        break;
      }
      console.log(`👉 Schedule item not visible yet. Refreshing grid (attempt ${i + 1}/5)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(3000);
    }
    
    await expect(scheduledItem).toBeVisible({ timeout: 10000 });
    await shot(page, '09-scheduled-list.png');

    // Step 10: Wait for 2.5 minutes (150 seconds)
    console.log('👉 Step 10: Waiting 150 seconds (2.5 minutes) for schedule to trigger...');
    await page.waitForTimeout(150000);

    // Step 11: Logout Admin user
    console.log('👉 Step 11: Logging out Admin...');
    await logout(page);

    // Clear session/local storage and cookies to isolate the Demo user session completely
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await page.waitForTimeout(1000);

    // Step 12: Login as Demo user
    console.log('👉 Step 12: Logging in as Demo user...');
    await loginAs(page, 'Demo', 'password');

    // Step 13: Navigate to Reports section
    console.log('👉 Step 13: Navigating to Reports as Demo...');
    await navigateToReports(page);
    await page.waitForTimeout(1000);

    // Step 14: Search and poll for OD AutoTest report
    console.log('👉 Step 14: Polling for OD AutoTest file...');
    const searchBox = page.getByRole('searchbox').first();
    await searchBox.clear();
    await searchBox.fill('OD AutoTest');
    await page.waitForTimeout(1000);

    let fileFound = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`   Attempt ${attempt}/10...`);
      const refreshBtn = page.locator('.fa-arrow-rotate-right, .fa-rotate-90').first();
      if (await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refreshBtn.click();
      }
      await page.waitForTimeout(3000);

      const fileCell = page.locator('[role="gridcell"]').filter({ hasText: 'OD AutoTest' }).first();
      if (await fileCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        fileFound = true;
        break;
      }
    }
    expect(fileFound).toBe(true);

    // Step 15: Double click to open report in new tab
    console.log('👉 Step 15: Opening report and waiting for load...');
    const fileCell = page.locator('[role="gridcell"]').filter({ hasText: 'OD AutoTest' }).first();
    await fileCell.dblclick();

    const newPagePromise = new Promise<Page>((resolve) => {
      context.on('page', (newPage) => {
        resolve(newPage);
      });
    });
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load', { timeout: 90000 });
    // Wait for 1 minute to load completely
    await newPage.waitForTimeout(60000);
    await shot(newPage, '10-demo-report-loaded.png');
    await newPage.close();
    console.log('✅ Test completed successfully');
  });
});
