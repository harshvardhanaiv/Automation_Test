/**
 * 19-sqlbuddy.spec.ts
 *
 * Daily regression — SQLBuddy Dataset Creation
 *
 * Workflow:
 *   - Login to AIV application
 *   - Navigate to Datasets page
 *   - Click Create Dataset
 *   - Fill Dataset Name as 'sqlbuddy'
 *   - Click Existing Connections -> Select 'testing' database connection
 *   - Fill Monaco editor with query "select * from Employees"
 *   - Click Preview Result
 *   - Save the dataset
 *   - Search and verify creation
 *   - Cleanup (delete the created dataset)
 */

import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot } from '../helpers';

test.use({ viewport: { width: 1366, height: 768 } });

test.describe.serial('SQL Buddy Dataset Creation', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Create and verify sqlbuddy dataset', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout

    // 1. Navigate to Datasets page
    await goTo(page, URLS.datasets);
    await shot(page, 'sqlbuddy-01-datasets-loaded.png');

    // 2. Click Create Dataset button
    const createBtn = page.getByRole('button', { name: /create dataset/i })
      .or(page.locator('button:has-text("Create Dataset")'))
      .first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'sqlbuddy-02-create-dialog.png');

    // 3. Wait for the dialog to appear and name it
    const dialog = page.locator('.p-dialog, [role="dialog"]:not(.e-contextmenu-wrapper)').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const nameInput = dialog.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('sqlbuddy');
    await page.waitForTimeout(500);
    await shot(page, 'sqlbuddy-03-name-typed.png');

    // 4. Click Existing Connections
    const existingConnections = dialog.getByText('Existing Connections', { exact: false })
      .or(dialog.locator('text=Existing Connections'))
      .first();
    await expect(existingConnections).toBeVisible({ timeout: 10000 });
    await existingConnections.click();
    await page.waitForTimeout(1500);
    await shot(page, 'sqlbuddy-04-connections-loaded.png');

    // 5. Select "testing" connection
    const testingConnection = dialog.getByText('CafeDB', { exact: true })
      .or(dialog.locator('text=CafeDB'))
      .first();
    await expect(testingConnection).toBeVisible({ timeout: 10000 });
    await testingConnection.click();
    await page.waitForTimeout(2000);
    await shot(page, 'sqlbuddy-05-query-editor-loaded.png');

    // 6. Enter query in SQL Monaco Editor
    const monacoEditor = page.locator('.monaco-editor').first();
    await expect(monacoEditor).toBeVisible({ timeout: 20000 });
    await monacoEditor.click();
    await page.waitForTimeout(500);

    const queryInput = monacoEditor.locator('textarea').first();
    await queryInput.focus();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('select * from Employees');
    await page.waitForTimeout(1000);
    await shot(page, 'sqlbuddy-06-query-typed.png');

    // 7. Preview Result
    // Use the keyboard shortcut (Shift+Enter) to trigger preview
    await queryInput.focus();
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(1000);

    // Also click the actual 'Preview' button if visible (excluding helper text)
    const previewBtn = page.getByRole('button', { name: /preview/i }).first();
    if (await previewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewBtn.click();
    }
    await page.waitForTimeout(3000);
    await shot(page, 'sqlbuddy-07-preview-clicked.png');

    // 7.5. Click AIV SQL Buddy button (sparkles button)
    const sqlBuddyBtn = page.locator('button:has(.fa-sparkles), button:has(.pi-sparkles), button[title*="SQL Buddy" i]').first();
    await expect(sqlBuddyBtn).toBeVisible({ timeout: 10000 });
    await sqlBuddyBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'sqlbuddy-07b-buddy-panel-opened.png');

    // Select 'Employees' table in Context Tables
    const tableDropdown = page.locator('p-multiselect').filter({ hasText: /Add more tables/i }).or(page.getByText('Add more tables...')).first();
    await expect(tableDropdown).toBeVisible({ timeout: 10000 });
    await tableDropdown.click();
    await page.waitForTimeout(1000);

    const option = page.locator('.p-multiselect-item').filter({ hasText: /^Employees$/i }).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
    await page.waitForTimeout(500);

    // Close dropdown overlay by clicking prompt textarea directly
    const promptTextarea = page.locator('textarea[placeholder*="Write in simple language" i]').first();
    await expect(promptTextarea).toBeVisible({ timeout: 10000 });
    await promptTextarea.click({ force: true });
    await page.waitForTimeout(800);
    await shot(page, 'sqlbuddy-07c-employees-selected.png');

    // Type prompt in AIV SQL Buddy input field
    await promptTextarea.fill("Show all employees who have a phone number containing '7700' sorted by last name.");
    await page.waitForTimeout(500);

    // Click Send/Generate button
    const sendPromptBtn = page.locator('button.send-btn, button:has(.pi-arrow-up), button:has(.fa-arrow-up)').first();
    await expect(sendPromptBtn).toBeVisible({ timeout: 10000 });
    await sendPromptBtn.click();
    await page.waitForTimeout(6000); // Wait for query to generate
    await shot(page, 'sqlbuddy-07d-query-generated.png');

    // Click Publish button to write the query to Monaco Editor
    const publishBtn = page.locator('.response-publish-btn, button:has-text("Publish"), button[title*="Publish" i], [class*="publish-btn"]').first();
    await expect(publishBtn).toBeVisible({ timeout: 15000 });
    await publishBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'sqlbuddy-07e-query-published.png');

    // Preview the published query
    await queryInput.focus();
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(1000);
    if (await previewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewBtn.click();
    }
    await page.waitForTimeout(3000);
    await shot(page, 'sqlbuddy-07f-published-preview.png');

    // 8. Save/Create Dataset
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();

    // Check if Save confirmation dialog/modal appears, and fill if present
    const confirmDialog = page.locator('.p-dialog, [role="dialog"]').filter({ hasNot: page.locator('.e-contextmenu-wrapper') }).last();
    if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const modalNameInput = confirmDialog.locator('input[type="text"]').first();
      if (await modalNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modalNameInput.click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('Backspace');
        await page.keyboard.type('sqlbuddy');
      }
      const confirmSaveBtn = confirmDialog.getByRole('button', { name: /save/i }).first();
      await confirmSaveBtn.click();
    }
    
    // Wait for saving to complete and redirect back to datasets grid
    await page.waitForTimeout(4000);
    await shot(page, 'sqlbuddy-08-saved.png');

    // 9. Verify dataset "sqlbuddy" is visible in the list
    await goTo(page, URLS.datasets);
    const searchBox = page.getByPlaceholder('Search files and folders').first();
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('sqlbuddy');
    await page.waitForTimeout(1500);
    await shot(page, 'sqlbuddy-09-search-result.png');

    const datasetRow = page.locator('[role="gridcell"], td').filter({ hasText: 'sqlbuddy' }).first();
    await expect(datasetRow).toBeVisible({ timeout: 15000 });
    console.log('✅ sqlbuddy dataset successfully created and verified');
  });

  test('Cleanup created sqlbuddy dataset', async ({ page }) => {
    // Navigate to Datasets page and search
    await goTo(page, URLS.datasets);
    const searchBox = page.getByPlaceholder('Search files and folders').first();
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('sqlbuddy');
    await page.waitForTimeout(1500);

    const datasetRow = page.locator('[role="gridcell"], td').filter({ hasText: 'sqlbuddy' }).first();
    if (await datasetRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Right click and delete
      await datasetRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const box = await datasetRow.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(800);
        const deleteItem = page.getByText(/^delete$/i).first();
        if (await deleteItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await deleteItem.click();
          await page.waitForTimeout(800);
          const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
          if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(1500);
            console.log('✅ sqlbuddy dataset successfully deleted');
          }
        }
      }
    }
    await shot(page, 'sqlbuddy-10-cleanup.png');
  });
});
