import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe.serial('AIV Reports - Shared Suffix Schedule Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_suffix_yyyy-dd-MM', async ({ page }) => {
    // Set timeout to 5 minutes
    test.setTimeout(300000);

    // Step 1: Navigate directly to the Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Reports');

    // Step 2: Find 'Order details AutoTest' and double-click to open scheduler
    console.log('👉 Step 2: Finding Order details AutoTest...');
    const reportRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order details AutoTest' }).first();
    await expect(reportRow).toBeVisible({ timeout: 15000 });
    await reportRow.dblclick();
    await page.waitForTimeout(2000);

    const schedulerDialog = page.locator('[role="dialog"]:visible').first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });

    // Step 3: Switch to Schedule tab and select Once radio button
    console.log('👉 Step 3: Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(1000);

    console.log('👉 Selecting Once radio button...');
    const onceRadio = schedulerDialog.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);

    // Step 4: Set Start Time after 1.5 min (2 mins safe) from now
    console.log('👉 Setting Start Time as 2 minutes from now (rollover-safe)...');
    const calendarIcon = schedulerDialog.locator('button.p-datepicker-trigger, button.ui-datepicker-trigger').first();
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
    await shot(page, '03-schedule-once.png');

    // Step 5: Go to Output tab
    console.log('👉 Step 5: Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 6: Change name to OD suffix
    console.log('👉 Step 6: Setting Output Name to OD suffix...');
    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('OD suffix');
    await page.waitForTimeout(1000);
    await shot(page, '04-output-name-configured.png');

    // Step 7: Select yyyy-dd-MM in Suffix dropdown
    console.log('👉 Step 7: Selecting yyyy-dd-MM in Suffix dropdown...');
    const suffixDropdown = schedulerDialog.locator('p-dropdown[name="outputsuffix"]').first();
    await suffixDropdown.click();
    await page.waitForTimeout(1000);

    const suffixOption = page.locator('.p-dropdown-item, [role="option"], li').filter({ hasText: 'yyyy-dd-MM' }).first();
    await expect(suffixOption).toBeVisible({ timeout: 5000 });
    await suffixOption.click();
    await page.waitForTimeout(1000);
    await shot(page, '05-suffix-selected.png');

    // Step 8: Click Home icon and wait 8 seconds
    console.log('👉 Step 8: Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 8 seconds for Select Folder dialog to load...');
    await page.waitForTimeout(8000);

    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });
    await shot(page, '06-select-folder-dialog.png');

    // Step 9: Search for Neel in Select Folder search input
    console.log('👉 Step 9: Searching for "Neel" folder...');
    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Neel');
    await page.waitForTimeout(2000);

    // Helper function to expand tree nodes dynamically only if they are collapsed
    const expandNodeIfNeeded = async (nodeName: string) => {
      console.log(`👉 Checking node "${nodeName}"...`);
      // Find the specific label to avoid parent-child text matching collisions
      const label = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: new RegExp('^' + nodeName + '$') }).first();
      await expect(label).toBeVisible({ timeout: 10000 });

      const nodeRow = label.locator('xpath=ancestor::div[contains(@class, "mat-tree-node") or contains(@class, "tree-node")][1]');
      await expect(nodeRow).toBeVisible({ timeout: 5000 });

      // Check the toggle icon direction (fa-chevron-right means collapsed, fa-chevron-down means expanded)
      const chevron = nodeRow.locator('i.lbl_icon, i, [class*="chevron"]').first();
      const isCollapsed = await chevron.evaluate(el => {
        const cls = el.getAttribute('class') || '';
        return cls.includes('right') || cls.includes('collapsed') || el.classList.contains('fa-chevron-right');
      });

      console.log(`Node "${nodeName}" collapsed status: ${isCollapsed}`);
      if (isCollapsed) {
        console.log(`👉 Node "${nodeName}" is collapsed. Clicking toggle button...`);
        const toggleBtn = nodeRow.locator('button').first();
        await toggleBtn.click();
        await page.waitForTimeout(1500);
      } else {
        console.log(`👉 Node "${nodeName}" is already expanded.`);
      }
    };

    // Step 10: Expand Root first, then Neel folder
    await expandNodeIfNeeded('Root');
    await expandNodeIfNeeded('Neel');
    await shot(page, '07-neel-folder-expanded.png');

    // Step 11: Select 'Reports with Suffix' folder item
    console.log('👉 Step 11: Selecting "Reports with Suffix" folder...');
    const reportsWithSuffixFolder = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Reports with Suffix' }).first();
    await expect(reportsWithSuffixFolder).toBeVisible({ timeout: 10000 });
    await reportsWithSuffixFolder.click();
    await page.waitForTimeout(1000);
    await shot(page, '08-reports-with-suffix-selected.png');

    // Step 12: Click Submit inside Select Folder dialog
    console.log('👉 Step 12: Clicking Submit to select path...');
    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, '09-folder-dialog-submitted.png');

    // Step 13: Click Run inside scheduler dialog
    console.log('👉 Step 13: Clicking Run button...');
    const runBtn = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await expect(runBtn).toBeVisible({ timeout: 5000 });
    await runBtn.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog).not.toBeVisible({ timeout: 15000 }).catch(() => { });
    await shot(page, '10-run-clicked.png');

    // Step 14: Navigate to Requests section
    console.log('👉 Step 14: Navigating to Requests...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);

    // Step 15: Click Schedule tab and apply Date Filter
    console.log('👉 Step 15: Selecting Schedule tab and setting Date Filter...');
    const requestsScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestsScheduleTab.click();
    await page.waitForTimeout(1000);

    // Apply date range filter to cover timezone offsets
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
      console.log('👉 Setting date filter value to include July 5 - July 8...');
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
    await shot(page, '11-schedule-requests.png');

    // Step 16: Wait for 1.4 minutes (84 seconds) for schedule to trigger
    console.log('👉 Step 16: Waiting 84 seconds (1.4 minutes) for schedule to trigger...');
    await page.waitForTimeout(84000);

    // Step 17: Go back to Reports section
    console.log('👉 Step 17: Going back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    // Step 18: Search for 'Neel' folder
    console.log('👉 Step 18: Searching for "Neel" folder...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.clear();
    await gridSearchInput.fill('Neel');
    await page.waitForTimeout(2000);
    await shot(page, '12-neel-folder-searched.png');

    // Step 19: Double click on Neel folder
    console.log('👉 Step 19: Opening Neel folder...');
    const neelFolderRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Neel' }).first();
    await expect(neelFolderRow).toBeVisible({ timeout: 15000 });
    await neelFolderRow.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '13-neel-folder-opened.png');

    // Step 20: Double click on Reports with Suffix folder
    console.log('👉 Step 20: Opening Reports with Suffix folder...');
    const reportsWithSuffixFolderRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Reports with Suffix' }).first();
    await expect(reportsWithSuffixFolderRow).toBeVisible({ timeout: 15000 });
    await reportsWithSuffixFolderRow.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '14-reports-with-suffix-opened.png');

    // Step 21: Verify suffix file is present
    console.log('👉 Step 21: Verifying suffix file is present...');
    const suffixFile = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'OD suffix' }).first();
    await expect(suffixFile).toBeVisible({ timeout: 30000 }); // allow extra time for file generation
    await suffixFile.click();
    await page.waitForTimeout(1000);
    await shot(page, '15-suffix-file-verified.png');

    console.log('✅ reports_suffix completed successfully');
  });
});
