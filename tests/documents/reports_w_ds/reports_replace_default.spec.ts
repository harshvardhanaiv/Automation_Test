import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe.serial('AIV Reports - Replace Default Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_replace_default', async ({ page }) => {
    // Set timeout to 5 minutes
    test.setTimeout(300000);

    // Step 1: Navigate directly to the Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Reports');

    // Step 2: Find 'Order details AutoTest' and double-click to open scheduler
    console.log('👉 Step 2: Finding Order details AutoTest...');
    const reportRow = page.locator('tr, .e-row').filter({
      has: page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order details AutoTest' }),
      hasText: 'rptdesign'
    }).first();
    await expect(reportRow).toBeVisible({ timeout: 15000 });
    await reportRow.dblclick();
    await page.waitForTimeout(2000);

    const schedulerDialog = page.locator('[role="dialog"]:visible').first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });

    // Step 3: Switch to Parameter tab, wait 4 seconds
    console.log('👉 Step 3: Switching to Parameter tab...');
    const parameterTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    await parameterTab.click();
    await page.waitForTimeout(4000);
    await shot(page, '03-parameter-tab.png');

    // Step 4: Switch to Schedule tab
    console.log('👉 Step 4: Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(1000);
    await shot(page, '04-schedule-tab.png');

    // Step 5: Switch to Output tab
    console.log('👉 Step 5: Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 6: Click Home icon next to Path and wait 5 seconds
    console.log('👉 Step 6: Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 5 seconds for Select Folder dialog to load...');
    await page.waitForTimeout(5000);

    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });

    // Step 7: Search for Reports Version in Select Folder search input
    console.log('👉 Step 7: Searching for "Reports Version" folder...');
    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Reports Version');
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

    // Step 8: Expand Root first, then Neel folder
    await expandNodeIfNeeded('Root');
    await expandNodeIfNeeded('Neel');

    // Step 9: Select 'Reports Version' folder item
    console.log('👉 Step 9: Selecting "Reports Version" folder...');
    const reportsVersionFolder = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Reports Version' }).first();
    await expect(reportsVersionFolder).toBeVisible({ timeout: 10000 });
    await reportsVersionFolder.click();
    await page.waitForTimeout(1000);
    await shot(page, '05-reports-version-selected.png');

    // Step 10: Click Submit inside Select Folder dialog
    console.log('👉 Step 10: Clicking Submit to select path...');
    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, '06-path-configured.png');

    // Step 11: Click Run inside scheduler dialog and wait for new tab
    console.log('👉 Step 11: Clicking Run button and waiting for new page/tab...');
    const runBtn = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await expect(runBtn).toBeVisible({ timeout: 5000 });

    const newPagePromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);

    await runBtn.click();

    const newTabPage = await newPagePromise;
    await page.waitForTimeout(2000);

    if (newTabPage !== page) {
      console.log('👉 New tab opened. Waiting 15 seconds...');
      await newTabPage.waitForLoadState().catch(() => {});
      await page.waitForTimeout(15000);
      
      if (!newTabPage.isClosed()) {
        await shot(newTabPage, '07-new-tab-opened.png').catch(() => {});
        console.log('👉 Closing execution tab to return focus to main page...');
        await newTabPage.close().catch(() => {});
      } else {
        await shot(page, '07-new-tab-opened.png');
      }
    } else {
      await shot(page, '07-new-tab-opened.png');
    }

    // Step 13: Go back to Reports section
    console.log('👉 Step 13: Going back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    // Step 14: Search for 'Neel' folder
    console.log('👉 Step 14: Searching for "Neel" folder...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.clear();
    await gridSearchInput.fill('Neel');
    await page.waitForTimeout(2000);

    // Step 15: Double click on Neel folder
    console.log('👉 Step 15: Opening Neel folder...');
    const neelFolderRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Neel' }).first();
    await expect(neelFolderRow).toBeVisible({ timeout: 15000 });
    await neelFolderRow.dblclick();
    await page.waitForTimeout(2000);

    // Clear search filter to reveal subfolders
    console.log('👉 Clearing grid search filter...');
    await gridSearchInput.clear();
    await gridSearchInput.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Step 16: Search for 'Reports Version' folder
    console.log('👉 Step 16: Searching for "Reports Version" folder...');
    await gridSearchInput.clear();
    await gridSearchInput.fill('Reports Version');
    await page.waitForTimeout(2000);

    // Step 17: Double click on Reports Version folder
    console.log('👉 Step 17: Opening Reports Version folder...');
    const reportsVersionFolderRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Reports Version' }).first();
    await expect(reportsVersionFolderRow).toBeVisible({ timeout: 15000 });
    await reportsVersionFolderRow.dblclick();
    await page.waitForTimeout(2000);

    // Clear search filter to reveal files
    console.log('👉 Clearing grid search filter...');
    await gridSearchInput.clear();
    await gridSearchInput.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Step 18: Verify replaced default file is present (with polling refresh loop)
    console.log('👉 Step 18: Verifying replaced default file is present...');
    const defaultFile = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order details AutoTest' }).first();
    
    let fileFound = false;
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    for (let i = 0; i < 6; i++) {
      if (await defaultFile.isVisible().catch(() => false)) {
        fileFound = true;
        break;
      }
      console.log(`👉 file not visible yet. Refreshing grid (attempt ${i + 1}/6)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(5000);
    }

    await expect(defaultFile).toBeVisible({ timeout: 15000 });
    await defaultFile.click();
    await page.waitForTimeout(1000);
    await shot(page, '08-replace-default-verified.png');

    // Part 2: Right-click on the report file to open the context menu
    console.log('👉 Part 2: Right-clicking on the report file...');
    await defaultFile.click({ button: 'right' });
    await page.waitForTimeout(1500);
    await shot(page, '09-context-menu-open.png');

    // Click on Version in the context menu
    console.log('👉 Clicking on Version option...');
    const versionOption = page.locator('.p-contextmenu-root-list .p-menuitem, .p-menuitem, li, a, .p-menuitem-text').filter({ hasText: /^Version$/ }).first();
    await expect(versionOption).toBeVisible({ timeout: 5000 });
    await versionOption.click();
    await page.waitForTimeout(3000);

    // Assert Version dialog is visible
    const versionDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Manage file versions/i }).first();
    await expect(versionDialog).toBeVisible({ timeout: 15000 });
    await shot(page, '10-version-dialog-default.png');

    // Scroll table inside Version dialog horizontally
    console.log('👉 Scrolling table inside Version dialog horizontally...');
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], p-dialog');
      if (dialog) {
        const wrappers = dialog.querySelectorAll('.p-datatable-wrapper, .ui-table-scrollable-body, .p-dialog-content, div');
        for (const w of Array.from(wrappers)) {
          if (w.scrollWidth > w.clientWidth) {
            w.scrollLeft = 1000;
          }
        }
      }
    }).catch((e) => console.log('Scroll error:', e));
    await page.waitForTimeout(2000);
    await shot(page, '11-version-dialog-scrolled.png');

    // Close Version dialog
    console.log('👉 Closing Version dialog...');
    const closeBtn = versionDialog.locator('button.p-dialog-header-close, .pi-times, [class*="close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }

    // Part 3: Go back to Reports root and run report with parameters and Replace Default unchecked
    console.log('👉 Part 3: Navigating to Reports root...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    console.log('👉 Part 3: Finding Order details AutoTest rptdesign...');
    const reportRow2 = page.locator('tr, .e-row').filter({
      has: page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order details AutoTest' }),
      hasText: 'rptdesign'
    }).first();
    await expect(reportRow2).toBeVisible({ timeout: 15000 });
    await reportRow2.dblclick();
    await page.waitForTimeout(2000);

    const schedulerDialog2 = page.locator('[role="dialog"]:visible').first();
    await expect(schedulerDialog2).toBeVisible({ timeout: 15000 });

    // Switch to Parameter tab, wait 3 seconds, remove existing and fill 10101
    console.log('👉 Switch to Parameter tab...');
    const parameterTab2 = schedulerDialog2.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    await parameterTab2.click();
    await page.waitForTimeout(3000);

    console.log('👉 Clearing and filling order number parameter to 10101...');
    const paramInput2 = schedulerDialog2.locator('input[type="text"], input:not([type]), p-inputnumber input, input.p-inputtext').first();
    await expect(paramInput2).toBeVisible({ timeout: 10000 });
    await paramInput2.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await paramInput2.fill('10101');
    await page.waitForTimeout(1000);
    await shot(page, '12-parameter-10101.png');

    // Switch to Schedule tab, take screenshot
    console.log('👉 Switch to Schedule tab...');
    const scheduleTab2 = schedulerDialog2.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab2.click();
    await page.waitForTimeout(1000);
    await shot(page, '13-schedule-default.png');

    // Switch to Output tab
    console.log('👉 Switch to Output tab...');
    const outputTab2 = schedulerDialog2.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab2.click();
    await page.waitForTimeout(1000);

    // Click Home icon and wait 5 seconds
    console.log('👉 Clicking Home icon...');
    const homeIconBtn2 = schedulerDialog2.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn2).toBeVisible({ timeout: 5000 });
    await homeIconBtn2.click();
    console.log('👉 Waiting 5 seconds for Select Folder dialog to load...');
    await page.waitForTimeout(5000);

    const folderDialog2 = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog2).toBeVisible({ timeout: 15000 });

    // Search for Reports Version
    console.log('👉 Searching for "Reports Version" folder...');
    const searchFolderInput2 = folderDialog2.getByPlaceholder('Search files and folders').first();
    await searchFolderInput2.fill('Reports Version');
    await page.waitForTimeout(2000);

    // Expand Root first, then Neel folder
    await expandNodeIfNeeded('Root');
    await expandNodeIfNeeded('Neel');

    // Select 'Reports Version' folder item
    console.log('👉 Selecting "Reports Version" folder...');
    const reportsVersionFolder2 = folderDialog2.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Reports Version' }).first();
    await expect(reportsVersionFolder2).toBeVisible({ timeout: 10000 });
    await reportsVersionFolder2.click();
    await page.waitForTimeout(1000);
    await shot(page, '14-reports-version-folder-selected.png');

    // Click Submit inside Select Folder dialog
    console.log('👉 Clicking Submit...');
    const submitPathBtn2 = folderDialog2.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn2).toBeVisible({ timeout: 5000 });
    await submitPathBtn2.click();
    await page.waitForTimeout(2000);
    await shot(page, '15-path-configured.png');

    // Uncheck Replace Default checkbox
    console.log('👉 Unchecking Replace Default checkbox...');
    const replaceDefaultBox = schedulerDialog2.locator('p-checkbox[name="replacedefault"] .p-checkbox-box, p-checkbox:has-text("Replace Default") .p-checkbox-box').first();
    const isChecked = await replaceDefaultBox.evaluate(el => el.classList.contains('p-highlight'));
    console.log(`Replace Default is checked: ${isChecked}`);
    if (isChecked) {
      await replaceDefaultBox.click();
    }
    await page.waitForTimeout(2000);
    await shot(page, '16-replace-default-unchecked.png');

    // Click Run and wait for new tab
    console.log('👉 Clicking Run button and waiting for new page/tab...');
    const runBtn2 = schedulerDialog2.getByRole('button', { name: /run/i }).first();
    await expect(runBtn2).toBeVisible({ timeout: 5000 });

    const newPagePromise2 = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);
    await runBtn2.click();

    const newTabPage2 = await newPagePromise2;
    await page.waitForTimeout(2000);

    if (newTabPage2 !== page) {
      console.log('👉 New tab opened. Waiting 15 seconds...');
      await newTabPage2.waitForLoadState().catch(() => {});
      await page.waitForTimeout(15000);
      
      if (!newTabPage2.isClosed()) {
        await shot(newTabPage2, '17-new-tab-opened.png').catch(() => {});
        console.log('👉 Closing execution tab to return focus to main page...');
        await newTabPage2.close().catch(() => {});
      } else {
        await shot(page, '17-new-tab-opened.png');
      }
    } else {
      await shot(page, '17-new-tab-opened.png');
    }

    // Navigate to Reports Version folder
    console.log('👉 Navigating back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    console.log('👉 Searching for "Neel" folder...');
    const gridSearchInput2 = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput2.clear();
    await gridSearchInput2.fill('Neel');
    await page.waitForTimeout(2000);

    console.log('👉 Opening Neel folder...');
    const neelFolderRow2 = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Neel' }).first();
    await expect(neelFolderRow2).toBeVisible({ timeout: 15000 });
    await neelFolderRow2.dblclick();
    await page.waitForTimeout(2000);

    await gridSearchInput2.clear();
    await gridSearchInput2.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    console.log('👉 Searching for "Reports Version" folder...');
    await gridSearchInput2.clear();
    await gridSearchInput2.fill('Reports Version');
    await page.waitForTimeout(2000);

    console.log('👉 Opening Reports Version folder...');
    const reportsVersionFolderRow2 = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Reports Version' }).first();
    await expect(reportsVersionFolderRow2).toBeVisible({ timeout: 15000 });
    await reportsVersionFolderRow2.dblclick();
    await page.waitForTimeout(2000);

    await gridSearchInput2.clear();
    await gridSearchInput2.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    // Refresh grid to show new file
    const refreshBtn2 = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    if (await refreshBtn2.isVisible().catch(() => false)) {
      await refreshBtn2.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await shot(page, '18-reports-version-folder-verified.png');

    // Part 4: Open version context menu again
    console.log('👉 Part 4: Right-clicking on the report file...');
    await defaultFile.click({ button: 'right' });
    await page.waitForTimeout(1500);
    await shot(page, '09-context-menu-open.png');

    // Click on Version in the context menu
    console.log('👉 Clicking on Version option...');
    const versionOption2 = page.locator('.p-contextmenu-root-list .p-menuitem, .p-menuitem, li, a, .p-menuitem-text').filter({ hasText: /^Version$/ }).first();
    await expect(versionOption2).toBeVisible({ timeout: 5000 });
    await versionOption2.click();
    await page.waitForTimeout(3000);

    // Assert Version dialog is visible (now with 2 versions)
    const versionDialog2 = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Manage file versions/i }).first();
    await expect(versionDialog2).toBeVisible({ timeout: 15000 });
    await shot(page, '19-two-versions-default.png');

    // Scroll horizontally and take ss
    console.log('👉 Scrolling table inside Version dialog horizontally...');
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], p-dialog');
      if (dialog) {
        const wrappers = dialog.querySelectorAll('.p-datatable-wrapper, .ui-table-scrollable-body, .p-dialog-content, div');
        for (const w of Array.from(wrappers)) {
          if (w.scrollWidth > w.clientWidth) {
            w.scrollLeft = 1000;
          }
        }
      }
    }).catch((e) => console.log('Scroll error:', e));
    await page.waitForTimeout(2000);
    await shot(page, '20-two-versions-scrolled.png');

    // Click Cancel to close dialog
    console.log('👉 Clicking Cancel to close Version dialog...');
    const cancelBtn = versionDialog2.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    } else {
      const closeBtn2 = versionDialog2.locator('button.p-dialog-header-close, .pi-times, [class*="close"]').first();
      await closeBtn2.click();
    }
    await page.waitForTimeout(2000);

    // Double click file to open in a new tab (Order Number: 10101)
    console.log('👉 Double-clicking file to open in a new tab (Order Number: 10101)...');
    const newPagePromise3 = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);
    await defaultFile.dblclick();
    const newTabPage3 = await newPagePromise3;
    await page.waitForTimeout(2000);

    if (newTabPage3 !== page) {
      console.log('👉 New tab opened. Waiting 15 seconds for report to load...');
      await newTabPage3.waitForLoadState().catch(() => {});
      await page.waitForTimeout(15000);
      
      if (!newTabPage3.isClosed()) {
        await shot(newTabPage3, '21-order-10101-rendered.png').catch(() => {});
        console.log('👉 Closing execution tab...');
        await newTabPage3.close().catch(() => {});
      } else {
        await shot(page, '21-order-10101-rendered.png');
      }
    } else {
      await shot(page, '21-order-10101-rendered.png');
    }
    await page.waitForTimeout(2000);

    // Right-click and open version context menu again
    console.log('👉 Right-clicking report file to restore old version...');
    await defaultFile.click({ button: 'right' });
    await page.waitForTimeout(1500);

    console.log('👉 Clicking on Version option...');
    await versionOption2.click();
    await page.waitForTimeout(3000);

    await expect(versionDialog2).toBeVisible({ timeout: 15000 });

    // Select the first version checkbox under Default Version column
    console.log('👉 Selecting the first checkbox to restore older version...');
    const firstRowCheckbox = versionDialog2.locator('.e-row, tr').filter({ has: page.locator('input[type="checkbox"], .e-checkbox-wrapper') }).first().locator('.e-checkbox-wrapper, input[type="checkbox"], .e-frame').first();
    await expect(firstRowCheckbox).toBeVisible({ timeout: 5000 });
    await firstRowCheckbox.click();
    await page.waitForTimeout(1500);
    await shot(page, '22-first-version-selected.png');

    // Click Submit and wait 2 seconds
    console.log('👉 Clicking Submit button...');
    const submitBtn3 = versionDialog2.getByRole('button', { name: /submit/i }).first();
    await expect(submitBtn3).toBeVisible({ timeout: 5000 });
    await submitBtn3.click();
    await page.waitForTimeout(2000);

    // Double-click file to open in a new tab (Order Number: 10100)
    console.log('👉 Double-clicking file to open in a new tab (Order Number: 10100)...');
    const newPagePromise4 = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);
    await defaultFile.dblclick();
    const newTabPage4 = await newPagePromise4;
    await page.waitForTimeout(2000);

    if (newTabPage4 !== page) {
      console.log('👉 New tab opened. Waiting 15 seconds for report to load...');
      await newTabPage4.waitForLoadState().catch(() => {});
      await page.waitForTimeout(15000);
      
      if (!newTabPage4.isClosed()) {
        await shot(newTabPage4, '23-order-10100-rendered.png').catch(() => {});
        console.log('👉 Closing execution tab...');
        await newTabPage4.close().catch(() => {});
      } else {
        await shot(page, '23-order-10100-rendered.png');
      }
    } else {
      await shot(page, '23-order-10100-rendered.png');
    }

    console.log('✅ reports_replace_default completed successfully');
  });
});
