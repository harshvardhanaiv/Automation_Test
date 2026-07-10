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

test.describe.serial('AIV Reports - Share with Roles Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('reports_share_roles', async ({ page, context }) => {
    // Set timeout to 5 minutes
    test.setTimeout(300000);

    // Step 1: Navigate directly to the Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Reports');

    // Step 2: Find 'Order details AutoTest' (rptdesign) and double-click to open scheduler
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

    // Step 3: Switch to Parameter tab, wait 2 seconds
    console.log('👉 Step 3: Switching to Parameter tab...');
    const parameterTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    await parameterTab.click();
    await page.waitForTimeout(2000);

    // Step 4: Switch to Schedule tab and configure schedule once
    console.log('👉 Step 4: Switching to Schedule tab...');
    const scheduleTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);

    const onceRadio = schedulerDialog.locator('p-radioButton[label="Once"] .p-radiobutton-box, p-radioButton[value="Once"] .p-radiobutton-box, p-radioButton:has-text("Once") .p-radiobutton-box').first();
    await onceRadio.click({ force: true });
    await page.waitForTimeout(1000);

    // Set Start Time to 2 minutes from now
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

    // Step 5: Check the Share checkbox and wait for 3 seconds
    console.log('👉 Step 5: Checking the Share checkbox...');
    const shareCheckbox = schedulerDialog.locator('p-checkbox[name="share"] .p-checkbox-box, p-checkbox:has-text("Share") .p-checkbox-box').first();
    await shareCheckbox.scrollIntoViewIfNeeded();
    await shareCheckbox.click({ force: true });
    console.log('👉 Waiting 3 seconds for AIV automatic toggling to settle...');
    await page.waitForTimeout(3500);

    // Step 6: Select Roles radio button
    console.log('👉 Step 6: Selecting Roles radio button...');
    const rolesRadio = schedulerDialog.locator('p-radiobutton[inputid="Role"] .p-radiobutton-box, p-radiobutton[value="Role"] .p-radiobutton-box, p-radiobutton:has-text("Roles") .p-radiobutton-box').first();
    await rolesRadio.click({ force: true });
    await page.waitForTimeout(2000);
    await shot(page, '04-roles-selected.png');

    // Step 7: Select Public in Visibility dropdown
    console.log('👉 Step 7: Opening Visibility dropdown...');
    const visibilityDropdown = page.locator('p-dropdown[name="visibilityTypes"]').first();
    await expect(visibilityDropdown).toBeVisible({ timeout: 10000 });

    let opened = false;
    for (const selector of ['.p-dropdown-trigger', '.p-dropdown', 'span.p-dropdown-label']) {
      try {
        console.log(`👉 Attempting click on ${selector}...`);
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

    const publicOption = page.locator('.p-dropdown-item').filter({ hasText: 'Public' }).first();
    await expect(publicOption).toBeVisible({ timeout: 5000 });
    await publicOption.click({ force: true });
    await page.waitForTimeout(2000);
    await shot(page, '05-visibility-public.png');

    // Step 8: Search Automation Tester and select the checkbox
    console.log('👉 Step 8: Searching for Automation Tester role...');
    const roleSearchInput = schedulerDialog.locator('app-share-content input[placeholder*="Search"i]:visible, .schedule-share input[placeholder*="Search"i]:visible, input[placeholder*="Search"i]:visible').first();
    await expect(roleSearchInput).toBeVisible({ timeout: 5000 });
    await roleSearchInput.click();
    await roleSearchInput.clear();
    await roleSearchInput.pressSequentially('Automation Tester', { delay: 100 });
    await page.waitForTimeout(2000);

    const roleCell = schedulerDialog.locator('app-share-content td, .sharecontent td, app-share-content .e-rowcell, .sharecontent .e-rowcell, td, .e-rowcell').filter({ hasText: /^\s*Automation Tester\s*$/i }).first();
    await expect(roleCell).toBeVisible({ timeout: 10000 });

    const roleRow = roleCell.locator('xpath=..');
    const roleCheckbox = roleRow.locator('.e-frame, .e-checkbox-wrapper, .p-checkbox-box').first();
    await roleCheckbox.scrollIntoViewIfNeeded();
    await roleCheckbox.click();
    await page.waitForTimeout(2000);
    await shot(page, '06-role-assigned.png');

    // Step 9: Go to Output tab
    console.log('👉 Step 9: Switching to Output tab...');
    const outputTab = schedulerDialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);

    // Step 10: Change Output Name to Order detail Roles
    console.log('👉 Step 10: Changing name to Order detail Roles...');
    const outputNameInput = schedulerDialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill('Order detail Roles');
    await page.waitForTimeout(1000);
    await shot(page, '07-output-name-roles.png');

    // Step 11: Click Home icon next to Path
    console.log('👉 Step 11: Clicking Home icon...');
    const homeIconBtn = schedulerDialog.locator('button:has(span.fa-home), button:has(.fa-home)').first();
    await expect(homeIconBtn).toBeVisible({ timeout: 5000 });
    await homeIconBtn.click();
    console.log('👉 Waiting 5 seconds for Select Folder dialog to load...');
    await page.waitForTimeout(5000);

    const folderDialog = page.locator('[role="dialog"]:visible, p-dialog:visible').filter({ hasText: /Select Folder/i }).first();
    await expect(folderDialog).toBeVisible({ timeout: 15000 });

    // Step 12: Search for 'Report with Roles' folder
    console.log('👉 Step 12: Searching for "Report with Roles"...');
    const searchFolderInput = folderDialog.getByPlaceholder('Search files and folders').first();
    await searchFolderInput.fill('Report with Roles');
    await page.waitForTimeout(2000);

    // Helper function to expand tree nodes dynamically only if they are collapsed
    const expandNodeIfNeeded = async (nodeName: string) => {
      console.log(`👉 Checking node "${nodeName}"...`);
      const label = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: new RegExp('^' + nodeName + '$') }).first();
      await expect(label).toBeVisible({ timeout: 10000 });

      const nodeRow = label.locator('xpath=ancestor::div[contains(@class, "mat-tree-node") or contains(@class, "tree-node")][1]');
      await expect(nodeRow).toBeVisible({ timeout: 5000 });

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

    // Expand Root folder
    await expandNodeIfNeeded('Root');

    // Step 13: Select 'Report with Roles' folder
    console.log('👉 Selecting "Report with Roles" folder...');
    const reportWithRolesFolder = folderDialog.locator('.tree_lbl_vl, label, span').filter({ hasText: 'Report with Roles' }).first();
    await expect(reportWithRolesFolder).toBeVisible({ timeout: 10000 });
    await reportWithRolesFolder.click();
    await page.waitForTimeout(1000);
    await shot(page, '08-report-with-roles-selected.png');

    // Step 14: Click Submit inside Select Folder dialog
    console.log('👉 Step 14: Clicking Submit to select path...');
    const submitPathBtn = folderDialog.getByRole('button', { name: /submit/i }).first();
    await expect(submitPathBtn).toBeVisible({ timeout: 5000 });
    await submitPathBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, '09-folder-submitted.png');

    // Step 15: Click Run button
    console.log('👉 Step 15: Clicking Run button...');
    const runBtn = schedulerDialog.getByRole('button', { name: /run/i }).first();
    await expect(runBtn).toBeVisible({ timeout: 5000 });
    await runBtn.click();
    await page.waitForTimeout(2000);
    await expect(schedulerDialog).not.toBeVisible({ timeout: 15000 }).catch(() => { });

    // Step 16: Go to Requests section
    console.log('👉 Step 16: Navigating to Requests...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);

    // Step 17: Select Schedule tab and take screenshot
    console.log('👉 Step 17: Switching to Requests Schedule tab...');
    const requestScheduleTab = page.locator('[role="tab"], li').filter({ hasText: /Schedule/i }).first();
    await requestScheduleTab.click();
    await page.waitForTimeout(1000);
    await shot(page, '10-schedule-requests.png');

    // Step 18: Wait for 2 minutes (120 seconds) for compilation
    console.log('👉 Step 18: Waiting 2 minutes for scheduled execution...');
    await page.waitForTimeout(120000);

    // Step 19: Logout Admin user and clear sessions
    console.log('👉 Step 19: Logging out Admin user...');
    await logout(page);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await page.waitForTimeout(1000);
    await shot(page, '11-logged-out.png');

    // Step 20: Login as neel / password
    console.log('👉 Step 20: Logging in as neel...');
    await loginAs(page, 'neel', 'password');
    await page.waitForTimeout(1000);
    await shot(page, '12-logged-in-neel.png');

    // Step 21: Navigate directly to Reports section
    console.log('👉 Step 21: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await assertPageLoaded(page, 'Reports');

    // Step 22: Search for 'Report with Roles' folder/files
    console.log('👉 Step 22: Searching for "Report with Roles"...');
    const gridSearchInput = page.getByPlaceholder('Search files and folders in current section').first();
    await gridSearchInput.clear();
    await gridSearchInput.fill('Report with Roles');
    await page.waitForTimeout(4000);
    await shot(page, '12-search-roles-folder.png');

    // Step 23: Verify shared report 'Order detail Roles' exists in the search results
    console.log('👉 Step 23: Verifying "Order detail Roles" file is present...');
    const sharedReportFile = page.locator('[role="gridcell"], td, .e-rowcell').filter({ hasText: 'Order detail Roles' }).first();
    await expect(sharedReportFile).toBeVisible({ timeout: 15000 });
    await sharedReportFile.click();
    await page.waitForTimeout(1000);
    await shot(page, '13-report-with-roles-folder-opened.png');

    console.log('✅ reports_share_roles completed successfully');
  });
});
