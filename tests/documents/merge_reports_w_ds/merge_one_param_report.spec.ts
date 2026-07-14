import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe('AIV Merge Reports - Merge One Parameter Report (Part 1)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Merge Reports section
    console.log('👉 Navigating to Merge Reports...');
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'MergeReports');
  });

  test('merge_one_param_report', async ({ page }) => {
    // Wait for any loading spinner to clear
    await page.locator('.e-spinner-pane:visible, .e-spin-show:visible, [class*="spinner"]:visible').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1000);

    // Step 1: Click on Create button at the bottom of the grid
    console.log('👉 Step 1: Clicking Create button at the bottom...');
    const createBtn = page.getByRole('button', { name: 'Create', exact: true }).first();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await shot(page, '01-create-button-clicked.png');
    await createBtn.click();

    // Step 2: Wait 5 seconds for parameter dialog to load
    console.log('👉 Step 2: Waiting 5 seconds for Parameter tab dialog to load...');
    const schedulerDialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(schedulerDialog).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(5000);
    await shot(page, '02-parameter-tab-opened.png');

    // Step 3: Clear Name input and fill with 'Merge AutoTest'
    console.log('👉 Step 3: Entering name Merge AutoTest...');
    const nameInput = schedulerDialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    // Use selectAll + Backspace to clear because standard .clear() might not trigger the React/Angular bindings
    await nameInput.press('Control+A');
    await nameInput.press('Backspace');
    await nameInput.fill('Merge AutoTest');
    await page.waitForTimeout(1000);
    await shot(page, '03-name-entered.png');

    // Step 4: Search for Order details AutoTest report
    console.log('👉 Step 4: Searching for "Order details AutoTest"...');
    const searchInput = schedulerDialog.getByPlaceholder('Search files and folders').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.click();
    await searchInput.clear();
    await searchInput.fill('Order details AutoTest');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // Click on Order details AutoTest report in the tree node list
    console.log('👉 Selecting "Order details AutoTest" from tree node...');
    const reportNode = schedulerDialog.locator('.p-treenode-content, .tree_lbl_vl, span').filter({ hasText: 'Order details AutoTest' }).first();
    await expect(reportNode).toBeVisible({ timeout: 15000 });
    await reportNode.click();
    await page.waitForTimeout(1000);
    await shot(page, '04-report-selected.png');

    // Step 5: Click the right arrow button (>) to add the report
    console.log('👉 Step 5: Clicking right arrow (>) to move report to selected list...');
    const moveRightBtn = schedulerDialog.locator('.seprate_div a, .seprate_div i, .seprate_div [class*="chevron-right"]').first();
    await expect(moveRightBtn).toBeVisible({ timeout: 10000 });
    await moveRightBtn.click();
    console.log('👉 Waiting 5 seconds after clicking > icon...');
    await page.waitForTimeout(5000);
    await shot(page, '05-report-moved-right.png');

    // Scroll down dialog content to see Parameters section
    console.log('👉 Scrolling down to view Parameters...');
    const dialogContent = schedulerDialog.locator('.p-dialog-content, [class*="content"]').first();
    if (await dialogContent.isVisible().catch(() => false)) {
      await dialogContent.evaluate(el => el.scrollTo(0, el.scrollHeight));
    }
    await page.waitForTimeout(2000);
    await shot(page, '06-parameters-visible.png');

    // Step 6: Change parameter from 10100 to 10101
    console.log('👉 Step 6: Changing parameter from 10100 to 10101...');
    let orderNumberInput: any = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const textInputs = schedulerDialog.locator('input:not([type="radio"]):not([type="checkbox"]):not([readonly]):not([disabled]):not([type="hidden"])');
      const inputCount = await textInputs.count();
      for (let i = 0; i < inputCount; i++) {
        const input = textInputs.nth(i);
        const val = await input.inputValue().catch(() => '');
        if (val === '10100') {
          orderNumberInput = input;
          break;
        }
      }
      if (orderNumberInput) break;
      await page.waitForTimeout(1000);
    }

    if (orderNumberInput) {
      await orderNumberInput.click();
      await orderNumberInput.press('Control+A');
      await orderNumberInput.press('Backspace');
      await orderNumberInput.fill('10101');
      await page.waitForTimeout(2000);
    } else {
      console.error('❌ Could not find parameter input with value 10100');
    }
    await shot(page, '07-parameter-changed.png');

    // Scroll up to search files and folders
    console.log('👉 Scrolling up to search input...');
    if (await dialogContent.isVisible().catch(() => false)) {
      await dialogContent.evaluate(el => el.scrollTo(0, 0));
    }
    await page.waitForTimeout(1000);

    // Step 7: Search for 'vinit'
    console.log('👉 Step 7: Searching for "vinit"...');
    await searchInput.click();
    await searchInput.press('Control+A');
    await searchInput.press('Backspace');
    await searchInput.fill('vinit');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // Step 8: Click excel_auto_col_widths file
    console.log('👉 Selecting "excel_auto_col_widths" report...');
    const secondReportNode = schedulerDialog.locator('.p-treenode-content, .tree_lbl_vl, span').filter({ hasText: 'excel_auto_col_widths' }).first();
    await expect(secondReportNode).toBeVisible({ timeout: 15000 });
    await secondReportNode.click();
    await page.waitForTimeout(1000);
    await shot(page, '08-second-report-selected.png');

    // Step 9: Click move right (>) icon
    console.log('👉 Step 9: Clicking move right (>) button...');
    await moveRightBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, '09-second-report-moved-right.png');

    // Step 10: Scroll down to view both parameters
    console.log('👉 Step 10: Scrolling down to view both parameters...');
    if (await dialogContent.isVisible().catch(() => false)) {
      await dialogContent.evaluate(el => el.scrollTo(0, el.scrollHeight));
    }
    await page.waitForTimeout(2000);
    await shot(page, '10-both-parameters-visible.png');

    // Step 11: Switch to Schedule tab
    console.log('👉 Step 11: Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await expect(scheduleTab).toBeVisible({ timeout: 10000 });
    await scheduleTab.click();
    await page.waitForTimeout(2000);
    await shot(page, '11-schedule-tab.png');

    // Step 12: Click Save & Merge and wait for new tab
    console.log('👉 Step 12: Clicking Save & Merge button and waiting for new tab...');
    const saveMergeBtn = schedulerDialog.getByRole('button', { name: 'Save & Merge', exact: true }).first();
    await expect(saveMergeBtn).toBeVisible({ timeout: 10000 });

    const [reportPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 30000 }),
      saveMergeBtn.click()
    ]);

    console.log('👉 New tab opened! Waiting 15 seconds for report to load...');
    await reportPage.waitForTimeout(15000);

    // Step 13: Capture screenshots of both pages of the PDF report
    console.log('👉 Step 13: Capturing page 1 of the PDF...');
    await shot(reportPage, '12-pdf-page1.png');

    console.log('👉 Navigating to page 2 of the PDF...');
    // Click in the middle of the viewport to focus the PDF viewer
    const width = reportPage.viewportSize()?.width || 800;
    const height = reportPage.viewportSize()?.height || 600;
    await reportPage.mouse.click(width / 2, height / 2);
    await reportPage.waitForTimeout(1000);

    // Scroll using mouse wheel
    console.log('👉 Scrolling down using mouse wheel...');
    await reportPage.mouse.wheel(0, 1800);
    await reportPage.waitForTimeout(3000);

    await shot(reportPage, '13-pdf-page2.png');

    console.log('✅ merge_one_param_report completed successfully');
  });
});
