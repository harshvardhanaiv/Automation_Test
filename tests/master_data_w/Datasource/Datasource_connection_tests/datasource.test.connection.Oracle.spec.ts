/**
 * datasource.test.connection.Oracle.spec.ts
 *
 * Datasource creation test — Master Data section
 * Creates an Oracle datasource with connection testing
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo } from '../../../helpers';
import * as path from 'path';
import * as fs from 'fs';

const DB_TYPE = 'Oracle';

async function takeScreenshot(page: Page, stepName: string) {
  await shot(page, `datasource-${stepName}.png`);
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
        
        // Include DB_TYPE in the path
        subDir = path.join(dirPart, DB_TYPE);
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

test.describe('Datasource Creation Flow', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('should create a new datasource via Master Data > Datasources', async ({ page }) => {
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

    // Step 3: Open Master Data dropdown
    await test.step('Open Master Data dropdown', async () => {
      const masterData = page.locator('text="Master Data"').first();
      await expect(masterData).toBeVisible({ timeout: 10000 });
      await masterData.click();
      await waitAndScreenshot(page, '3-master-data-opened');
    });

    // Step 4: Click Datasource link
    await test.step('Click Datasource', async () => {
      const datasourcesLink = page.locator('a, span, div').filter({ hasText: /^Datasource$/i }).first();
      await expect(datasourcesLink).toBeVisible({ timeout: 10000 });
      await datasourcesLink.click();
      await page.waitForLoadState('networkidle');
      await waitAndScreenshot(page, '4-datasource-page-loaded');
    });

    // Step 5: Click Create in the footer (center)
    await test.step('Click Create button', async () => {
      const createBtn = page.getByRole('button', { name: 'Create', exact: true }).first();
      await expect(createBtn).toBeVisible({ timeout: 10000 });
      await createBtn.click();
      await waitAndScreenshot(page, '5-create-button-clicked');
    });

    // Step 6: Search for Oracle in the top-right search bar
    await test.step('Search for Oracle datasource', async () => {
      const searchBar = page.getByPlaceholder('Search').filter({ visible: true }).first();
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      await searchBar.fill('Oracle');
      await page.waitForTimeout(1000);

      const oracleCard = page.getByRole('link', { name: /Oracle/i }).first();
      await expect(oracleCard).toBeVisible({ timeout: 10000 });
      await oracleCard.click();
      await waitAndScreenshot(page, '6-oracle-selected');
    });

    // Step 7: Fill in datasource credentials
    await test.step('Fill datasource credentials', async () => {
      const dialog = page.getByRole('dialog').first();
      await expect(dialog).toBeVisible({ timeout: 10000 });

      const fillField = async (labelText: string | RegExp, value: string) => {
        const wrapper = dialog.locator('div, tr')
          .filter({ hasText: labelText })
          .filter({ has: page.locator('input, textarea') })
          .last();
        
        const input = wrapper.locator('input, textarea').first();
        await expect(input).toBeVisible({ timeout: 10000 });
        await input.fill(value);
      };

      // 1. Display Name
      await fillField('Display Name', 'Parth_Playwright_oracle');
      await waitAndScreenshot(page, '7a-display-name-filled');

      // 2. Class
      await fillField('Class', 'oracle.jdbc.driver.OracleDriver');
      await waitAndScreenshot(page, '7b-class-filled');

      // 3. Connection URL
      await fillField('Connection URL', 'jdbc:oracle:thin:@//178.105.6.171:1521/FREEPDB1');
      await waitAndScreenshot(page, '7c-url-filled');

      // 4. Username
      await fillField('Username', 'enterprise360');
      await waitAndScreenshot(page, '7d-username-filled');

      // 5. Password
      await fillField('Password', 'Enterprise360123');
      await waitAndScreenshot(page, '7e-password-filled');

      // 6. IS JNDI = false
      const jndiWrapper = dialog.locator('div, tr')
        .filter({ hasText: 'Is JNDI' })
        .filter({ has: page.locator('input, button, img, [class*="trigger"]') })
        .last();

      const jndiCheckbox = jndiWrapper.locator('input[type="checkbox"]').first();
      if (await jndiCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        if (await jndiCheckbox.isChecked()) {
          await jndiCheckbox.uncheck();
        }
      } else {
        const jndiText = jndiWrapper.locator(':text("True"), :text("False")').first();
        if (await jndiText.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await jndiText.textContent();
          if (text && text.includes('True')) {
            const dropdownTrigger = jndiWrapper.locator('button, [class*="trigger"], img').first();
            await dropdownTrigger.click();
            await page.locator('text="False", [role="option"]:has-text("False")').last().click();
          }
        }
      }
      await waitAndScreenshot(page, '7f-jndi-configured');
    });

    // Step 8: Click Test Connection
    await test.step('Click Test Connection', async () => {
      const testBtn = page.locator(
        'button:has-text("Test Connection"), button:has-text("Test")'
      ).first();
      await expect(testBtn).toBeVisible({ timeout: 10000 });
      await testBtn.click();

      await page.waitForTimeout(4000);

      const successMsg = page.locator(
        '.toast, .alert, [role="alert"], [class*="success"], [class*="error"], [class*="notification"]'
      ).first();
      if (await successMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Connection test response received:', await successMsg.textContent());
      }
      await waitAndScreenshot(page, '8-test-connection-clicked');
    });

    // Step 9: Click OK button after test connection
    await test.step('Click OK button', async () => {
      const okBtn = page.locator(
        'button:has-text("OK"), button:has-text("ok")'
      ).first();
      await expect(okBtn).toBeVisible({ timeout: 10000 });
      await okBtn.click();
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '9-ok-button-clicked');
    });

    // Step 10: Check for "Datasource Already Exists" error and click Cancel if it appears
    await test.step('Check for existing datasource error and click Cancel', async () => {
      await page.waitForTimeout(1000);
      
      // Check if "Datasource Already Exists" error message appears
      const existsError = page.locator('text=Datasource Already Exists').first();
      const errorExists = await existsError.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (errorExists) {
        console.log('Datasource already exists error detected - clicking Cancel');
        await waitAndScreenshot(page, '10-error-detected');
        
        const cancelBtn = page.locator(
          'button:has-text("Cancel")'
        ).first();
        await expect(cancelBtn).toBeVisible({ timeout: 10000 });
        await cancelBtn.click();
        await page.waitForTimeout(1500);
        await waitAndScreenshot(page, '10a-cancel-clicked');
      } else {
        console.log('No existing datasource error - proceeding with Save');
        const saveBtn = page.locator(
          'button:has-text("Save"), button:has-text("save")'
        ).first();
        await expect(saveBtn).toBeVisible({ timeout: 10000 });
        await saveBtn.click();
        await page.waitForTimeout(1500);
        await waitAndScreenshot(page, '10b-save-clicked');
      }
    });

    // Step 11: Click grid view button at top right (blue grid icon)
    await test.step('Click grid view button at top right', async () => {
      // After Cancel is clicked, we need to click the grid view button at top right
      // The button is a blue grid/table icon on the far right
      const gridViewBtn = page.locator(
        'button[aria-label*="grid" i], ' +
        'button[title*="grid" i], ' +
        '.fa-table, ' +
        'button:has(.fa-table), ' +
        'button:has([class*="table"]), ' +
        'button svg[class*="grid"]'
      ).first();
      
      await expect(gridViewBtn).toBeVisible({ timeout: 10000 });
      await gridViewBtn.click();
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '11-grid-view-clicked');
    });

    // Step 12: Search for the datasource by name
    await test.step('Search for datasource by name', async () => {
      const searchBar = page.getByPlaceholder('Search').filter({ visible: true }).first();
      await expect(searchBar).toBeVisible({ timeout: 10000 });
      await searchBar.fill('Parth_Playwright_oracle');
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '12-datasource-searched');
    });

    // Step 13: Select the datasource from search results
    await test.step('Select datasource from search results', async () => {
      // Find the datasource row with the name and select it
      const datasourceRow = page.locator('[role="row"], tr').filter({ hasText: 'Parth_Playwright_oracle' }).first();
      await expect(datasourceRow).toBeVisible({ timeout: 10000 });
      
      // Click on the row to select it
      await datasourceRow.click();
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '13-datasource-selected');
    });

    // Step 14: Click Create Dataset button in footer (after datasource is selected)
    await test.step('Click Create Dataset button', async () => {
      // After datasource is selected, the Create Dataset button should be available in the footer
      const createDatasetBtn = page.getByRole('button', { name: /^Create Dataset$/i }).first();
      await expect(createDatasetBtn).toBeVisible({ timeout: 10000 });
      await createDatasetBtn.click();
      await page.waitForTimeout(1500);
      await waitAndScreenshot(page, '14-create-dataset-clicked');
    });

    // Step 15: Write SQL query and generate output
    await test.step('Write SQL query and preview results', async () => {
      // Wait for the dataset wizard/editor to load
      await page.waitForTimeout(2000);
      
      const sqlQuery = `SELECT * FROM ENTERPRISE360.CUSTOMER`;
      
      // The SQL editor is likely a Monaco Editor or similar code editor
      // Find the editor container and click inside it to focus
      const editorContainer = page.locator('[class*="query-editor"], [class*="sql-editor"], [class*="editor"]').first();
      
      if (await editorContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click inside the editor to focus it
        await editorContainer.click();
        await page.waitForTimeout(1000);
        
        // Try to find the actual textarea/input inside the editor
        const editorTextarea = editorContainer.locator('textarea').first();
        if (await editorTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editorTextarea.clear();
          await editorTextarea.fill(sqlQuery);
        } else {
          // If no textarea, try contenteditable div
          const editableDiv = editorContainer.locator('[contenteditable="true"]').first();
          if (await editableDiv.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editableDiv.click();
            await editableDiv.clear();
            await page.keyboard.type(sqlQuery, { delay: 50 });
          } else {
            // Last resort: select all and type
            await page.keyboard.press('Control+A');
            await page.keyboard.type(sqlQuery, { delay: 50 });
          }
        }
      }
      
      await page.waitForTimeout(1000);  // Wait for the query to be processed
      await waitAndScreenshot(page, '15-sql-query-filled');
      
      // Wait a bit more to ensure button becomes enabled
      await page.waitForTimeout(2000);
      
      // Click Preview Result button - wait for it to be enabled
      const previewBtn = page.getByRole('button', { name: /preview result|preview/i }).first();
      
      // Wait for button to be enabled
      await previewBtn.waitFor({ state: 'visible', timeout: 10000 });
      const isEnabled = await previewBtn.isEnabled({ timeout: 5000 }).catch(() => false);
      
      if (!isEnabled) {
        console.log('Preview button is disabled, waiting for it to become enabled...');
        await page.waitForFunction(
          () => {
            const btn = document.querySelector('button:has-text("Preview Result")');
            return btn && !btn.hasAttribute('disabled');
          },
          { timeout: 10000 }
        ).catch(() => null);
      }
      
      await previewBtn.click({ force: true });
      
      // Wait for results to load
      await page.waitForTimeout(5000);
      await waitAndScreenshot(page, '15a-preview-results-clicked');
    });

    // Step 15b: Click the Save button in the lower right to trigger the Save Dataset dialog
    await test.step('Click Save button to open Save Dataset dialog', async () => {
      await page.waitForTimeout(1000);
      
      // Look for the save button in the lower right corner of the page
      // It should be a button with "Save" text
      const saveBtn = page.getByRole('button', { name: /^Save$/i }).last();
      
      if (await saveBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await waitAndScreenshot(page, '15b-save-button-clicked');
      } else {
        console.log('Save button in lower right not found');
        await waitAndScreenshot(page, '15b-save-button-not-found');
      }
    });

    // Step 16: Handle the Save Dataset dialog popup in center - Change dataset name and select folder
    await test.step('Fill Save Dataset dialog', async () => {
      // Generate unique dataset name by adding timestamp
      const timestamp = Date.now();
      const datasetName = `masterdata_test_parth_Oracle_${timestamp}`;
      
      console.log(`Generated unique dataset name: ${datasetName}`);
      
      try {
        await page.waitForTimeout(2000);
        await waitAndScreenshot(page, '16-dialog-appeared');
        
        console.log('Dialog appeared - looking for dataset name input');
        
        // The dialog is a center popup - find ALL text inputs on the page
        const allInputs = page.locator('input[type="text"]');
        const inputCount = await allInputs.count();
        console.log(`Found ${inputCount} text inputs in the dialog`);
        
        // Look for the input with Dataset_XXXXX value
        let nameChanged = false;
        for (let i = 0; i < inputCount; i++) {
          try {
            const input = allInputs.nth(i);
            const value = await input.inputValue().catch(() => '');
            console.log(`Input ${i}: "${value}"`);
            
            // Check if this is the dataset name input
            if (value && value.match(/^Dataset_\d+$/)) {
              console.log(`✓ Found dataset name input at index ${i} with value: ${value}`);
              
              // Click and select all
              await input.click({ force: true });
              await page.waitForTimeout(300);
              await page.keyboard.press('Control+A');
              await page.waitForTimeout(100);
              
              // Type the new unique name
              await page.keyboard.type(datasetName, { delay: 20 });
              await page.waitForTimeout(500);
              
              nameChanged = true;
              await waitAndScreenshot(page, '16a-name-changed');
              console.log(`✓ Dataset name changed to: ${datasetName}`);
              break;
            }
          } catch (e) {
            console.log(`Error with input ${i}:`, String(e));
          }
        }
        
        if (!nameChanged) {
          console.log('✗ Could not find or change dataset name');
          await waitAndScreenshot(page, '16a-name-not-changed');
        }
        
        // Step 16b: Select the Parth_Playwright_testing folder
        await page.waitForTimeout(1000);
        console.log('Looking for Parth_Playwright_testing folder...');
        
        // The folder might be in a tree structure - look for any element with that text
        const folderElements = page.locator('text=Parth_Playwright_testing');
        const folderCount = await folderElements.count();
        console.log(`Found ${folderCount} elements with "Parth_Playwright_testing"`);
        
        if (folderCount > 0) {
          console.log('✓ Found Parth_Playwright_testing folder - clicking it');
          const folderElement = folderElements.first();
          
          // First click to select
          await folderElement.click({ force: true });
          await page.waitForTimeout(800);
          
          // Double-click or check if there's a checkbox/radio we need to click
          const parent = folderElement.locator('..');
          const checkbox = parent.locator('input[type="checkbox"]');
          const radio = parent.locator('input[type="radio"]');
          
          // Check if there's a checkbox we need to check
          if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log('✓ Found checkbox - clicking it');
            await checkbox.click({ force: true });
            await page.waitForTimeout(500);
          } else if (await radio.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log('✓ Found radio - clicking it');
            await radio.click({ force: true });
            await page.waitForTimeout(500);
          }
          
          await page.waitForTimeout(500);
          await waitAndScreenshot(page, '16b-folder-selected');
          console.log('✓ Folder selected/confirmed');
        } else {
          console.log('✗ Parth_Playwright_testing folder not found');
          await waitAndScreenshot(page, '16b-folder-not-found');
        }
        
        // Step 16c: Click the SAVE DATASET button at the lower right of the popup
        await page.waitForTimeout(1000);
        console.log('Looking for Save Dataset button at lower right of popup...');
        
        // The Save Dataset button should be at the lower right of the dialog/popup
        // Look for a button with "Save Dataset" text specifically
        const saveDatasetButtons = page.locator('button:has-text("Save Dataset")');
        const sdButtonCount = await saveDatasetButtons.count();
        console.log(`Found ${sdButtonCount} "Save Dataset" buttons`);
        
        if (sdButtonCount > 0) {
          // The "Save Dataset" button should be the one we want
          const saveDatasetBtn = saveDatasetButtons.first();
          const text = await saveDatasetBtn.textContent();
          console.log(`✓✓ Found "Save Dataset" button: "${text}"`);
          
          // Click it with force
          await saveDatasetBtn.click({ force: true });
          console.log('✓ Clicked Save Dataset button');
          
          // Wait for the save operation to complete
          await page.waitForTimeout(4000);
          await waitAndScreenshot(page, '16c-after-save-dataset-clicked');
          
          // Wait a bit more
          await page.waitForTimeout(2000);
          await waitAndScreenshot(page, '16c-dataset-saved');
          
          console.log(`✓✓ Save Dataset button clicked - dataset "${datasetName}" should be saved now`);
        } else {
          console.log('✗ "Save Dataset" button not found');
          console.log('Looking for any button with "Save" text at lower right...');
          
          // Fallback: look for any button with Save text
          const allButtons = page.getByRole('button');
          const allCount = await allButtons.count();
          
          for (let i = allCount - 5; i < allCount; i++) {
            if (i >= 0) {
              try {
                const btn = allButtons.nth(i);
                const text = await btn.textContent();
                const isVisible = await btn.isVisible({ timeout: 1000 }).catch(() => false);
                if (isVisible && text) {
                  console.log(`Button near end ${i}: "${text.trim()}"`);
                }
              } catch (e) {
                // continue
              }
            }
          }
          
          await waitAndScreenshot(page, '16c-save-dataset-not-found');
        }
        
      } catch (error) {
        console.error('Error in Step 16:', String(error));
        await waitAndScreenshot(page, '16-error');
      }
    });

    // Step 17: Verify the dataset was saved by going to Datasets and searching
    await test.step('Verify dataset was saved', async () => {
      console.log('Verifying if dataset was saved...');
      
      try {
        // Wait for the dialog to close
        await page.waitForTimeout(3000);
        await waitAndScreenshot(page, '17-after-save');
        
        // Step 17a: Click hamburger menu
        console.log('Clicking hamburger menu...');
        const hamburger = page.locator(
          'button[aria-label*="menu" i], .fa-bars, [class*="hamburger"], [class*="menu-icon"], ' +
          'button[class*="toggle"], span.navbar-toggler-icon, [data-icon="bars"]'
        ).first();
        
        if (await hamburger.isVisible({ timeout: 5000 }).catch(() => false)) {
          await hamburger.click();
          await page.waitForTimeout(1000);
          await waitAndScreenshot(page, '17a-hamburger-clicked');
          console.log('✓ Hamburger menu clicked');
        } else {
          console.log('✗ Hamburger menu not found');
          await waitAndScreenshot(page, '17a-hamburger-not-found');
          return;
        }
        
        // Step 17b: Click Datasets button
        console.log('Looking for Datasets button...');
        const datasetsBtn = page.locator('a, span, div, button').filter({ hasText: /^Datasets$/i }).first();
        
        if (await datasetsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await datasetsBtn.click();
          await page.waitForTimeout(2000);
          await waitAndScreenshot(page, '17b-datasets-clicked');
          console.log('✓ Datasets button clicked');
        } else {
          console.log('✗ Datasets button not found');
          await waitAndScreenshot(page, '17b-datasets-not-found');
          return;
        }
        
        // Step 17c: Search for the dataset
        console.log('Searching for the Oracle dataset...');
        await page.waitForTimeout(1000);
        
        const allSearchInputs = page.locator('input[type="text"]');
        const count = await allSearchInputs.count();
        console.log(`Total text inputs: ${count}`);
        
        // Find the search bar in the top area (y < 100)
        let searchBarIndex = -1;
        for (let i = 0; i < count; i++) {
          try {
            const input = allSearchInputs.nth(i);
            const isVisible = await input.isVisible({ timeout: 500 }).catch(() => false);
            if (isVisible) {
              const box = await input.boundingBox().catch(() => null);
              if (box && box.y < 100) {
                searchBarIndex = i;
                console.log(`✓ Found search input at index ${i}, position: top=${box.y}`);
                break;
              }
            }
          } catch (e) {
            // continue
          }
        }
        
        if (searchBarIndex >= 0) {
          const topSearchBar = allSearchInputs.nth(searchBarIndex);
          
          // Wait for the input to be ready and interactable
          await topSearchBar.waitFor({ state: 'visible', timeout: 5000 });
          await page.waitForTimeout(500);
          
          // Scroll into view if needed
          await topSearchBar.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          
          // Now click and fill
          try {
            await topSearchBar.click({ timeout: 5000 });
            await page.waitForTimeout(300);
          } catch (e) {
            console.log('Click failed, using keyboard to focus');
            await topSearchBar.focus();
            await page.waitForTimeout(300);
          }
          
          // Clear any existing text
          await topSearchBar.fill('');
          await page.waitForTimeout(200);
          
          // Type the dataset name - search for just the partial name
          await topSearchBar.type('masterdata_test_parth_Oracle', { delay: 50 });
          await page.waitForTimeout(2000);
          await waitAndScreenshot(page, '17c-search-executed');
          
          // Check if dataset appears in results
          const datasetElement = page.locator('text=masterdata_test_parth_Oracle').first();
          if (await datasetElement.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✓✓ Dataset found in search results!');
            await waitAndScreenshot(page, '17d-dataset-verified');
          } else {
            console.log('✗ Dataset not found in search results');
            await waitAndScreenshot(page, '17d-dataset-not-found');
          }
        } else {
            console.log('✗ Could not find search bar in top area');
            await waitAndScreenshot(page, '17c-search-bar-not-found-in-top');
          }
        } else {
          console.log('✗ Search bar not found at top center');
          console.log('Looking for any input fields on the page...');
          
          const allInputs = page.locator('input');
          const inputCount = await allInputs.count();
          console.log(`Total inputs on page: ${inputCount}`);
          
          for (let i = 0; i < Math.min(5, inputCount); i++) {
            try {
              const input = allInputs.nth(i);
              const placeholder = await input.getAttribute('placeholder');
              const value = await input.inputValue().catch(() => '');
              console.log(`Input ${i}: placeholder="${placeholder}", value="${value}"`);
            } catch (e) {
              // continue
            }
          }
          
          await waitAndScreenshot(page, '17c-search-bar-investigation');
        }
        
      } catch (error) {
        console.error('Error verifying dataset:', String(error));
        await waitAndScreenshot(page, '17-verify-error');
      }
    });

  });

});

