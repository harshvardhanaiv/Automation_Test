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

test.describe('AIV Merge Reports - Schedule Once Share Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Merge Reports section
    console.log('👉 Navigating to Merge Reports...');
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'MergeReports');
  });

  test('merge_once_share', async ({ page, context }) => {
    test.setTimeout(300000);
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

    // Step 3: Clear Name input and fill with 'Merge AutoTest share'
    console.log('👉 Entering name Merge AutoTest share...');
    const nameInput = schedulerDialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    await nameInput.press('Control+A');
    await nameInput.press('Backspace');
    await nameInput.fill('Merge AutoTest share');
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
    await page.waitForTimeout(1000);

    // Step 8: Select Once radio button
    console.log('👉 Selecting "Once" frequency...');
    const onceRadio = schedulerDialog.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);

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
    await shot(page, '02-schedule-tab.png');

    // Step 10: Configure Sharing Settings
    console.log('👉 Configuring sharing settings...');
    const shareCheckbox = schedulerDialog.locator('p-checkbox[name="share"] .p-checkbox-box').first();
    await shareCheckbox.scrollIntoViewIfNeeded();
    await shareCheckbox.click({ force: true });
    await page.waitForTimeout(2000);

    const usersRadio = schedulerDialog.locator('app-share-content p-radioButton, .schedule-share p-radioButton').first().locator('.p-radiobutton-box');
    await usersRadio.click({ force: true });
    await page.waitForTimeout(2000);

    // Open Visibility dropdown
    const visibilityDropdown = page.locator('p-dropdown[name="visibilityTypes"]').first();
    await expect(visibilityDropdown).toBeVisible({ timeout: 10000 });

    let opened = false;
    for (const selector of ['.p-dropdown-trigger', '.p-dropdown', 'span.p-dropdown-label']) {
      try {
        await visibilityDropdown.locator(selector).first().click({ force: true, timeout: 2000 });
        await page.waitForTimeout(500);
        if (await page.locator('.p-dropdown-items-wrapper, .p-dropdown-item').first().isVisible({ timeout: 1000 }).catch(() => false)) {
          opened = true;
          break;
        }
      } catch (e) {}
    }

    if (!opened) {
      await visibilityDropdown.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Select Public option
    const publicOption = page.locator('.p-dropdown-item').filter({ hasText: 'Public' }).first();
    await expect(publicOption).toBeVisible({ timeout: 5000 });
    await publicOption.click({ force: true });
    await page.waitForTimeout(1000);
    await shot(page, '03-visibility-public.png');

    // Search for Neel and check checkbox
    console.log('👉 Searching for Neel user and checking box...');
    const userSearchInput = schedulerDialog.locator('app-share-content input[placeholder*="Search"i]:visible, .schedule-share input[placeholder*="Search"i]:visible').first();
    await expect(userSearchInput).toBeVisible({ timeout: 5000 });
    await userSearchInput.click();
    await userSearchInput.clear();
    await userSearchInput.pressSequentially('Neel', { delay: 100 });
    await page.waitForTimeout(2000);

    const neelCell = schedulerDialog.locator('app-share-content td, .sharecontent td, app-share-content .e-rowcell, .sharecontent .e-rowcell').filter({ hasText: /^\s*Neel\s*$/ }).first();
    await expect(neelCell).toBeVisible({ timeout: 10000 });

    const neelRow = neelCell.locator('xpath=..');
    const neelCheckbox = neelRow.locator('.e-frame, .e-checkbox-wrapper, .p-checkbox-box').first();
    await neelCheckbox.scrollIntoViewIfNeeded();
    await neelCheckbox.click();
    await page.waitForTimeout(2000);
    await shot(page, '04-neel-shared.png');

    // Step 11: Switch to Output tab
    console.log('👉 Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 12: Click Home icon
    console.log('👉 Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 8 seconds for Select Folder dialog...');
    await page.waitForTimeout(8000);

    // Step 13: Select Neel -> Merge Reports folder
    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });

    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Neel');
    await page.waitForTimeout(3000);

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
    await shot(page, '05-output-path-selected.png');

    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(2000);

    // Step 14: Click Save & Merge
    console.log('👉 Clicking Save & Merge...');
    const saveMergeBtn = schedulerDialog.getByRole('button', { name: 'Save & Merge', exact: true }).first();
    await expect(saveMergeBtn).toBeVisible({ timeout: 10000 });
    await saveMergeBtn.click();
    await page.waitForTimeout(2000);

    // Step 15: Go to Requests page
    console.log('👉 Navigating to Requests...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Request');

    // Switch to Schedule tab
    console.log('👉 Switching to Schedule tab...');
    const requestScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestScheduleTab.click();
    await page.waitForTimeout(2000);

    const scheduleItem = page.locator('[role="gridcell"], td, .e-rowcell, [class*="name"]').filter({ hasText: 'Merge AutoTest share' }).first();
    await expect(scheduleItem).toBeVisible({ timeout: 15000 });
    await shot(page, '06-requests-scheduled.png');

    // Step 16: Wait 1 minute and Logout
    console.log('👉 Waiting 1 minute (60 seconds) before logout...');
    await page.waitForTimeout(60000);

    console.log('👉 Logging out Admin...');
    await logout(page);

    // Clear session details
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await page.waitForTimeout(1000);

    // Step 17: Login as Neel user
    console.log('👉 Logging in as Neel user...');
    await loginAs(page, 'Neel', 'password');
    await page.waitForTimeout(2000);
    await shot(page, '07-neel-logged-in.png');
     // Step 18: Navigate to Reports section directly
    console.log('👉 Navigating to Reports section...');
    await page.goto('https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);

    // Open Neel (uppercase) folder directly from the list
    console.log('👉 Opening Neel folder...');
    const neelCapitalFolderRow = page.locator('tr.e-row').filter({
      has: page.locator('.e-rowcell, td').filter({ hasText: /Neel/ }).filter({ hasText: /Path\s*::/ })
    }).first();
    await expect(neelCapitalFolderRow).toBeVisible({ timeout: 20000 });
    await neelCapitalFolderRow.dblclick();
    await page.waitForTimeout(3000);

    // Open Merge Reports folder directly from the list
    console.log('👉 Opening Merge Reports folder...');
    const mergeReportsFolderRow = page.locator('tr.e-row').filter({
      has: page.locator('.e-rowcell, td').filter({ hasText: /Merge Reports/ }).filter({ hasText: /Path\s*::/ })
    }).first();
    await expect(mergeReportsFolderRow).toBeVisible({ timeout: 20000 });
    await mergeReportsFolderRow.dblclick();
    await page.waitForTimeout(3000);

    // Step 19: Search and poll for shared Merge report
    console.log('👉 Polling for shared report containing "Merge AutoTest share"...');
    const searchBox = page.getByPlaceholder('Search files and folders in current section').first();
    await expect(searchBox).toBeVisible({ timeout: 15000 });
    await searchBox.click();
    await searchBox.clear();
    await searchBox.fill('Merge AutoTest share');
    await page.waitForTimeout(2500);
    await searchBox.press('Enter');
    await page.waitForTimeout(2000);

    let fileFound = false;
    const fileCell = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Merge AutoTest share' }).first();
    for (let attempt = 1; attempt <= 12; attempt++) {
      console.log(`   Attempt ${attempt}/12...`);
      const refreshBtn = page.locator('.fa-arrow-rotate-right, .fa-rotate-90, .pi-refresh, [class*="refresh"]').first();
      if (await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refreshBtn.click();
      }
      await page.waitForTimeout(3000);

      if (await fileCell.isVisible({ timeout: 2000 }).catch(() => false)) {
        fileFound = true;
        break;
      }
    }
    expect(fileFound).toBe(true);
    await shot(page, '08-shared-report-visible.png');

    // Step 20: Double click to open report in new tab
    console.log('👉 Opening report and waiting for load...');
    await fileCell.dblclick();

    const newPagePromise = new Promise<Page>((resolve) => {
      context.on('page', (newPage) => {
        resolve(newPage);
      });
    });
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load', { timeout: 90000 });

    console.log('👉 PDF tab opened! Waiting 10 seconds...');
    await newPage.waitForTimeout(10000);
    await shot(newPage, '09-pdf-opened.png');

    console.log('✅ merge_once_share completed successfully');
  });
});
