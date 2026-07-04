import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from './helpers';

test.describe.serial('AIV Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('login and navigate to reports', async ({ page }) => {
    // Step 1-4: Login
    await page.goto('https://aiv.test.oneaiv.com:8086/aiv/');
    await page.fill("input[placeholder='Your email']", 'Admin');
    await page.fill("input[placeholder='Password']", 'Ganesh04');
    await page.click("button:has-text('Login')");
    
    // Step 5: Wait for app shell and screenshot
    await page.waitForSelector("input[placeholder='Search files and folders']", { timeout: 20000 });
    await shot(page, '01-login-success.png');
    
    // Step 6: Navigate to Reports
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports');
    await shot(page, '02-reports-page.png');
  });

  test('open scheduler for Customers details', async ({ page }) => {
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports');
    
    // Step 7: Find and double-click Customers details
    const cell = page.locator('[role="gridcell"]').filter({ hasText: 'Customers details' }).first();
    await cell.dblclick();
    await page.waitForTimeout(2000);
    await shot(page, '03-scheduler-open.png');
  });

  test('fill parameters tab', async ({ page }) => {
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports');
    const cell = page.locator('[role="gridcell"]').filter({ hasText: 'Customers details' }).first();
    await cell.dblclick();
    await page.waitForTimeout(2000);
    
    // Step 8: Click Parameter tab and fill empty text fields
    const paramTab = page.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    if (await paramTab.isVisible()) {
      await paramTab.click();
      await page.waitForTimeout(1000);
      const emptyInputs = page.locator('input:not([value])');
      const count = await emptyInputs.count();
      for (let i = 0; i < count; i++) {
        await emptyInputs.nth(i).fill('1');
      }
    }
    await shot(page, '04-parameters-filled.png');
  });

  test('set schedule to Right Now', async ({ page }) => {
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports');
    const cell = page.locator('[role="gridcell"]').filter({ hasText: 'Customers details' }).first();
    await cell.dblclick();
    await page.waitForTimeout(2000);
    
    // Step 9: Click Schedule tab and select Right Now
    const scheduleTab = page.locator('[role="tab"]').filter({ hasText: /schedule/i }).first();
    await scheduleTab.click();
    await page.waitForTimeout(1000);
    const rightNowRadio = page.locator('input[type="radio"]').filter({ hasText: /right now/i }).first();
    if (await rightNowRadio.isVisible()) {
      await rightNowRadio.check();
    }
    await shot(page, '05-schedule-rightnow.png');
  });

  test('configure output and run report', async ({ page }) => {
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports');
    const cell = page.locator('[role="gridcell"]').filter({ hasText: 'Customers details' }).first();
    await cell.dblclick();
    await page.waitForTimeout(2000);
    
    // Step 10: Click Output tab and configure
    const outputTab = page.locator('[role="tab"]').filter({ hasText: /output/i }).first();
    await outputTab.click();
    await page.waitForTimeout(1000);
    
    const outputNameInput = page.locator('input[name="soutputname"]');
    const uniqueName = 'Run_' + Date.now();
    await outputNameInput.clear();
    await outputNameInput.fill(uniqueName);
    
    // Change format to pdf
    const formatDropdown = page.locator('select').filter({ hasText: 'rptdocument' }).first();
    if (await formatDropdown.isVisible()) {
      await formatDropdown.selectOption('pdf');
    }
    await shot(page, '06-output-setup.png');
    
    // Step 11: Click Run button
    await page.locator('button:has-text("Run")').first().click();
    await page.waitForTimeout(2000);
    await shot(page, '07-run-clicked.png');
    
    // Step 12: Navigate to Requests
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/Request/Request');
    await shot(page, '08-requests-page.png');
    
    // Step 13: Poll for the unique run name
    let found = false;
    for (let i = 0; i < 12; i++) {
      await page.reload();
      await page.waitForTimeout(3000);
      const requestCell = page.locator('[role="gridcell"]').filter({ hasText: uniqueName }).first();
      if (await requestCell.isVisible({ timeout: 1000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await shot(page, '09-run-verified.png');
  });
});