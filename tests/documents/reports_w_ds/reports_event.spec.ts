import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe.serial('AIV Reports - Shared Event Schedule Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_event', async ({ page }) => {
    // Set timeout to 5 minutes
    test.setTimeout(300000);

    // Generate unique event number based on 0707 + 4 random digits
    const eventNumber = '0707' + Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`🎲 Generated unique Event Number for this run: ${eventNumber}`);

    // Step 1: Navigate directly to the Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await shot(page, '02-reports-page.png');
    await assertPageLoaded(page, 'Reports');

    // Step 2: Find 'Order details AutoTest' and double-click to open scheduler
    console.log('👉 Step 2: Finding Order details AutoTest...');
    const reportRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order details AutoTest' }).first();
    await expect(reportRow).toBeVisible({ timeout: 15000 });
    await reportRow.dblclick();
    await page.waitForTimeout(2000);

    const schedulerDialog = page.locator('[role="dialog"]:visible').first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });
    await shot(page, '03-scheduler-open.png');

    // Step 3: Switch to Schedule tab
    console.log('👉 Step 3: Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(1000);

    // Select Event in Schedule Type dropdown
    console.log('👉 Selecting Event in Schedule Type dropdown...');
    const scheduleTypeDropdown = schedulerDialog.locator('p-dropdown[name="scheduleType"], p-dropdown[formcontrolname="scheduleType"], p-dropdown').first();
    await scheduleTypeDropdown.click();
    await page.waitForTimeout(500);
    
    const eventOption = page.locator('.p-dropdown-item, [role="option"], li').filter({ hasText: 'Event' }).first();
    await expect(eventOption).toBeVisible({ timeout: 5000 });
    await eventOption.click();
    await page.waitForTimeout(1000);
    await shot(page, '04-event-schedule-type.png');

    // Step 4: Click the + icon next to Trigger On Events
    console.log('👉 Clicking + icon next to Trigger On Events...');
    const plusBtn = schedulerDialog.locator('a.tg_event_icon_add, .tg_event_icon_add').first();
    await expect(plusBtn).toBeVisible({ timeout: 15000 });
    await plusBtn.click();
    await page.waitForTimeout(2000);

    // Locate the "Create Manage Event" dialog
    const eventDialog = page.locator('.modal-content, [role="dialog"]').filter({ hasText: /Create Manage Event/i }).first();
    await expect(eventDialog).toBeVisible({ timeout: 15000 });

    // Fill Event Number, Event Type, and clear Event Description
    console.log('👉 Filling Event details...');
    const eventNumberInput = eventDialog.locator('input[placeholder*="Event Number"i], input[formcontrolname*="eventNumber"i], input').first();
    await eventNumberInput.fill(eventNumber);

    const eventTypeInput = eventDialog.locator('input[placeholder*="Event Type"i], input[formcontrolname*="eventType"i]').first()
      .or(eventDialog.locator('input').nth(1));
    await eventTypeInput.fill('Event Report');

    const eventDescInput = eventDialog.locator('textarea[formcontrolname*="description"i], input[formcontrolname*="description"i]').first()
      .or(eventDialog.locator('input').nth(2));
    await eventDescInput.clear();

    await shot(page, '05-create-event-dialog.png');

    // Check Event Mail checkbox
    console.log('👉 Checking Event Mail checkbox...');
    const eventMailCheckbox = eventDialog.locator('p-checkbox[formcontrolname*="eventMail"i] .p-checkbox-box, p-checkbox .p-checkbox-box').first();
    await eventMailCheckbox.click();
    await page.waitForTimeout(1000);

    // Select Demo and Neel in Users multiselect dropdown
    console.log('👉 Selecting Users...');
    const usersDropdown = eventDialog.locator('p-multiselect, .p-multiselect').first();
    await usersDropdown.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('.p-multiselect-filter-container input, .p-multiselect-panel input[type="text"]').first();
    
    // Select Demo
    await searchInput.fill('Demo');
    await page.waitForTimeout(500);
    const demoCheckbox = page.locator('.p-multiselect-items .p-multiselect-item').filter({ hasText: /^Demo$/ }).locator('.p-checkbox-box').first();
    await demoCheckbox.click();
    await page.waitForTimeout(300);

    // Select Neel
    await searchInput.clear();
    await searchInput.fill('Neel');
    await page.waitForTimeout(500);
    const neelCheckbox = page.locator('.p-multiselect-items .p-multiselect-item').filter({ hasText: /^Neel$/ }).locator('.p-checkbox-box').first();
    await neelCheckbox.click();
    await page.waitForTimeout(300);

    // Close multiselect
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Enter email neel@aivhub.com
    console.log('👉 Entering email...');
    const emailInput = eventDialog.locator('p-chips input').first();
    await emailInput.fill('neel@aivhub.com');
    await emailInput.press('Enter');
    await page.waitForTimeout(1000);
    await shot(page, '06-users-emails-configured.png');

    // Select Success in Email Template dropdown
    console.log('👉 Selecting Email Template...');
    const templateDropdown = eventDialog.locator('p-dropdown[formcontrolname*="template"i], p-dropdown').first();
    await templateDropdown.click();
    await page.waitForTimeout(500);

    const successOption = page.locator('.p-dropdown-item, [role="option"], li').filter({ hasText: 'Success' }).first();
    await successOption.click();
    await page.waitForTimeout(1000);
    await shot(page, '07-email-template-selected.png');

    // Wait for 8 seconds
    console.log('👉 Waiting 8 seconds...');
    await page.waitForTimeout(8000);

    // Click Submit
    console.log('👉 Clicking Submit...');
    const submitBtn = eventDialog.locator('button').filter({ hasText: /^Submit$/i }).first();
    await submitBtn.click();

    // Wait for 10 seconds
    console.log('👉 Waiting 10 seconds...');
    await page.waitForTimeout(10000);

    // Verify back at scheduler dialog, select Trigger On Events dropdown
    console.log('👉 Verifying created event in Trigger On Events dropdown...');
    const triggerDropdown = schedulerDialog.locator('p-dropdown').nth(1);
    await triggerDropdown.click();
    await page.waitForTimeout(1000);

    // Locate our event item, scroll to it
    const createdEventItem = page.locator('.p-dropdown-item').filter({ hasText: eventNumber }).first();
    await createdEventItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await shot(page, '08-event-created-in-dropdown.png');

    // Select the event from Trigger On Events dropdown
    console.log('👉 Selecting Event from Trigger On Events dropdown...');
    await createdEventItem.click();
    await page.waitForTimeout(1000);
    await shot(page, '09-event-selected-in-dropdown.png');

    // Switch to Output tab
    console.log('👉 Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Edit Name to OD Event AutoTest
    console.log('👉 Setting Output Name to OD Event AutoTest...');
    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('OD Event AutoTest');
    await page.waitForTimeout(1000);
    await shot(page, '10-output-tab-configured.png');

    // Click Run button
    console.log('👉 Clicking Run button...');
    const runButton = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await runButton.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog).not.toBeVisible({ timeout: 15000 }).catch(() => { });

    // Navigate to Request section
    console.log('👉 Navigating to Requests section...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);

    // Go to Waiting For Event tab
    console.log('👉 Clicking Waiting For Event tab...');
    const waitingForEventTab = page.locator('[role="tab"], li').filter({ hasText: /Waiting For Event/i }).first();
    await waitingForEventTab.click();
    await page.waitForTimeout(2000);

    // Locate OD Event AutoTest row and click it
    console.log('👉 Clicking on OD Event AutoTest in Waiting For Event list...');
    const eventRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'OD Event AutoTest' }).first();
    await expect(eventRow).toBeVisible({ timeout: 15000 });
    await eventRow.click();
    await page.waitForTimeout(1000);
    await shot(page, '11-waiting-for-event-clicked.png');

    console.log('✅ Part 2 completed successfully');

    // ── Part 3 ────────────────────────────────────────────────────────────────
    console.log('👉 Step 3: Navigating back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    console.log('👉 Searching for "Top 5 customers for Event"...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.fill('Top 5 customers for Event');
    await page.waitForTimeout(2000);
    await shot(page, '12-search-report.png');

    console.log('👉 Double clicking on Top 5 customers for Event...');
    const reportRow2 = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Top 5 customers for Event' }).first();
    await expect(reportRow2).toBeVisible({ timeout: 15000 });
    await reportRow2.dblclick();
    await page.waitForTimeout(2000);

    const schedulerDialog2 = page.locator('[role="dialog"]:visible').first();
    await expect(schedulerDialog2).toBeVisible({ timeout: 15000 });
    await shot(page, '13-scheduler-open-top5.png');

    console.log('👉 Switching to Schedule tab...');
    const scheduleTab2 = schedulerDialog2.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab2.click();
    await page.waitForTimeout(1000);
    await shot(page, '14-schedule-tab-top5.png');

    console.log('👉 Selecting Once radio button...');
    const onceRadio = schedulerDialog2.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('👉 Setting Start Time as 2 minutes from now (rollover-safe)...');
    const calendarIcon = schedulerDialog2.locator('button.p-datepicker-trigger, button.ui-datepicker-trigger').first();
    await calendarIcon.click();
    await page.waitForTimeout(1000);

    const minSpan = page.locator('.p-minute-picker span, .ui-minute-picker span').first();
    await expect(minSpan).toBeVisible({ timeout: 5000 });
    const currentMin = parseInt((await minSpan.textContent() || '0').trim());
    console.log(`🕒 Time picker current minute: ${currentMin}`);

    const hrUpButton = page.locator('.p-hour-picker button, .ui-hour-picker button, .p-hour-picker .pi-chevron-up').first();
    const minUpButton = page.locator('.p-minute-picker button, .ui-minute-picker button, .p-minute-picker .pi-chevron-up').first();

    if (currentMin >= 58) {
      console.log('👉 Minute is close to hour end. Incrementing Hour up once and Minute up twice.');
      await hrUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
    } else {
      await minUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
    }
    await page.waitForTimeout(500);

    const activeDay = page.locator('.p-datepicker-calendar .p-highlight, .ui-datepicker-calendar .ui-state-active').first();
    if (await activeDay.isVisible().catch(() => false)) {
      await activeDay.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1000);
    await shot(page, '15-start-time-set.png');

    console.log('👉 Switching to Output tab...');
    const outputTab2 = schedulerDialog2.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab2.click();
    await page.waitForTimeout(1000);

    console.log('👉 Setting Output Name to Customers for Event...');
    const outputNameInput2 = schedulerDialog2.locator('input[name="soutputname"]').first();
    await outputNameInput2.clear();
    await outputNameInput2.fill('Customers for Event');
    await page.waitForTimeout(1000);
    await shot(page, '16-customers-for-event-output.png');

    console.log('👉 Selecting Event on Success dropdown...');
    const successDropdown = schedulerDialog2.locator('p-dropdown[name="successid"]').first();
    await successDropdown.click();
    await page.waitForTimeout(1000);

    const successEventItem = page.locator('.p-dropdown-item').filter({ hasText: eventNumber }).first();
    await successEventItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await shot(page, '17-success-event-selected.png');
    await successEventItem.click();
    await page.waitForTimeout(1000);

    console.log('👉 Selecting Event on Fail dropdown...');
    const failDropdown = schedulerDialog2.locator('p-dropdown[name="failid"]').first();
    await failDropdown.click();
    await page.waitForTimeout(1000);

    const failEventItem = page.locator('.p-dropdown-item').filter({ hasText: eventNumber }).first();
    await failEventItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await shot(page, '18-fail-event-selected.png');
    await failEventItem.click();
    await page.waitForTimeout(1000);

    console.log('👉 Waiting 5 seconds before Run...');
    await page.waitForTimeout(5000);

    console.log('👉 Clicking Run button...');
    const runBtn2 = schedulerDialog2.getByRole('button', { name: /run/i }).first();
    await runBtn2.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog2).not.toBeVisible({ timeout: 15000 }).catch(() => { });

    console.log('👉 Navigating back to Requests section...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);

    console.log('👉 Clicking Schedule tab...');
    const requestsScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestsScheduleTab.click();
    await page.waitForTimeout(1000);

    // Apply date range filter to cover timezone offsets
    console.log('👉 Setting Date Filter in Requests tab...');
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let dateFilterInput = null;
    for (let i = 0; i < inputCount; i++) {
      const val = await allInputs.nth(i).inputValue().catch(() => '');
      if (val.includes(' - ')) {
        dateFilterInput = allInputs.nth(i);
        break;
      }
    }

    if (dateFilterInput) {
      console.log('👉 Date range input found. Setting value to include July 5 - July 8...');
      await dateFilterInput.evaluate((el) => {
        const input = el as HTMLInputElement;
        input.value = '2026-07-05 - 2026-07-08';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(1000);

      const filterBtn = page.locator('button').filter({ hasText: /^Filter$/i }).first();
      if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterBtn.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '19-schedule-requests.png');

    console.log('👉 Waiting 1.3 minutes (78 seconds) for schedule to trigger...');
    await page.waitForTimeout(78000);

    console.log('👉 Clicking Refresh button on top nav bars...');
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await shot(page, '20-refreshed-requests.png');

    console.log('👉 Clicking Completed tab...');
    const completedTab = page.locator('[role="tab"], li').filter({ hasText: /Completed/i }).first();
    await completedTab.click();
    await page.waitForTimeout(2000);

    console.log('👉 Scrolling to bottom and waiting 5 seconds...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(5000);
    await shot(page, '21-completed-list-bottom.png');

    console.log('👉 Verifying OD Event AutoTest and Customers for Event completed files...');
    const completedItem1 = page.locator('[role="gridcell"], td, .e-rowcell, [class*="name"]').filter({ hasText: 'OD Event AutoTest' }).first();
    const completedItem2 = page.locator('[role="gridcell"], td, .e-rowcell, [class*="name"]').filter({ hasText: 'Customers for Event' }).first();

    let bothFound = false;
    for (let i = 0; i < 6; i++) {
      const isItem1Visible = await completedItem1.isVisible().catch(() => false);
      const isItem2Visible = await completedItem2.isVisible().catch(() => false);
      if (isItem1Visible && isItem2Visible) {
        bothFound = true;
        break;
      }
      console.log(`👉 Completed files not both visible yet. Refreshing grid (attempt ${i + 1}/6)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(5000);
    }

    await expect(completedItem1).toBeVisible({ timeout: 15000 });
    await expect(completedItem2).toBeVisible({ timeout: 15000 });
    await completedItem1.scrollIntoViewIfNeeded().catch(() => {});
    await completedItem2.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1000);
    await shot(page, '22-events-completed-verification.png');

    console.log('✅ Part 3 completed successfully');
  });
});
