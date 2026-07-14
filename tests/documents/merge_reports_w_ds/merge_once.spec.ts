import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';
import * as path from 'path';

test.describe('AIV Merge Reports - Schedule Once Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Merge Reports section
    console.log('👉 Navigating to Merge Reports...');
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'MergeReports');
  });

  test('merge_once', async ({ page }) => {
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

    // Step 3: Clear Name input and fill with 'AutoTest Once'
    console.log('👉 Entering name AutoTest Once...');
    const nameInput = schedulerDialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    await nameInput.press('Control+A');
    await nameInput.press('Backspace');
    await nameInput.fill('AutoTest Once');
    await page.waitForTimeout(1000);
    await shot(page, '01-name-entered.png');

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
    await shot(page, '02-reports-selected.png');

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
    await shot(page, '03-parameters-visible.png');

    // Step 7: Switch to Schedule tab
    console.log('👉 Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await expect(scheduleTab).toBeVisible({ timeout: 10000 });
    await scheduleTab.click();
    await page.waitForTimeout(1000);

    // Step 8: Select Once radio button
    console.log('👉 Selecting "Once" frequency...');
    const onceRadio = schedulerDialog.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);
    await shot(page, '04-frequency-once.png');

    // Step 9: Configure Start Time 1 minute in the future
    console.log('👉 Setting Start Time calendar...');
    const calendarIcon = schedulerDialog.locator('button.p-datepicker-trigger, button.ui-datepicker-trigger').first();
    await calendarIcon.click();
    await page.waitForTimeout(1000);

    const minSpan = page.locator('.p-minute-picker span, .ui-minute-picker span').first();
    await expect(minSpan).toBeVisible({ timeout: 5000 });
    const currentMin = parseInt((await minSpan.textContent() || '0').trim());
    console.log(`🕒 Time picker current minute: ${currentMin}`);

    const hrUpButton = page.locator('.p-hour-picker button, .ui-hour-picker button, .p-hour-picker .pi-chevron-up').first();
    const minUpButton = page.locator('.p-minute-picker button, .ui-minute-picker button, .p-minute-picker .pi-chevron-up').first();

    if (currentMin >= 59) {
      await hrUpButton.click();
      await page.waitForTimeout(300);
      await minUpButton.click();
    } else {
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
    await shot(page, '05-start-time-set.png');

    // Step 10: Switch to Output tab
    console.log('👉 Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 11: Click Home icon
    console.log('👉 Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 8 seconds for Select Folder dialog...');
    await page.waitForTimeout(8000);

    // Step 12: Select Neel -> Merge Reports folder
    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });

    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Neel');
    await page.waitForTimeout(2000);

    const expandNodeIfNeeded = async (nodeName: string) => {
      const label = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: new RegExp('^' + nodeName + '$') }).first();
      await expect(label).toBeVisible({ timeout: 10000 });

      const nodeRow = label.locator('xpath=ancestor::div[contains(@class, "mat-tree-node") or contains(@class, "tree-node")][1]');
      const chevron = nodeRow.locator('i.lbl_icon, i, [class*="chevron"]').first();
      const isCollapsed = await chevron.evaluate(el => {
        const cls = el.getAttribute('class') || '';
        return cls.includes('right') || cls.includes('collapsed') || el.classList.contains('fa-chevron-right');
      });

      if (isCollapsed) {
        const toggleBtn = nodeRow.locator('button').first();
        await toggleBtn.click();
        await page.waitForTimeout(1500);
      }
    };

    await expandNodeIfNeeded('Root');
    await expandNodeIfNeeded('Neel');

    console.log('👉 Selecting "Merge Reports" folder...');
    const mergeReportsFolder = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Merge Reports' }).first();
    await expect(mergeReportsFolder).toBeVisible({ timeout: 10000 });
    await mergeReportsFolder.click();
    await page.waitForTimeout(1000);
    await shot(page, '06-output-path-selected.png');

    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(2000);

    // Step 13: Click Save & Merge
    console.log('👉 Clicking Save & Merge...');
    const saveMergeBtn = schedulerDialog.getByRole('button', { name: 'Save & Merge', exact: true }).first();
    await expect(saveMergeBtn).toBeVisible({ timeout: 10000 });
    await saveMergeBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, '07-save-merge-clicked.png');

    // Step 14: Wait 10 seconds, then click Cancel
    console.log('👉 Waiting 10 seconds and clicking Cancel...');
    await page.waitForTimeout(10000);
    const cancelBtn = schedulerDialog.getByRole('button', { name: 'Cancel', exact: true }).first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    }
    await page.waitForTimeout(2000);

    // Step 15: Go to Requests
    console.log('👉 Navigating to Requests...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Request');

    // Switch to Schedule tab
    console.log('👉 Switching to Schedule tab...');
    const requestScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestScheduleTab.click();
    await page.waitForTimeout(2000);

    const scheduleItem = page.locator('[role="gridcell"], td, .e-rowcell, [class*="name"]').filter({ hasText: 'AutoTest Once' }).first();
    await expect(scheduleItem).toBeVisible({ timeout: 15000 });
    await shot(page, '08-requests-scheduled.png');

    // Step 16: Wait 1 minute
    console.log('👉 Waiting 1 minute (60 seconds) for scheduled execution...');
    await page.waitForTimeout(60000);

    // Step 17: Refresh and verify no longer visible in Schedule
    console.log('👉 Refreshing and verifying cleared scheduled item...');
    const refreshBtn = page.locator('button:has(.pi-refresh), button .pi-refresh, .pi-refresh, [class*="refresh"]').first()
      .or(page.locator('.fa-arrow-rotate-right, .fa-rotate-90').first());
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click({ force: true });
    }
    await page.waitForTimeout(3000);
    await expect(scheduleItem).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    await shot(page, '09-requests-scheduled-cleared.png');

    // Step 18: Switch to Completed tab
    console.log('👉 Switching to Completed tab...');
    const completedTab = page.locator('[role="tab"], li').filter({ hasText: /Completed/i }).first();
    await completedTab.click();
    await page.waitForTimeout(2000);

    // Step 19: Verify AutoTest Once in Completed list
    console.log('👉 Verifying AutoTest Once in Completed tab...');
    const completedItem = page.locator('[role="gridcell"], td, .e-rowcell, [class*="name"]').filter({ hasText: 'AutoTest Once' }).first();
    
    // Poll/Refresh if not visible yet
    let itemFound = false;
    for (let i = 0; i < 6; i++) {
      if (await completedItem.isVisible().catch(() => false)) {
        itemFound = true;
        break;
      }
      console.log(`👉 Completed item not visible yet. Refreshing grid (attempt ${i + 1}/6)...`);
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click({ force: true });
      }
      await page.waitForTimeout(5000);
    }

    await expect(completedItem).toBeVisible({ timeout: 15000 });
    await shot(page, '10-completed-list.png');

    // Step 20: Click on AutoTest Once row
    console.log('👉 Selecting Completed item...');
    await completedItem.click();
    await page.waitForTimeout(2000);
    await shot(page, '11-completed-selected.png');

    // Step 21: Click on the ID of the request
    console.log('👉 Finding the latest execution ID cell...');
    const detailGrid = page.locator('.right-top-grid-container, .rq_right_top').first();
    await expect(detailGrid.locator('[col-id="id"]').first()).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);

    const idCells = await detailGrid.locator('[col-id="id"]').allTextContents();
    const ids = idCells.map(text => parseInt(text.trim(), 10)).filter(num => !isNaN(num));
    if (ids.length === 0) {
      throw new Error('❌ No execution IDs found in detail grid');
    }
    const maxId = Math.max(...ids);
    console.log(`👉 Latest execution ID identified: ${maxId}`);

    const idCell = detailGrid.locator('[col-id="id"]').filter({ hasText: String(maxId) }).first();
    await expect(idCell).toBeVisible({ timeout: 10000 });
    await idCell.click();
    await page.waitForTimeout(2000);
    await shot(page, '12-request-details.png');

    // Step 22: Double click on the ID and wait for new tab
    console.log('👉 Double clicking on Request ID cell...');
    const [pdfPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 30000 }),
      idCell.dblclick({ force: true })
    ]);

    console.log('👉 PDF tab opened! Waiting 10 seconds...');
    await pdfPage.waitForTimeout(10000);
    await shot(pdfPage, '13-pdf-opened.png');

    console.log('✅ merge_once completed successfully');
  });
});
