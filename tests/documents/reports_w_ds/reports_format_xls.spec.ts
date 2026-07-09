import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe.serial('AIV Reports - Format XLS Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_format_xls', async ({ page }) => {
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

    // Step 3: Switch to Output tab
    console.log('👉 Step 3: Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 4: Change name to Order Details xls
    console.log('👉 Step 4: Setting Output Name to Order Details xls...');
    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('Order Details xls');
    await page.waitForTimeout(1000);
    await shot(page, '03-output-name-xls.png');

    // Step 5: Select xls in Format dropdown
    console.log('👉 Step 5: Selecting xls in Format dropdown...');
    const formatDropdown = schedulerDialog.locator('p-dropdown[name="outputformat"]').first();
    await formatDropdown.click();
    await page.waitForTimeout(1000);

    const xlsOption = page.locator('.p-dropdown-item, [role="option"], li').filter({ hasText: /^xls$/i }).first();
    await expect(xlsOption).toBeVisible({ timeout: 5000 });
    await xlsOption.click();
    await page.waitForTimeout(3000);
    await shot(page, '04-format-selected-xls.png');

    // Step 6: Click Home icon and wait 5 seconds
    console.log('👉 Step 6: Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 5 seconds for Select Folder dialog to load...');
    await page.waitForTimeout(5000);

    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });
    await shot(page, '05-select-folder-dialog.png');

    // Step 7: Search for Reports Format in Select Folder search input
    console.log('👉 Step 7: Searching for "Reports Format" folder...');
    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Reports Format');
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

    // Step 8: Expand Root first
    await expandNodeIfNeeded('Root');

    // Step 9: Select 'Reports Format' folder item
    console.log('👉 Step 9: Selecting "Reports Format" folder...');
    const reportsFormatFolder = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Reports Format' }).first();
    await expect(reportsFormatFolder).toBeVisible({ timeout: 10000 });
    await reportsFormatFolder.click();
    await page.waitForTimeout(1000);
    await shot(page, '06-reports-format-folder-selected.png');

    // Step 10: Click Submit inside Select Folder dialog
    console.log('👉 Step 10: Clicking Submit to select path...');
    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, '07-folder-dialog-submitted.png');

    // Step 11: Click Run inside scheduler dialog and wait for new tab
    console.log('👉 Step 11: Clicking Run button and waiting for new page/tab...');
    const runBtn = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await expect(runBtn).toBeVisible({ timeout: 5000 });

    let downloadObj: any = null;
    page.context().on('page', (p) => {
      p.on('download', (d) => {
        downloadObj = d;
      });
    });

    const newPagePromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);

    await runBtn.click();

    const newTabPage = await newPagePromise;
    await page.waitForTimeout(2000);

    if (newTabPage !== page) {
      console.log('👉 New tab opened. Waiting for load state...');
      await newTabPage.waitForLoadState().catch(() => {});
      await page.waitForTimeout(2000);
      if (!newTabPage.isClosed()) {
        await shot(newTabPage, '08-new-tab-opened.png').catch(() => {});
      } else {
        await shot(page, '08-main-tab-fallback.png');
      }
    } else {
      await shot(page, '08-no-new-tab.png');
    }

    // Step 12: Wait for download completion
    console.log('👉 Step 12: Waiting for browser download to complete...');
    for (let i = 0; i < 30; i++) {
      if (downloadObj) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (downloadObj) {
      console.log('👉 Download event triggered. Waiting for download to finish...');
      const path = await downloadObj.path().catch(() => '');
      console.log(`👉 Download completed! Saved temporarily at: ${path}`);
    } else {
      console.log('⚠️ No download event intercepted within timeout.');
    }

    // Capture screenshot right after download completes/closes
    await page.waitForTimeout(2000);
    await shot(page, '09-download-completed.png');

    // Step 14: Go back to Reports section
    console.log('👉 Step 14: Going back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    // Step 15: Search for 'Reports Format' folder
    console.log('👉 Step 15: Searching for "Reports Format" folder...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.clear();
    await gridSearchInput.fill('Reports Format');
    await page.waitForTimeout(2000);
    await shot(page, '10-reports-format-folder-searched.png');

    // Step 16: Double click on Reports Format folder
    console.log('👉 Step 16: Opening Reports Format folder...');
    const reportsFormatFolderRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Reports Format' }).first();
    await expect(reportsFormatFolderRow).toBeVisible({ timeout: 15000 });
    await reportsFormatFolderRow.dblclick();
    await page.waitForTimeout(2000);

    // Clear search filter to reveal files
    console.log('👉 Clearing grid search filter...');
    await gridSearchInput.clear();
    await gridSearchInput.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await shot(page, '11-reports-format-folder-opened.png');

    // Step 19: Verify xls file is present (with polling refresh loop)
    console.log('👉 Step 19: Verifying xls file is present...');
    const xlsFile = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order Details xls' }).first();
    
    let fileFound = false;
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    for (let i = 0; i < 6; i++) {
      if (await xlsFile.isVisible().catch(() => false)) {
        fileFound = true;
        break;
      }
      console.log(`👉 xls file not visible yet. Refreshing grid (attempt ${i + 1}/6)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(5000);
    }

    await expect(xlsFile).toBeVisible({ timeout: 15000 });
    await xlsFile.click();
    await page.waitForTimeout(1000);
    await shot(page, '12-xls-file-verified.png');

    console.log('✅ reports_format_xls completed successfully');
  });
});
