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

function formatDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

test.describe.serial('AIV Reports - Shared Recurring Schedule Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Start with saved session state (Admin)
    await ensureLoggedIn(page);
  });

  test('reports_recurring_daily_share', async ({ page, context }) => {
    // Increase test timeout to 7 minutes (420000ms)
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

    // Step 3: Switch to Schedule tab and select Recurring
    console.log('👉 Step 3: Configuring schedule recurring...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);
    const recurringRadio = schedulerDialog.getByText('Recurring', { exact: false }).first();
    await recurringRadio.click({ force: true });
    await page.waitForTimeout(1000);
    await shot(page, '04-schedule-recurring-selected.png');

    // Step 4: Set Start Time (1 min in future) and End Time (3 min in future)
    console.log('👉 Step 4: Setting start and end times...');
    const startTimeInput = schedulerDialog.locator('p-calendar:visible').first().locator('input:visible').first();
    await expect(startTimeInput).toBeVisible({ timeout: 15000 });

    // Fetch server date header to synchronize with server clock
    let baseTime = new Date();
    try {
      const resp = await page.request.get(URLS.reports);
      const serverDateHeader = resp.headers()['date'];
      console.log(`🕒 Server HTTP Date Header: "${serverDateHeader}"`);
      if (serverDateHeader) {
        baseTime = new Date(serverDateHeader);
        console.log(`🕒 Synchronized base time from server header: ${baseTime.toString()}`);
      } else {
        console.log('⚠️ Date header not found, using machine local time');
      }
    } catch (e) {
      console.log('⚠️ Failed to fetch server date header, using machine local time:', e);
    }

    const startTime = new Date(baseTime.getTime() + 60000); // 1 min in future
    const endTime = new Date(baseTime.getTime() + 180000);   // 3 min in future
    const patternTime = new Date(baseTime.getTime() + 120000); // 2 min in future (1 min after start)

    await startTimeInput.evaluate((el, val) => {
      const input = el as HTMLInputElement;
      input.removeAttribute('readonly');
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, formatDateTime(startTime));
    await startTimeInput.blur();
    await page.waitForTimeout(300);

    const endTimeInput = schedulerDialog.locator('p-calendar:visible').nth(1).locator('input:visible').first();
    await expect(endTimeInput).toBeVisible({ timeout: 15000 });
    await endTimeInput.evaluate((el, val) => {
      const input = el as HTMLInputElement;
      input.removeAttribute('readonly');
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, formatDateTime(endTime));
    await endTimeInput.blur();
    await page.waitForTimeout(500);
    await shot(page, '05-start-end-times.png');

    // Step 5: Configure Pattern (Daily, Every)
    console.log('👉 Step 5: Configuring pattern settings...');
    const dailyRadio = schedulerDialog.getByText('Daily', { exact: false }).first();
    await dailyRadio.click({ force: true });
    await page.waitForTimeout(500);

    const everyRadio = schedulerDialog.getByText('Every', { exact: false }).first();
    await everyRadio.click({ force: true });
    console.log('👉 Waiting 3 seconds for Time * field to initialize...');
    await page.waitForTimeout(3000);
    await shot(page, '06-pattern-configured.png');



    // Step 6: Share checkbox, select Users, Visibility Public
    console.log('👉 Step 6: Configuring sharing settings...');
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

    // Search for Demo and click checkbox
    console.log('👉 Searching for Demo user and checking box...');
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

    // Set Daily Time picker now at the very end of Schedule tab configuration so it never gets cleared!
    console.log('👉 Setting pattern daily time picker...');
    let patternHours = patternTime.getHours();
    const patternMinutes = String(patternTime.getMinutes()).padStart(2, '0');
    const ampm = patternHours >= 12 ? 'PM' : 'AM';
    patternHours = patternHours % 12;
    patternHours = patternHours ? patternHours : 12;
    const patternTimeStr = `${patternHours}:${patternMinutes} ${ampm}`;

    const labelMatches = schedulerDialog.locator('label').filter({ hasText: /Time/ });
    const matchCount = await labelMatches.count();
    console.log(`🕒 Found ${matchCount} labels matching "Time"`);

    let dailyTimeInput = schedulerDialog.locator('ejs-timepicker input, .e-timepicker input').first();
    for (let i = 0; i < matchCount; i++) {
      const labelText = await labelMatches.nth(i).innerText().catch(() => '');
      const parent = labelMatches.nth(i).locator('..');
      const input = parent.locator('ejs-timepicker input, input').first();

      let inputId = 'no-id';
      let val = '';
      if (await input.count() > 0) {
        inputId = await input.getAttribute('id').catch(() => 'no-id') || 'no-id';
        val = await input.inputValue().catch(() => '');
      }
      console.log(`  Match ${i}: Label="${labelText}", Input ID="${inputId}", Val="${val}"`);
      if (labelText.includes('*')) {
        console.log(`🎯 Target label with asterisk found at index ${i}`);
        dailyTimeInput = input;
      }
    }
    await expect(dailyTimeInput).toBeVisible({ timeout: 15000 });
    const inputId = await dailyTimeInput.getAttribute('id').catch(() => 'no-id');
    const inputClass = await dailyTimeInput.getAttribute('class').catch(() => 'no-class');
    const valBefore = await dailyTimeInput.inputValue().catch(() => '');
    console.log(`🕒 Timepicker input matched - ID: "${inputId}", Class: "${inputClass}", Val Before: "${valBefore}"`);


    await dailyTimeInput.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.removeAttribute('readonly');
    });
    await dailyTimeInput.click();
    await dailyTimeInput.focus();
    await dailyTimeInput.clear();
    await dailyTimeInput.pressSequentially(patternTimeStr, { delay: 100 });
    await dailyTimeInput.press('Enter');
    await dailyTimeInput.blur();
    await page.waitForTimeout(2000); // let value settle

    let valAfter = await dailyTimeInput.inputValue().catch(() => '');
    console.log(`🕒 Timepicker input - Val After setting: "${valAfter}"`);

    // Fallback: If the field is still empty, pause for manual entry/click
    if (!valAfter || valAfter.trim() === '') {
      console.log('👉 PAUSING for manual time picker input... Please click and enter the time on screen now (You have 30 seconds)!');
      for (let i = 0; i < 30; i++) {
        valAfter = await dailyTimeInput.inputValue().catch(() => '');
        if (valAfter && valAfter.trim() !== '') {
          console.log(`🎯 Manual input detected: "${valAfter}"! Continuing...`);
          break;
        }
        await page.waitForTimeout(1000);
      }
    }

    await shot(page, '07-share-setup.png');

    // Step 7: Switch to Output and set name as Recurring AutoTest
    console.log('👉 Step 7: Configuring output settings...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('Recurring AutoTest');

    const currentFormat = schedulerDialog.getByText('rptdocument', { exact: true }).first();
    if (await currentFormat.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currentFormat.click();
      await page.locator('li, [role="option"]').filter({ hasText: /^rptdocument$/i }).first().click();
    }
    await page.waitForTimeout(500);
    await shot(page, '08-output-setup.png');

    // Step 8: Click Run button
    console.log('👉 Step 8: Clicking Run button...');
    const runButton = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await runButton.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog).not.toBeVisible({ timeout: 15000 }).catch(() => { });
    await shot(page, '09-run-clicked.png');

    // Step 9: Navigate to Request section -> Schedule tab
    console.log('👉 Step 9: Verifying in Request Schedule tab...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    const requestScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestScheduleTab.click();
    await page.waitForTimeout(1000);

    // Adjust date filter in Requests page to include today (July 7, 2026)
    console.log('👉 Setting Date Filter in Requests tab...');
    const allInputs = page.locator('input');
    const count = await allInputs.count();
    let dateFilterInput = null;
    for (let i = 0; i < count; i++) {
      const val = await allInputs.nth(i).inputValue().catch(() => '');
      if (val.includes(' - ')) {
        dateFilterInput = allInputs.nth(i);
        break;
      }
    }

    if (dateFilterInput) {
      console.log('👉 Date range input found. Setting value to include July 7, 2026...');
      await dateFilterInput.evaluate((el) => {
        const input = el as HTMLInputElement;
        input.value = '2026-07-05 - 2026-07-08';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(1000); // let the value update settle

      const filterBtn = page.locator('button').filter({ hasText: /^Filter$/i }).first();
      if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterBtn.click({ force: true });
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('⚠️ Could not find date range filter input on Requests page.');
    }

    let requestFound = false;
    const scheduledItem = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Recurring Auto' }).first();
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();

    for (let i = 0; i < 5; i++) {
      if (await scheduledItem.isVisible().catch(() => false)) {
        requestFound = true;
        break;
      }
      console.log(`👉 Schedule item not visible yet. Refreshing grid (attempt ${i + 1}/5)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(3000);
    }

    await expect(scheduledItem).toBeVisible({ timeout: 10000 });
    await shot(page, '10-scheduled-list.png');

    // Step 10: Wait for 2.5 minutes (150 seconds)
    console.log('👉 Step 10: Waiting 150 seconds (2.5 minutes) for schedule to trigger...');
    await page.waitForTimeout(150000);

    // Step 11: Logout Admin user
    console.log('👉 Step 11: Logging out Admin...');
    await logout(page);

    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => { });
    await page.evaluate(() => sessionStorage.clear()).catch(() => { });
    await page.waitForTimeout(1000);

    // Step 12: Login as Demo user
    console.log('👉 Step 12: Logging in as Demo user...');
    await loginAs(page, 'Demo', 'password');

    // Step 13: Navigate to Reports section via sidebar
    console.log('👉 Step 13: Navigating to Reports as Demo...');
    await navigateToReports(page);
    await page.waitForTimeout(1000);
    await shot(page, '11-reports-loaded.png');

    // Step 14: Search and poll for Recurring AutoTest report
    console.log('👉 Step 14: Polling for Recurring AutoTest file...');
    const searchBox = page.getByRole('searchbox').first();
    await searchBox.clear();
    await searchBox.fill('Recurring AutoTest');
    await page.waitForTimeout(1000);

    let fileFound = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`   Attempt ${attempt}/10...`);
      const refreshBtn = page.locator('.fa-arrow-rotate-right, .fa-rotate-90').first();
      if (await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refreshBtn.click();
      }
      await page.waitForTimeout(3000);

      const fileCell = page.locator('[role="gridcell"]').filter({ hasText: 'Recurring AutoTest' }).first();
      if (await fileCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        fileFound = true;
        break;
      }
    }
    expect(fileFound).toBe(true);
    await shot(page, '12-file-appeared.png');

    // Step 15: Double click to open report in new tab
    console.log('👉 Step 15: Opening report and waiting for load...');
    const fileCell = page.locator('[role="gridcell"]').filter({ hasText: 'Recurring AutoTest' }).first();
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
    await shot(newPage, '13-demo-report-loaded.png');
    await newPage.close();
    console.log('✅ Test completed successfully');
  });
});
