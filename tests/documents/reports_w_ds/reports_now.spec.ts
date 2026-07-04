import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../../helpers';

test.describe.serial('Reports Section Tests', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Reports page loads and scheduler workflow', async ({ page }) => {
    // Step 1: Navigate to Reports section
    console.log('👉 Step 1: Navigating to Reports...');
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await shot(page, '02-reports-page.png');
    await expect(page).toHaveURL(/Reports/i);

    // Step 2: Find and double-click 'Order details AutoTest' cell
    console.log('👉 Step 2: Finding Order details AutoTest cell...');
    const targetCell = page.locator('[role="gridcell"]').filter({ hasText: 'Order details AutoTest' }).first();
    await expect(targetCell).toBeVisible({ timeout: 20000 });
    await targetCell.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '03-scheduler-open.png');

    // Step 3: Scope to scheduler dialog and fill parameter inputs
    console.log('👉 Step 3: Filling parameter inputs...');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Click Parameter tab if visible
    const paramTab = dialog.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    if (await paramTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paramTab.click();
      await page.waitForTimeout(500);
    }

    // Find all editable text inputs inside dialog
    const textInputs = dialog.locator('input:not([type="radio"]):not([type="checkbox"]):not([readonly]):not([disabled]):not([type="hidden"])');
    const inputCount = await textInputs.count();
    console.log(`Found ${inputCount} editable text inputs`);

    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const currentValue = await input.inputValue().catch(() => '');
        if (currentValue === '10100') {
          await input.clear();
          await input.fill('10101');
        }
      }
    }
    await shot(page, '04-parameters-filled.png');

    // Step 4: Schedule tab - select Right Now
    console.log('👉 Step 4: Selecting Right Now schedule...');
    const scheduleTab = dialog.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);

    // Click the 'Right Now' label directly
    await page.getByText('Right Now', { exact: false }).first().click();
    await page.waitForTimeout(500);
    await shot(page, '05-schedule-rightnow.png');

    // Step 5: Output tab - set output name and format
    console.log('👉 Step 5: Configuring output...');
    const outputTab = dialog.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(500);

    const uniqueRunName = 'Run_' + Date.now();
    const outputNameInput = dialog.locator('input[name="soutputname"]').first();
    await outputNameInput.clear();
    await outputNameInput.fill(uniqueRunName);

    // Click format dropdown and select pdf
    const currentFormat = dialog.getByText('rptdocument', { exact: true }).first();
    if (await currentFormat.isVisible({ timeout: 3000 }).catch(() => false)) {
      await currentFormat.click();
      await page.waitForTimeout(300);
      await page.locator('li, [role="option"]').filter({ hasText: /^pdf$/i }).first().click();
      await page.waitForTimeout(300);
    }
    await shot(page, '06-output-setup.png');

    // Step 6: Click Run button
    console.log('👉 Step 6: Clicking Run button...');
    const runButton = dialog.getByRole('button', { name: /run/i }).first();
    await runButton.click();
    await page.waitForTimeout(2000);
    await shot(page, '07-run-clicked.png');

    // Step 7: Navigate to Requests section
    console.log('👉 Step 7: Navigating to Requests...');
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    await shot(page, '08-requests-page.png');

    // Step 8: Poll for unique run name in requests table
    console.log('👉 Step 8: Polling for run name in requests...');
    let found = false;
    for (let attempt = 1; attempt <= 12; attempt++) {
      console.log(`Attempt ${attempt}/12...`);
      await page.reload();
      await page.waitForTimeout(3000);
      
      const cell = page.locator('[role="gridcell"]').filter({ hasText: uniqueRunName }).first();
      if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
        found = true;
        console.log('✅ Run found in requests table!');
        break;
      }
    }

    expect(found).toBe(true);
    await shot(page, '09-run-verified.png');
  });
});
