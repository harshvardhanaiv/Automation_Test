import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot } from './helpers';

test.describe.serial('AIV Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Reports page loads and scheduler works', async ({ page }) => {
    // Step 1: Navigate to Reports section
    await goTo(page, URLS.reports);
    await page.waitForTimeout(1000);
    await shot(page, '02-reports-page.png');

    // Step 2: Find 'Customers details' and double-click to open scheduler
    const customerCell = page.getByRole('gridcell').filter({ hasText: 'Customers details' }).first();
    await expect(customerCell).toBeVisible({ timeout: 10000 });
    await customerCell.dblclick();
    await page.waitForTimeout(1500);
    await shot(page, '03-scheduler-open.png');

    // Step 3: Parameter tab - fill empty text fields with '1'
    const paramTab = page.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    if (await paramTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paramTab.click();
      await page.waitForTimeout(500);
      // Only fill visible text inputs that are inside the parameter tab content
      const textInputs = page.locator('input[type="text"]:visible');
      const count = await textInputs.count();
      for (let i = 0; i < count; i++) {
        const input = textInputs.nth(i);
        const value = await input.inputValue();
        if (value === '') {
          await input.fill('1');
        }
      }
    }
    await shot(page, '04-parameters-filled.png');

    // Step 4: Schedule tab - select 'Right Now'
    const scheduleTab = page.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(500);
    const rightNowRadio = page.locator('input[type="radio"]').filter({ has: page.locator('..') }).filter({ hasText: /right now/i }).first();
    if (await rightNowRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rightNowRadio.check({ force: true });
    } else {
      // Try finding by label
      const rightNowLabel = page.locator('label').filter({ hasText: /right now/i }).first();
      if (await rightNowLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rightNowLabel.click();
      }
    }
    await shot(page, '05-schedule-rightnow.png');

    // Step 5: Output tab - set name and format
    const outputTab = page.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(500);
    const outputNameInput = page.locator('input[name="soutputname"]').first();
    await expect(outputNameInput).toBeVisible({ timeout: 5000 });
    const uniqueName = 'Run_' + Date.now();
    await outputNameInput.clear();
    await outputNameInput.fill(uniqueName);
    
    // Change format dropdown to pdf
    const formatDropdown = page.locator('select').filter({ has: page.locator('option[value="rptdocument"]') }).first();
    if (await formatDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await formatDropdown.selectOption('pdf');
    }
    await shot(page, '06-output-setup.png');

    // Step 6: Click Run button
    const runButton = page.getByRole('button', { name: /run/i }).first();
    await expect(runButton).toBeVisible({ timeout: 5000 });
    await runButton.click();
    await page.waitForTimeout(1000);
    await shot(page, '07-run-clicked.png');

    // Step 7: Navigate to Requests section
    await goTo(page, URLS.requests);
    await page.waitForTimeout(1000);
    await shot(page, '08-requests-page.png');

    // Step 8: Poll for the unique run name
    let found = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      await page.reload();
      await page.waitForTimeout(3000);
      const cell = page.getByRole('gridcell').filter({ hasText: uniqueName }).first();
      if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await shot(page, '09-run-verified.png');
  });

});