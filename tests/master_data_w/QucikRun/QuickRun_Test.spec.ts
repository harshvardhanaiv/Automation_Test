/**
 * QuickRun_Test.spec.ts
 *
 * Quick run test — Login and Grid View steps only
 * Used for rapid testing and step development
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo } from '../../helpers';
import * as path from 'path';
import * as fs from 'fs';

const TEST_TYPE = 'QuickRun';

async function takeScreenshot(page: Page, stepName: string) {
  await shot(page, `quickrun-${stepName}.png`);
}

async function waitAndScreenshot(page: Page, stepName: string, ms: number = 3000) {
  await page.waitForTimeout(ms);
  await takeScreenshot(page, stepName);
}

async function shot(page: Page, name: string) {
  let subDir = '';
  let testName = '';
  try {
    const info = test.info();
    if (info) {
      testName = info.title;
      if (info.file) {
        const testsDir = path.join(process.cwd(), 'tests');
        const relativePath = path.relative(testsDir, info.file);
        const dirPart = path.dirname(relativePath);
        
        // Include TEST_TYPE in the path
        subDir = path.join(dirPart, TEST_TYPE);
      }
    }
  } catch (e) {
    // fallback if test.info() is not available
  }

  const finalDir = path.join('screenshots', subDir);
  const finalPath = path.join(finalDir, name);
  
  // Ensure the directory exists
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch (e) {
    console.error(`Failed to create directory ${finalDir}:`, e);
  }

  // Playwright screenshot() automatically creates parent directories
  await page.screenshot({ path: finalPath, timeout: 15000 }).catch((err) => {
    console.error(`Failed to capture screenshot at ${finalPath}:`, err);
  });

  // Append step to log file
  try {
    const logFilePath = path.join(finalDir, 'step-log.json');
    let logs = [];
    if (fs.existsSync(logFilePath)) {
      logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    }
    logs.push({
      timestamp: new Date().toISOString(),
      testCase: testName,
      screenshot: name,
      screenshotPath: finalPath.replace(/\\/g, '/') // standard Unix slashes
    });
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to log step:', e);
  }
}

test.describe('Quick Run Flow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Quick Run - Login and Grid View', async ({ page }) => {
    // Step 1: Navigate to Datasource page
    await test.step('Navigate to Datasource page', async () => {
      await goTo(page, URLS.datasource);
      await waitAndScreenshot(page, '1-datasource-page');
    });

    // Step 2: Click hamburger icon at top left
    await test.step('Click hamburger icon', async () => {
      const hamburger = page.locator(
        'button[aria-label*="menu" i], .fa-bars, [class*="hamburger"], [class*="menu-icon"], ' +
        'button[class*="toggle"], span.navbar-toggler-icon, [data-icon="bars"]'
      ).first();
      await expect(hamburger).toBeVisible({ timeout: 15000 });
      await hamburger.click();
      await waitAndScreenshot(page, '2-hamburger-clicked');
    });

    // Step 3: Open Documents section
    await test.step('Open Documents section', async () => {
      const documentsBtn = page.locator('a, span, div, button').filter({ hasText: /^Documents$/i }).first();
      await expect(documentsBtn).toBeVisible({ timeout: 10000 });
      await documentsBtn.click();
      await page.waitForTimeout(1000);
      await waitAndScreenshot(page, '3-documents-opened');
    });

    // Step 4: Select Quick Run from Documents
    await test.step('Select Quick Run from Documents', async () => {
      const quickRunBtn = page.locator('a, span, div, button').filter({ hasText: /^Quick Run$/i }).first();
      await expect(quickRunBtn).toBeVisible({ timeout: 10000 });
      await quickRunBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await waitAndScreenshot(page, '4-quick-run-selected');
    });

    // Step 5: Click Create Quick Run button
    await test.step('Click Create Quick Run button', async () => {
      const createBtn = page.getByRole('button', { name: 'Create' }).first();
      await expect(createBtn).toBeVisible({ timeout: 10000 });
      await createBtn.click();
      await page.waitForTimeout(2000);
      await waitAndScreenshot(page, '5-create-quick-run-clicked');
    });

    // Step 6: Click Select Report button
    await test.step('Click Select Report button', async () => {
      const selectReportBtn = page.getByRole('button', { name: 'Select Report' }).first();
      await expect(selectReportBtn).toBeVisible({ timeout: 10000 });
      await selectReportBtn.click();
      await page.waitForTimeout(2000);
      await waitAndScreenshot(page, '6-select-report-clicked');
    });

    // Step 7: Search for Parth_Barot in the search bar
    await test.step('Search for Parth_Barot', async () => {
      // Find any visible input on the page and fill it with the search term
      const searchInputs = page.locator('input');
      const inputCount = await searchInputs.count();
      
      // Try to find the search input - usually it should be visible
      let found = false;
      for (let i = 0; i < inputCount; i++) {
        const input = searchInputs.nth(i);
        const isVisible = await input.isVisible({ timeout: 1000 }).catch(() => false);
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        
        if (isVisible && (placeholder.toLowerCase().includes('search') || placeholder === '')) {
          await input.fill('Parth_Barot');
          found = true;
          break;
        }
      }
      
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '7-search-parth-barot');
    });

    // Step 8: Click the dropdown arrow next to Parth_Barot folder
    await test.step('Click dropdown arrow next to Parth_Barot', async () => {
      // Find the Parth_Barot folder element and locate the dropdown arrow next to it
      const parthBarotFolder = page.locator('text=Parth_Barot').first();
      await expect(parthBarotFolder).toBeVisible({ timeout: 10000 });
      
      // Find the parent container and look for the dropdown arrow (usually a chevron/caret icon)
      const folderRow = parthBarotFolder.locator('..');
      const dropdownArrow = folderRow.locator('button, [class*="expand"], [class*="toggle"], svg').first();
      
      await dropdownArrow.click({ force: true });
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '8-dropdown-arrow-clicked');
    });

    // Step 9: Click on "Copy_Order details.rptdes..." file
    await test.step('Click on Copy_Order details report', async () => {
      // Find and click on the Copy_Order details file
      const reportFile = page.locator('text=/Copy_Order details/i').first();
      await expect(reportFile).toBeVisible({ timeout: 10000 });
      await reportFile.click();
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '9-copy-order-details-selected');
    });

    // Step 10: Click Submit button in the Select Report dialog
    await test.step('Click Submit button after report selection', async () => {
      const submitBtn = page.getByRole('button', { name: 'Submit' }).first();
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await waitAndScreenshot(page, '10-submit-report-clicked');
    });

    // Step 11: Fill in Quick Run Name with unique number
    await test.step('Fill in Quick Run Name', async () => {
      // Generate a unique number for the quick run name
      const timestamp = Date.now();
      const quickRunName = `Parth_playwright_test_${timestamp}`;
      
      console.log(`Generated Quick Run Name: ${quickRunName}`);
      
      // Find the Quick Run Name input field
      const quickRunNameInput = page.locator('input[placeholder*="Parth" i], input').filter({ hasText: '' }).nth(1);
      
      // Try to find the input by locating the text "Quick Run Name" and then getting the input below it
      const quickRunNameLabel = page.locator('text=Quick Run Name').first();
      const labelParent = quickRunNameLabel.locator('..');
      const input = labelParent.locator('input').first();
      
      // Clear and fill the input
      await input.clear();
      await input.fill(quickRunName);
      await page.waitForTimeout(1000);
      await waitAndScreenshot(page, '11-quick-run-name-filled');
      
      console.log(`Quick Run Name filled: ${quickRunName}`);
    });

    // Step 12: Fill in OrderNumber parameter
    await test.step('Fill in OrderNumber parameter', async () => {
      // Find the OrderNumber input field
      const orderNumberLabel = page.locator('text=OrderNumber').first();
      const labelParent = orderNumberLabel.locator('..');
      const orderNumberInput = labelParent.locator('input').first();
      
      // Clear and fill with the parameter value
      await orderNumberInput.clear();
      await orderNumberInput.fill('10100');
      await page.waitForTimeout(1000);
      await waitAndScreenshot(page, '12-parameter-filled');
      
      console.log('OrderNumber parameter filled: 10100');
    });

    // Step 13: Click final Submit button
    await test.step('Click final Submit button', async () => {
      // Find the final Submit button (should be at the bottom right)
      const submitBtn = page.getByRole('button', { name: 'Submit' }).last();
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await waitAndScreenshot(page, '13-final-submit-clicked');
      
      console.log('Final Submit button clicked - Quick Run created');
    });

  });

});
