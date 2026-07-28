import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, goToVizFolder, shot } from '../helpers';

// ── Cleanup Helper ────────────────────────────────────────────────────────────

async function deleteViz(page: Page, vizName: string) {
  try {
    console.log(`👉 Cleaning up: Deleting created Viz "${vizName}"...`);
    await goToVizFolder(page, 'Automation Testing Dashboard');
    await page.waitForTimeout(2000);
    const vizRow = page.locator('[role="gridcell"], td').filter({ hasText: vizName }).first();
    if (await vizRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vizRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const box = await vizRow.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        const deleteItem = page.getByText(/^delete$/i).first();
        if (await deleteItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await deleteItem.click();
          await page.waitForTimeout(500);
          const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
          if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(1000);
            console.log(`✅ Viz "${vizName}" deleted successfully.`);
          }
        }
      }
    }
  } catch (err) {
    console.log('⚠️ Cleanup failed (best-effort):', err);
  }
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe('AIV Dashboard - Create Viz and Select Dataset Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Log in and navigate into the Automation Testing Dashboard folder
    await ensureLoggedIn(page);
    await goToVizFolder(page, 'Automation Testing Dashboard');
    await page.waitForTimeout(1000);
  });

  test('create_viz_and_select_dataset', async ({ page }) => {
    // Wait for Dashboard page to be ready
    await page.locator('.e-spinner-pane:visible, .e-spin-show:visible, [class*="spinner"]:visible').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1000);

    // Verify Create Viz button is present
    const createVizBtn = page.getByRole('button', { name: 'Create Viz' }).first();
    await expect(createVizBtn).toBeVisible({ timeout: 15000 });
    await shot(page, '01-dashboard-view.png');

    // Click on Create Viz to open Create File dialog
    console.log('👉 Clicking Create Viz button...');
    await createVizBtn.click();
    await page.waitForTimeout(2000);

    // Capture screenshot of Create File dialog
    const createFileDialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(createFileDialog).toBeVisible({ timeout: 15000 });
    await shot(page, '02-create-dialog.png');

    // Enter a unique name starting with 'auto_viz_' in name input field
    const vizName = `auto_viz_${Date.now()}`;
    console.log(`👉 Entering folder/file name: ${vizName}`);
    const nameInput = createFileDialog.locator('.p-dialog input, input.p-inputtext').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.click();
    await nameInput.fill(vizName);
    await page.waitForTimeout(1000);
    await shot(page, '03-name-typed.png');

    // Click Create File button
    console.log('👉 Clicking Create File button inside dialog...');
    const createBtn = createFileDialog.locator('button').filter({ hasText: /^Create File$/ }).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Step 7: Wait for redirect to viz editor
    console.log('👉 Waiting for redirect to viz-edit...');
    await page.waitForURL(/viz-edit/, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

    // Step 8: Wait 15 seconds after redirecting
    console.log('👉 Viz editor loaded! Waiting 15 seconds...');
    await page.waitForTimeout(15000);
    await shot(page, '04-viz-canvas.png');

    // Dismiss any auto-opened dialog
    const dlg = page.locator('[role="dialog"]').first();
    if (await dlg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Step 9: Ensure widget sidebar is open
    console.log('👉 Ensuring widget sidebar is open...');
    const hideSidebarBtn = page.getByRole('button', { name: 'Hide Widget Sidebar' });
    if (!await hideSidebarBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const showSidebarBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
      if (await showSidebarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showSidebarBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 10: Click Report Management widget tile first
    console.log('👉 Clicking Report Management widget tile...');
    const reportMgmtTile = page.getByTitle('Report Management').first();
    await expect(reportMgmtTile).toBeVisible({ timeout: 15000 });
    await reportMgmtTile.click();
    await page.waitForTimeout(3000);
    await shot(page, '05-report-management-widget-added.png');

    // Step 11: Locate database icon button
    console.log('👉 Locate database icon button...');
    const dbIconBtn = page.locator('button.properties-icon-btn-data, button[title="Show Data Panel"]').first();
    await expect(dbIconBtn).toBeVisible({ timeout: 15000 });
    await dbIconBtn.hover().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, '06-database-icon.png');

    // Step 12: Click database icon button
    console.log('👉 Clicking database icon button...');
    await dbIconBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, '07-dataset-screen.png');

    // Step 13: Click edit icon if visible to enable selecting the dataset
    const editIcon = page.locator('a.datahome_edtlnk').first();
    if (await editIcon.isVisible().catch(() => false)) {
      console.log('👉 Clicking Datasets edit icon to enable dropdown...');
      await editIcon.click();
      await page.waitForTimeout(1000);
    }

    // Step 14: Click Datasets dropdown inside app-get-data-api panel
    console.log('👉 Opening Datasets dropdown...');
    const datasetsDropdown = page.locator('app-get-data-api p-dropdown').first();
    await expect(datasetsDropdown).toBeVisible({ timeout: 15000 });
    await datasetsDropdown.click();
    await page.waitForTimeout(1500);

    // Step 15: Search for 'customers'
    console.log('👉 Searching for "customers" in dropdown...');
    const dropdownSearch = page.locator('input.p-dropdown-filter, .p-dropdown-panel input').filter({ visible: true }).first();
    await expect(dropdownSearch).toBeVisible({ timeout: 10000 });
    await dropdownSearch.click();
    await dropdownSearch.clear();
    await dropdownSearch.pressSequentially('customers', { delay: 100 });
    await page.waitForTimeout(2000);
    await shot(page, '08-search-customers.png');

    // Step 16: Select the second 'customers.ds' item
    console.log('👉 Selecting the second "customers.ds" option...');
    const customerItems = page.locator('.p-dropdown-item, li[role="option"]').filter({ visible: true });
    const secondItem = customerItems.nth(1);
    await expect(secondItem).toBeVisible({ timeout: 10000 });
    await secondItem.click();

    // Step 17: Wait 2 seconds
    await page.waitForTimeout(2000);
    await shot(page, '09-second-customer-selected.png');

    // Step 17b: Select/focus the widget to ensure properties panel is visible
    console.log('👉 Selecting/focusing the widget...');
    const widget = page.locator('gridster-item, [class*="widget"]').filter({ hasText: /ReportManagement/ }).first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await widget.click();
    await page.waitForTimeout(1000);

    // Step 18: Click Mapping dropdown
    console.log('👉 Clicking Mapping dropdown...');
    const mappingDropdown = page.locator('app-properties-panel p-dropdown, .properties-sidebar p-dropdown, .properties-panel p-dropdown').nth(1);
    await expect(mappingDropdown).toBeVisible({ timeout: 15000 });
    await mappingDropdown.click({ force: true });

    // Step 19: Wait 10 seconds for options to load
    console.log('👉 Waiting 10 seconds for mapping options to load...');
    await page.waitForTimeout(10000);
    await shot(page, '10-mapping-options-loading.png');

    // Step 20: Select RB3 option
    console.log('👉 Selecting RB3 option...');
    const rb3Option = page.locator('.p-dropdown-item, li[role="option"]').filter({ hasText: /^RB3$/ }).first();
    await expect(rb3Option).toBeVisible({ timeout: 10000 });
    await rb3Option.click();

    // Step 21: Wait 5 seconds
    console.log('👉 Waiting 5 seconds after selecting RB3...');
    await page.waitForTimeout(5000);
    await shot(page, '11-rb3-selected.png');

    console.log('✅ Viz creation, widget add, dataset selection, and mapping selection completed successfully!');

    // Cleanup: Delete the newly created Viz
    await deleteViz(page, vizName);
  });
});
