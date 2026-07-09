import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';
import * as path from 'path';
import * as fs from 'fs';

test.describe.serial('AIV Reports - Format PDF Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_format_pdf', async ({ page }) => {
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

    // Step 4: Change name to Order Details pdf
    console.log('👉 Step 4: Setting Output Name to Order Details pdf...');
    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('Order Details pdf');
    await page.waitForTimeout(1000);
    await shot(page, '03-output-name-pdf.png');

    // Step 5: Select pdf in Format dropdown
    console.log('👉 Step 5: Selecting pdf in Format dropdown...');
    const formatDropdown = schedulerDialog.locator('p-dropdown[name="outputformat"]').first();
    await formatDropdown.click();
    await page.waitForTimeout(1000);

    const pdfOption = page.locator('.p-dropdown-item, [role="option"], li').filter({ hasText: /^\s*pdf\s*$/i }).first();
    await expect(pdfOption).toBeVisible({ timeout: 5000 });
    await pdfOption.click();
    await page.waitForTimeout(3000);
    await shot(page, '04-format-selected-pdf.png');

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

    const newPagePromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => page);

    await runBtn.click();

    const newTabPage = await newPagePromise;
    await page.waitForTimeout(2000);

    if (newTabPage !== page) {
      console.log('👉 New tab opened. Waiting for 15 seconds for PDF report rendering...');
      await newTabPage.waitForLoadState().catch(() => {});
      await page.waitForTimeout(15000);
      
      if (!newTabPage.isClosed()) {
        console.log('👉 Capturing full scrollable page screenshot of the PDF report...');
        const relativePath = path.relative(path.join(process.cwd(), 'tests'), test.info().file || '');
        const baseName = path.basename(relativePath, '.spec.ts');
        const finalDir = path.join('screenshots', path.dirname(relativePath), baseName);
        const finalPath = path.join(finalDir, '08-pdf-report-executed.png');
        
        if (!fs.existsSync(finalDir)) {
          fs.mkdirSync(finalDir, { recursive: true });
        }
        
        await newTabPage.screenshot({ path: finalPath, fullPage: true, timeout: 15000 }).catch((err) => {
          console.error('Failed to capture full page screenshot:', err);
        });

        console.log('👉 Closing execution tab to return focus to main page...');
        await newTabPage.close().catch(() => {});
      } else {
        await shot(page, '08-pdf-report-executed.png');
      }
    } else {
      await shot(page, '08-pdf-report-executed.png');
    }

    // Step 13: Go back to Reports section
    console.log('👉 Step 13: Going back to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);

    // Step 14: Search for 'Reports Format' folder
    console.log('👉 Step 14: Searching for "Reports Format" folder...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.clear();
    await gridSearchInput.fill('Reports Format');
    await page.waitForTimeout(2000);
    await shot(page, '09-reports-format-folder-searched.png');

    // Step 15: Double click on Reports Format folder
    console.log('👉 Step 15: Opening Reports Format folder...');
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
    await shot(page, '10-reports-format-folder-opened.png');

    // Step 16: Verify pdf file is present (with polling refresh loop)
    console.log('👉 Step 16: Verifying pdf file is present...');
    const pdfFile = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order Details pdf' }).first();
    
    let fileFound = false;
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first();
    for (let i = 0; i < 6; i++) {
      if (await pdfFile.isVisible().catch(() => false)) {
        fileFound = true;
        break;
      }
      console.log(`👉 pdf file not visible yet. Refreshing grid (attempt ${i + 1}/6)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(5000);
    }

    await expect(pdfFile).toBeVisible({ timeout: 15000 });
    await pdfFile.click();
    await page.waitForTimeout(1000);
    await shot(page, '12-pdf-file-verified.png');

    console.log('✅ reports_format_pdf completed successfully');
  });
});
