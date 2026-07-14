import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, assertPageLoaded } from '../../helpers';

test.describe('AIV Merge Reports - Schedule Email Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Merge Reports section
    console.log('👉 Navigating to Merge Reports...');
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'MergeReports');
  });

  test('merge_email', async ({ page, context }) => {
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

    // Step 3: Clear Name input and fill with 'Merge Email AutoTest'
    console.log('👉 Entering name Merge Email AutoTest...');
    const nameInput = schedulerDialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    await nameInput.press('Control+A');
    await nameInput.press('Backspace');
    await nameInput.fill('Merge Email AutoTest');
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

    // Step 9: Switch to Email tab
    console.log('👉 Switching to Email tab...');
    const emailTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /email/i }).first();
    await expect(emailTab).toBeVisible({ timeout: 10000 });
    await emailTab.click();
    await page.waitForTimeout(1000);

    // Check Email checkbox
    console.log('👉 Checking Email checkbox...');
    const emailCheckbox = schedulerDialog.locator('p-checkbox[name="email"] .p-checkbox-box, p-checkbox:has-text("Email") .p-checkbox-box, p-checkbox[label="Email"] .p-checkbox-box').first();
    await expect(emailCheckbox).toBeVisible({ timeout: 10000 });
    await emailCheckbox.click({ force: true });
    await page.waitForTimeout(2000);

    // Users dropdown configuration
    console.log('👉 Interacting with Users dropdown...');
    const usersDropdown = schedulerDialog.locator('p-multiSelect[name="users"], p-multiSelect[placeholder*="Users"i], p-multiSelect').first();
    await expect(usersDropdown).toBeVisible({ timeout: 10000 });
    await usersDropdown.click({ force: true });
    await page.waitForTimeout(1500);

    // Search for neel
    console.log('👉 Searching for "neel" in dropdown filter...');
    const dropdownFilterInput = page.locator('.p-multiselect-filter-container input, .p-dropdown-filter-container input, input[role="textbox"]:visible').first();
    await expect(dropdownFilterInput).toBeVisible({ timeout: 5000 });
    await dropdownFilterInput.click();
    await dropdownFilterInput.clear();
    await dropdownFilterInput.pressSequentially('neel', { delay: 100 });
    await page.waitForTimeout(1500);

    // Select Neel user
    console.log('👉 Selecting Neel user...');
    const neelItem = page.locator('.p-multiselect-item, .p-dropdown-item').filter({ hasText: /^\s*Neel\s*$/ }).first();
    await expect(neelItem).toBeVisible({ timeout: 5000 });
    await neelItem.click();
    await page.waitForTimeout(1500);

    // Erase Neel user (uncheck/unselect it by clicking again)
    console.log('👉 Erasing/Unselecting Neel user...');
    await neelItem.click();
    await page.waitForTimeout(1000);

    // Search and select Demo user
    console.log('👉 Searching for "Demo" in dropdown filter...');
    await dropdownFilterInput.click();
    await dropdownFilterInput.clear();
    await dropdownFilterInput.pressSequentially('Demo', { delay: 100 });
    await page.waitForTimeout(1500);

    console.log('👉 Selecting Demo user...');
    const demoItem = page.locator('.p-multiselect-item, .p-dropdown-item').filter({ hasText: /^\s*Demo\s*$/ }).first();
    await expect(demoItem).toBeVisible({ timeout: 5000 });
    await demoItem.click();
    await page.waitForTimeout(1500);

    // Close the dropdown overlay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await shot(page, '04-user-selected.png');

    // Enter email custom field
    console.log('👉 Entering custom email neel@aivhub.com...');
    const customEmailInput = schedulerDialog.locator('p-chips input, .p-chips-input-token input, input[placeholder*="email"i]').first();
    await expect(customEmailInput).toBeVisible({ timeout: 10000 });
    await customEmailInput.click();
    await customEmailInput.fill('neel@aivhub.com');
    await page.waitForTimeout(500);
    await customEmailInput.press('Enter');
    await page.waitForTimeout(1500);
    await shot(page, '05-email-entered.png');

    // Select Email Template success
    console.log('👉 Interacting with Email Template dropdown...');
    const templateDropdown = schedulerDialog.locator('p-dropdown').filter({ hasText: /Select Email Template/i }).first();
    await expect(templateDropdown).toBeVisible({ timeout: 10000 });

    let templateOpened = false;
    for (const selector of ['.p-dropdown-trigger', '.p-dropdown', 'span.p-dropdown-label']) {
      try {
        await templateDropdown.locator(selector).first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(500);
        if (await page.locator('.p-dropdown-items-wrapper, .p-dropdown-item').first().isVisible({ timeout: 1000 }).catch(() => false)) {
          templateOpened = true;
          break;
        }
      } catch (e) { }
    }
    if (!templateOpened) {
      await templateDropdown.click({ force: true });
      await page.waitForTimeout(1000);
    }

    const successOption = page.locator('.p-dropdown-item').filter({ hasText: 'Success' }).first();
    await expect(successOption).toBeVisible({ timeout: 5000 });
    await successOption.click({ force: true });

    console.log('👉 Waiting 5 seconds for template selection...');
    await page.waitForTimeout(5000);
    await shot(page, '06-template-selected.png');

    // Save & Merge and check new tab
    console.log('👉 Clicking Save & Merge...');
    const saveMergeBtn = schedulerDialog.getByRole('button', { name: 'Save & Merge', exact: true }).first();
    await expect(saveMergeBtn).toBeVisible({ timeout: 10000 });

    const newPagePromise = new Promise<Page>((resolve) => {
      context.on('page', (newPage) => {
        resolve(newPage);
      });
    });

    await saveMergeBtn.click();
    console.log('👉 Waiting for the PDF tab to open...');
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load', { timeout: 90000 });

    console.log('👉 PDF tab opened! Waiting 10 seconds for execution...');
    await newPage.waitForTimeout(10000);
    await shot(newPage, '07-pdf-opened.png');

    console.log('✅ merge_email completed successfully');
  });
});
