import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe('AIV Merge Reports - Simple Merge Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Merge Reports section
    console.log('👉 Navigating to Merge Reports...');
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'MergeReports');
  });

  test('merge_simple_merge', async ({ page, context }) => {
    // Wait for any loading spinner to clear
    await page.locator('.e-spinner-pane:visible, .e-spin-show:visible, [class*="spinner"]:visible').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1000);

    // Step 1: Click on Create button
    console.log('👉 Clicking Create button...');
    const createBtn = page.getByRole('button', { name: 'Create', exact: true }).first();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // Step 2: Wait 5 seconds for Parameter tab dialog to load
    console.log('👉 Waiting 5 seconds for Parameter dialog to load...');
    const schedulerDialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(5000);

    // Step 3: Clear Name input and fill with 'Simple Merge AutoTest'
    console.log('👉 Entering name Simple Merge AutoTest...');
    const nameInput = schedulerDialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    await nameInput.press('Control+A');
    await nameInput.press('Backspace');
    await nameInput.fill('Simple Merge AutoTest');
    await page.waitForTimeout(1000);

    const expandRootNode = async () => {
      const firstToggler = schedulerDialog.locator('.p-tree-toggler').first();
      if (await firstToggler.isVisible().catch(() => false)) {
        const icon = firstToggler.locator('span, i').first();
        const isCollapsed = await icon.evaluate(el => {
          const cls = el.getAttribute('class') || '';
          return cls.includes('right') || cls.includes('collapsed') || el.classList.contains('fa-chevron-right');
        });
        if (isCollapsed) {
          console.log('👉 Root node is collapsed. Expanding...');
          await firstToggler.click();
          await page.waitForTimeout(1500);
        } else {
          console.log('👉 Root node is already expanded.');
        }
      }
    };

    // Step 4: Search and add 'Order details AutoTest'
    console.log('👉 Searching for "Order details AutoTest"...');
    const searchInput = schedulerDialog.getByPlaceholder('Search files and folders').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.click();
    await searchInput.clear();
    await searchInput.fill('Order details AutoTest');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // Expand Root node if collapsed
    await expandRootNode();

    console.log('👉 Selecting "Order details AutoTest" from tree...');
    const reportNode1 = schedulerDialog.locator('.p-treenode-content, .tree_lbl_vl, span').filter({ hasText: 'Order details AutoTest' }).first();
    await expect(reportNode1).toBeVisible({ timeout: 15000 });
    await reportNode1.click();
    await page.waitForTimeout(1000);

    const moveRightBtn = schedulerDialog.locator('.seprate_div a, .seprate_div i, .seprate_div [class*="chevron-right"]').first();
    await expect(moveRightBtn).toBeVisible({ timeout: 10000 });
    await moveRightBtn.click();
    await page.waitForTimeout(3000);

    // Step 5: Search and add 'Orders Payment AutoTest'
    console.log('👉 Searching for "Orders Payment AutoTest"...');
    await searchInput.click();
    await searchInput.press('Control+A');
    await searchInput.press('Backspace');
    await searchInput.fill('Orders Payment AutoTest');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // Expand Root node if collapsed
    await expandRootNode();

    console.log('👉 Selecting "Orders Payment AutoTest" from tree...');
    const reportNode2 = schedulerDialog.locator('.p-treenode-content, .tree_lbl_vl, span').filter({ hasText: 'Orders Payment AutoTest' }).first();
    await expect(reportNode2).toBeVisible({ timeout: 15000 });
    await reportNode2.click();
    await page.waitForTimeout(1000);
    await shot(page, '01-reports-selected.png');

    await moveRightBtn.click();
    console.log('👉 Waiting 5 seconds for parameters to load...');
    await page.waitForTimeout(5000);

    // Step 6: Scroll down to parameters
    console.log('👉 Scrolling down to view Parameters...');
    const dialogContent = schedulerDialog.locator('.p-dialog-content, [class*="content"]').first();
    if (await dialogContent.isVisible().catch(() => false)) {
      await dialogContent.evaluate(el => el.scrollTo(0, el.scrollHeight));
    }
    await page.waitForTimeout(2000);

    // Step 7: Switch to Schedule tab
    console.log('👉 Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await expect(scheduleTab).toBeVisible({ timeout: 10000 });
    await scheduleTab.click();
    await page.waitForTimeout(2000);
    await shot(page, '02-schedule-tab.png');

    // Step 8: Switch to Output tab
    console.log('👉 Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await expect(outputTab).toBeVisible({ timeout: 10000 });
    await outputTab.click();
    await page.waitForTimeout(2000);
    await shot(page, '03-output-tab.png');

    // Step 9: Click Merge button
    console.log('👉 Clicking Merge button...');
    const mergeBtn = schedulerDialog.getByRole('button', { name: 'Merge', exact: true }).first();
    await expect(mergeBtn).toBeVisible({ timeout: 10000 });

    const newPagePromise = new Promise<Page>((resolve) => {
      context.on('page', (newPage) => {
        resolve(newPage);
      });
    });

    await mergeBtn.click();
    console.log('👉 Waiting for the PDF tab to open...');
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load', { timeout: 90000 });

    console.log('👉 PDF tab opened! Waiting 10 seconds for execution...');
    await newPage.waitForTimeout(10000);
    await shot(newPage, '04-pdf-opened.png');

    // Step 10: Go back to AIV tab and click Cancel
    console.log('👉 Returning to main AIV tab...');
    await page.bringToFront();
    await page.waitForTimeout(1000);

    console.log('👉 Clicking Cancel button...');
    const cancelBtn = schedulerDialog.getByRole('button', { name: 'Cancel', exact: true }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });
    await cancelBtn.click();
    await page.waitForTimeout(2000);

    // Step 11: Search for Simple Merge AutoTest in Merge Reports grid
    console.log('👉 Searching for "Simple Merge AutoTest" in Merge Reports...');
    const searchBox = page.getByPlaceholder('Search files and folders in current section').first();
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.click();
    await searchBox.clear();
    await searchBox.fill('Simple Merge AutoTest');
    await page.waitForTimeout(2000);

    const definitionRow = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Simple Merge AutoTest' }).first();
    await expect(definitionRow).not.toBeVisible({ timeout: 5000 });
    await shot(page, '05-no-file-found.png');

    // Clear search bar
    await searchBox.click();
    await searchBox.clear();
    await page.waitForTimeout(1000);

    // Step 12: Navigate to Reports section
    console.log('👉 Navigating to Reports section...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Reports');

    // Step 13: Search for Simple Merge AutoTest in Reports grid
    console.log('👉 Searching for "Simple Merge AutoTest" in Reports...');
    const reportsSearchBox = page.getByPlaceholder('Search files and folders in current section').first();
    await expect(reportsSearchBox).toBeVisible({ timeout: 15000 });
    await reportsSearchBox.click();
    await reportsSearchBox.clear();
    await reportsSearchBox.fill('Simple Merge AutoTest');
    await page.waitForTimeout(3000);

    const reportFileCell = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Simple Merge AutoTest' }).first();
    await expect(reportFileCell).toBeVisible({ timeout: 15000 });
    await shot(page, '06-report-file-found.png');

    console.log('✅ merge_simple_merge completed successfully');
  });
});
