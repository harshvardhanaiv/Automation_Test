import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../../helpers';

test.describe.serial('AIV Reports - Full Workflow', () => {
  let uniqueRunName: string;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Complete Reports workflow', async ({ page, context }) => {
    // Step 1: Navigate to Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await shot(page, '02-reports-page.png');
    await expect(page).toHaveURL(/Reports/i);

    // Step 2: Hamburger menu
    console.log('👉 Step 2: Clicking hamburger menu...');
    const hamburger = page.locator('button.smenu_button').first();
    await hamburger.click();
    await page.waitForTimeout(500);
    await shot(page, '02b-sidebar-open.png');
    await hamburger.click();
    await page.waitForTimeout(500);

    // Step 3: Find and double-click 'Order details AutoTest'
    console.log('👉 Step 3: Finding Order details AutoTest...');
    const targetCell = page.locator('[role="gridcell"]').filter({ hasText: 'Order details AutoTest' }).first();
    await targetCell.scrollIntoViewIfNeeded();
    await targetCell.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '03-scheduler-open.png');

    // Step 4: Parameter tab - fill inputs
    console.log('👉 Step 4: Filling parameter inputs...');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const paramTab = dialog.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    if (await paramTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await paramTab.click();
      await page.waitForTimeout(500);
    }

    const textInputs = dialog.locator('input:not([type="radio"]):not([type="checkbox"]):not([readonly]):not([disabled]):not([type="hidden"])');
    const inputCount = await textInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const currentValue = await input.inputValue();
        if (currentValue === '10100') {
          await input.clear();
          await input.fill('10101');
        }
      }
    }
    await shot(page, '04-parameters-filled.png');

    // Step 5: Schedule tab - Once option
    console.log('👉 Step 5: Setting schedule to Once...');
    const scheduleTab = dialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);

    await page.getByText('Once', { exact: false }).first().click();
    await page.waitForTimeout(300);

    const startTimeInput = dialog.locator('input').filter({ has: page.locator('[placeholder*="DD/MM/YYYY"]') }).first();
    if (!(await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      const allInputs = dialog.locator('input:not([type="radio"]):not([type="checkbox"])');
      const count = await allInputs.count();
      for (let i = 0; i < count; i++) {
        const inp = allInputs.nth(i);
        const placeholder = await inp.getAttribute('placeholder').catch(() => '');
        if (placeholder && placeholder.includes('DD/MM/YYYY')) {
          await inp.clear();
          const now = new Date();
          now.setSeconds(now.getSeconds() + 30);
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          await inp.fill(`${day}/${month}/${year} ${hours}:${minutes}:${seconds}`);
          break;
        }
      }
    } else {
      await startTimeInput.clear();
      const now = new Date();
      now.setSeconds(now.getSeconds() + 30);
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      await startTimeInput.fill(`${day}/${month}/${year} ${hours}:${minutes}:${seconds}`);
    }
    await shot(page, '05-schedule-once.png');

    // Step 6: Output tab
    console.log('👉 Step 6: Setting output name...');
    const outputTab = dialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(500);

    uniqueRunName = 'Run_' + Date.now();
    const outputNameInput = dialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill(uniqueRunName);

    // Set format to rptdocument
    const currentFormat = dialog.getByText('rptdocument', { exact: true }).first();
    if (await currentFormat.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currentFormat.click();
      await page.locator('li, [role="option"]').filter({ hasText: /^rptdocument$/i }).first().click();
    }
    await shot(page, '06-output-setup.png');

    // Step 7: Click Run
    console.log('👉 Step 7: Clicking Run...');
    const runButton = dialog.getByRole('button', { name: /run/i }).first();
    await runButton.click();
    await page.waitForTimeout(2000);
    await expect(dialog).not.toBeVisible({ timeout: 15000 }).catch(() => {});
    await shot(page, '07-run-clicked.png');

    // Step 8: Wait for background processing
    console.log('👉 Step 8: Waiting 35 seconds for report processing...');
    await page.waitForTimeout(35000);

    // Step 9: Search for the unique run name
    console.log('👉 Step 9: Searching for the report...');
    const searchBox = page.getByRole('searchbox').first();
    await searchBox.clear();
    await searchBox.fill(uniqueRunName);
    await page.waitForTimeout(2000);

    // Step 10: Click refresh icon
    console.log('👉 Step 10: Refreshing grid...');
    const refreshBtn = page.locator('.fa-arrow-rotate-right, .fa-rotate-90').first();
    if (await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await refreshBtn.click();
    }
    await page.waitForTimeout(3000);

    // Wait for the search result row
    const resultRow = page.locator('[role="gridcell"]').filter({ hasText: uniqueRunName }).first();
    await resultRow.scrollIntoViewIfNeeded();
    await resultRow.waitFor({ state: 'visible', timeout: 30000 });

    // Step 11: Double-click the result cell
    console.log('👉 Step 11: Opening the report...');
    await resultRow.dblclick();

    // Step 12: Wait for new tab and take screenshot
    console.log('👉 Step 12: Waiting for report in new tab...');
    const newPagePromise = new Promise<Page>((resolve) => {
      context.on('page', (newPage) => {
        resolve(newPage);
      });
    });
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load', { timeout: 90000 });
    await newPage.waitForTimeout(60000);
    await shot(newPage, '07b-executed-report.png');
    await newPage.close();
  });
});