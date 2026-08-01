import { test, expect, Page } from '@playwright/test';
import { doLogin } from '../../helpers';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'datasource', 'dataset');

async function takeScreenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const filePath = path.join(SCREENSHOT_DIR, name);
  await page.screenshot({ path: filePath, timeout: 15000 });
  console.log(`Saved screenshot: ${filePath}`);

  try {
    const logFilePath = path.join(SCREENSHOT_DIR, 'step-log.json');
    let logs: any[] = [];
    if (fs.existsSync(logFilePath)) {
      logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    }
    const testInfo = test.info();
    logs.push({
      timestamp: new Date().toISOString(),
      testCase: testInfo ? testInfo.title : 'Dataset Test',
      screenshot: name,
      screenshotPath: filePath.replace(/\\/g, '/')
    });
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to write step-log.json:', e);
  }
}

test.describe('Dataset Test - Part 1 & Part 2', () => {

  test('Dataset creation flow - Part 1 & Part 2', async ({ page }) => {

    // Step 1: Go to AIV and Login
    await test.step('Go to AIV and Login', async () => {
      await doLogin(page);
      await page.waitForTimeout(2000);
    });

    // Step 2: Click hamburger icon and expand Master Data menu
    await test.step('Click hamburger icon and expand Master Data menu', async () => {
      const hamburger = page.locator('button.smenu_button, mat-toolbar button, [aria-label*="menu" i], .fa-bars, i.fa-bars, [class*="hamburger"]').first();
      await expect(hamburger).toBeVisible({ timeout: 15000 });
      await hamburger.click();
      await page.waitForTimeout(1000);

      // Locate Master Data menu
      const masterDataMenu = page.locator('text="Master Data"').first();
      await expect(masterDataMenu).toBeVisible({ timeout: 10000 });

      // If Datasets option is not yet visible under Master Data, click Master Data to expand
      const datasetsOption = page.locator('text="Datasets"').first();
      const isDatasetsVisible = await datasetsOption.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isDatasetsVisible) {
        await masterDataMenu.click();
        await page.waitForTimeout(1000);
      }

      // Take screenshot 1: Expanded Master Data / Datasource menu
      await takeScreenshot(page, '01-expand-datasource-menu.png');
    });

    // Step 3: Third option is Datasets
    await test.step('Click third option - Datasets', async () => {
      const datasetsOption = page.locator('text="Datasets"').first();
      await expect(datasetsOption).toBeVisible({ timeout: 10000 });

      // Take screenshot 2: Datasets menu option
      await takeScreenshot(page, '02-dataset-menu-option.png');

      // Click Datasets
      await datasetsOption.click();

      // Wait 3 seconds as requested
      await page.waitForTimeout(3000);

      // Take screenshot 3: Datasets page loaded
      await takeScreenshot(page, '03-datasets-page.png');
    });

    // Step 4: Search for AutoTest folder
    await test.step('Search for AutoTest folder', async () => {
      const searchBox = page.getByPlaceholder('Search files and folders in current section')
        .or(page.getByRole('searchbox'))
        .or(page.getByPlaceholder(/Search files and folders/i))
        .first();

      await expect(searchBox).toBeVisible({ timeout: 10000 });

      await searchBox.click();
      await searchBox.fill('AutoTest');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2500);

      // Take screenshot 4: Searched AutoTest folder
      await takeScreenshot(page, '04-search-autotest-folder.png');
    });

    // Step 5: Double click AutoTest folder to open it (it will be empty)
    await test.step('Double click AutoTest folder to open', async () => {
      const autoTestFolder = page.locator('table, [role="grid"], .p-datatable, body')
        .locator('text="AutoTest"')
        .first();

      const isFolderVisible = await autoTestFolder.isVisible({ timeout: 5000 }).catch(() => false);
      if (isFolderVisible) {
        await autoTestFolder.dblclick();
        await page.waitForTimeout(3000);
      }

      // Take screenshot 5: Opened AutoTest folder (empty)
      await takeScreenshot(page, '05-autotest-folder-empty.png');
    });

    // Step 6: Click Create Dataset button at bottom toolbar
    await test.step('Click Create Dataset button at bottom toolbar', async () => {
      const createDatasetBtn = page.locator('button, div, span, a')
        .filter({ hasText: /^Create Dataset$/i })
        .or(page.locator('[tooltip*="Create Dataset"]'))
        .first();

      await expect(createDatasetBtn).toBeVisible({ timeout: 10000 });
      await createDatasetBtn.click();
      await page.waitForTimeout(2500);

      // Take screenshot 6: Create Dataset screen
      await takeScreenshot(page, '06-create-dataset-screen.png');
    });

    // Step 7: Click Excel Files source type
    await test.step('Click Excel Files source type', async () => {
      const excelFilesCard = page.getByRole('heading', { name: /Excel/i })
        .or(page.getByText(/Excel Files/i))
        .or(page.locator('div, button, mat-card, span').filter({ hasText: /^Excel Files$/i }))
        .or(page.locator('h3:has-text("Excel")'))
        .first();

      await expect(excelFilesCard).toBeVisible({ timeout: 10000 });
      await excelFilesCard.click();
      await page.waitForTimeout(2000);

      // Take screenshot 7: Excel Files initial selection screen showing 2 tabs
      await takeScreenshot(page, '07-excel-files-2-tabs.png');
    });

    // Step 8 (Part 2 - Step 1): Click Select Existing Files tab
    await test.step('Click Select Existing Files tab', async () => {
      const selectExistingTab = page.getByText('Select Existing Files', { exact: false }).first();
      await expect(selectExistingTab).toBeVisible({ timeout: 10000 });
      await selectExistingTab.click();
      await page.waitForTimeout(3000);

      // Take screenshot 8: Create dataset excel file selection screen
      await takeScreenshot(page, '08-select-existing-files-tab.png');
    });

    // Step 9 (Part 2 - Step 2): Search for Ds_Test in left tree search box
    await test.step('Search for Ds_Test in Source tree', async () => {
      const treeSearchBox = page.getByPlaceholder('Search tables, columns...').first();
      await expect(treeSearchBox).toBeVisible({ timeout: 10000 });

      await treeSearchBox.click();
      await treeSearchBox.fill('Ds_Test');
      await page.waitForTimeout(2500);

      // Expand Neel folder if collapsed
      const neelFolder = page.getByText('Neel', { exact: true }).first();
      if (await neelFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isExcelVisible = await page.getByText('Ds_Test_Data.xlsx').isVisible().catch(() => false);
        if (!isExcelVisible) {
          await neelFolder.click();
          await page.waitForTimeout(1000);
        }
      }

      // Take screenshot 9: Filtered tree showing Ds_Test_Data.xlsx inside Neel folder
      await takeScreenshot(page, '09-search-ds-test-excel.png');
    });

    // Step 10 (Part 2 - Step 3): Click on Ds_Test_Data.xlsx
    await test.step('Click Ds_Test_Data.xlsx file', async () => {
      const excelFileItem = page.getByText('Ds_Test_Data.xlsx', { exact: false }).first();
      await expect(excelFileItem).toBeVisible({ timeout: 10000 });
      await excelFileItem.click();
      await page.waitForTimeout(3000);

      // Take screenshot 10: Excel file configured screen
      await takeScreenshot(page, '10-ds-test-data-configured.png');
    });

  });

});
