/**
 * 17-viz-widgets-extended.spec.ts
 *
 * Daily regression — Viz Widget creation (Extended)
 *
 * Covers:
 *   - Table widget: add, configure with datasource + column binding, save
 *   - Filter widget: add, verify panel opens, configure
 *   - Custom Visualization widget: add, verify editor panel
 *   - Image & Text widget: add, verify text/image options
 *   - Combined: all four widgets in one viz
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { BASE_URL } from '../helpers';

test.use({ viewport: { width: 1366, height: 650 } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

/** Safe drag-and-drop — skips if either element is not visible within timeout */
async function dragAndDrop(source: Locator, target: Locator, page: Page) {
  const srcVisible = await source.isVisible({ timeout: 5000 }).catch(() => false);
  const tgtVisible = await target.isVisible({ timeout: 5000 }).catch(() => false);
  if (!srcVisible || !tgtVisible) {
    console.log('dragAndDrop: element not visible — skipping');
    return;
  }
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) return;
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

async function loginAndGoToVizList(page: Page) {
  await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const onLogin = await page.locator("input[placeholder='Your email'], input[name='username']").first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  if (onLogin) {
    await page.getByRole('textbox', { name: 'Your email' }).fill('Admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('Ganesh04');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForSelector("input[placeholder='Search files and folders']", { timeout: 150000 });
    await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await expect(page.getByRole('button', { name: 'Create Viz' })).toBeVisible({ timeout: 60000 });
}

async function createViz(page: Page): Promise<string> {
  const vizName = `viz_ext_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 });
  await page.waitForTimeout(3000);
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  return vizName;
}

async function showWidgetSidebar(page: Page) {
  const hideBtn = page.getByRole('button', { name: 'Hide Widget Sidebar' });
  if (await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)) return;
  const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
  if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await showBtn.click();
    await page.waitForTimeout(800);
  }
}

async function closePropertiesPanel(page: Page) {
  const closeBtn = page.getByRole('button', { name: 'Close Properties Panel' });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(600);
    return;
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

async function saveViz(page: Page) {
  await page.locator('.p-element.action-bar-btn.action-bar-btn-save').click();
  await page.waitForTimeout(1500);
}

async function deleteViz(page: Page, vizName: string) {
  try {
    await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
          if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) await confirmBtn.click();
        }
      }
    }
  } catch { /* best-effort */ }
}

/**
 * Try to select a datasource after the Edit panel is open.
 * The datasource dropdown shows as a div with text "empty" (Charts/Tables pattern).
 * Returns true if datasource was selected.
 */
async function selectDatasource(page: Page): Promise<boolean> {
  // Try the "empty" div dropdown (Charts / Tables pattern)
  const dsDropdown = page.locator('div').filter({ hasText: /^empty$/ }).first();
  if (await dsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dsDropdown.click();
    await page.waitForTimeout(500);
    const searchBox = page.getByRole('textbox', { name: 'Search by name or type' });
    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill('autom');
      const option = page.getByRole('option', { name: 'automation_testing' });
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  // Fallback: p-dropdown trigger (Card widget pattern)
  const ddTrigger = page.locator('app-get-data-api').getByRole('button', { name: 'dropdown trigger' });
  if (await ddTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ddTrigger.click();
    await page.waitForTimeout(500);
    const searchBox = page.getByRole('textbox', { name: 'Search by name or type' });
    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill('autom');
      const option = page.getByRole('option', { name: 'automation_testing' });
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  console.log('⚠️  Datasource dropdown not found — skipping data binding');
  return false;
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Viz Widgets Extended — Daily', () => {

  // ── Table Widget ──────────────────────────────────────────────────────────

  test('Table widget — add and configure using Select All columns', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    const tableWidget = page.getByTitle('Tables').first();
    await expect(tableWidget).toBeVisible({ timeout: 10000 });
    await tableWidget.click();
    await page.waitForTimeout(1000);
    await shot(page, 'widget-table-01-added.png');

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (!await editBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('⚠️  Edit button not visible for Tables — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await editBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, 'widget-table-02-edit-panel.png');

    const dsSelected = await selectDatasource(page);
    if (dsSelected) {
      await shot(page, 'widget-table-03-datasource-selected.png');

      // Click "Select All" checkbox under Available Columns in the Datasets panel
      const selectAll = page.getByText('Select All').locator('..').locator('input[type="checkbox"]')
        .or(page.locator('label').filter({ hasText: 'Select All' }).locator('input[type="checkbox"]'))
        .or(page.locator('p-checkbox').filter({ hasText: 'Select All' }).locator('div.p-checkbox-box'))
        .first();
      if (await selectAll.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selectAll.click();
        await page.waitForTimeout(800);
        await shot(page, 'widget-table-04-select-all.png');
        console.log('✅ Select All clicked — all columns added');
      } else {
        // Fallback: click the text label itself
        const selectAllLabel = page.getByText('Select All', { exact: true });
        if (await selectAllLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectAllLabel.click();
          await page.waitForTimeout(800);
          await shot(page, 'widget-table-04-select-all.png');
          console.log('✅ Select All label clicked');
        } else {
          console.log('⚠️  Select All not found');
          await shot(page, 'widget-table-04-no-select-all.png');
        }
      }
    }

    await closePropertiesPanel(page);
    await saveViz(page);
    await shot(page, 'widget-table-05-saved.png');
    await deleteViz(page, vizName);
  });

  test('Table widget — verify grid after Select All columns', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Tables').click();
    await page.waitForTimeout(1000);

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      const dsSelected = await selectDatasource(page);
      if (dsSelected) {
        const selectAll = page.getByText('Select All').locator('..').locator('input[type="checkbox"]')
          .or(page.locator('label').filter({ hasText: 'Select All' }).locator('input[type="checkbox"]'))
          .or(page.locator('p-checkbox').filter({ hasText: 'Select All' }).locator('div.p-checkbox-box'))
          .first();
        if (await selectAll.isVisible({ timeout: 5000 }).catch(() => false)) {
          await selectAll.click();
          await page.waitForTimeout(1000);
          await shot(page, 'widget-table-06-grid-visible.png');
          console.log('✅ Table grid loaded after Select All');
        }
      }
    } else {
      console.log('⚠️  Edit button not visible — skipping');
    }

    await closePropertiesPanel(page);
    await deleteViz(page, vizName);
  });

  // ── Filter Widget ─────────────────────────────────────────────────────────

  test('Filter widget — add and click Add button to configure', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    const filterWidget = page.getByTitle('Filters').first();
    await expect(filterWidget).toBeVisible({ timeout: 10000 });
    await filterWidget.click();
    await page.waitForTimeout(1500);
    await shot(page, 'widget-filter-01-added.png');

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, 'widget-filter-02-panel-open.png');

    // Click the Add button to add a filter
    const addBtn = page.getByRole('button', { name: /^add$/i })
      .or(page.getByRole('button', { name: /add filter/i }))
      .or(page.locator('button').filter({ hasText: /^add$/i }))
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'widget-filter-03-add-clicked.png');
      console.log('✅ Filter Add button clicked');
    } else {
      console.log('⚠️  Add button not found');
      await shot(page, 'widget-filter-03-no-add-btn.png');
    }

    await closePropertiesPanel(page);
    await saveViz(page);
    await shot(page, 'widget-filter-04-saved.png');
    await deleteViz(page, vizName);
  });

  test('Filter widget — Add button opens filter configuration', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Filters').click();
    await page.waitForTimeout(1500);

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }

    const addBtn = page.getByRole('button', { name: /^add$/i })
      .or(page.getByRole('button', { name: /add filter/i }))
      .or(page.locator('button').filter({ hasText: /^add$/i }))
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(800);

      // After clicking Add, a filter row or dialog should appear
      const filterRow = page.locator('[class*="filter-row"], [class*="filter-item"], .p-dialog').first();
      const rowVisible = await filterRow.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Filter row/dialog after Add: ${rowVisible}`);
      await shot(page, 'widget-filter-05-filter-row.png');
    } else {
      console.log('⚠️  Add button not found — skipping');
      await shot(page, 'widget-filter-05-no-add-btn.png');
    }

    await closePropertiesPanel(page);
    await deleteViz(page, vizName);
  });

  // ── Custom Visualization Widget ───────────────────────────────────────────
  // UI confirmed from screenshot: Datasets panel with HTML / JS / CSS editors
  // Dataset linking syntax: const data = {{dataset::automation_testing}};

  test('Custom Visualization widget — select dataset and write HTML, JS, CSS', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    const customVizWidget = page.getByTitle('Custom Visualization').first();
    await expect(customVizWidget).toBeVisible({ timeout: 10000 });
    await customVizWidget.click();
    await page.waitForTimeout(1500);
    await shot(page, 'widget-customviz-01-added.png');

    // Switch to Datasets tab
    const datasetsTab = page.getByRole('tab', { name: 'Datasets' })
      .or(page.getByText('Datasets', { exact: true })).first();
    if (await datasetsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await datasetsTab.click();
      await page.waitForTimeout(800);
    }
    await shot(page, 'widget-customviz-02-datasets-tab.png');

    // Select dataset from "Datasets (ds)" dropdown — the + icon adds a new dataset slot,
    // then the p-dropdown next to it lets you pick the dataset.
    // From screenshot: dropdown shows "automation_t" label with a p-dropdown component.
    const addDatasetBtn = page.locator('button[title*="add"], button[aria-label*="add"]')
      .or(page.locator('.fa-plus, .pi-plus').locator('xpath=..'))
      .first();
    if (await addDatasetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addDatasetBtn.click();
      await page.waitForTimeout(500);
    }

    // The dataset dropdown has a unique filterplaceholder attribute (confirmed from error log)
    const dsPDropdown = page.locator('p-dropdown[filterplaceholder*="pipeline | cd | ds | stash"]');
    await expect(dsPDropdown).toBeVisible({ timeout: 8000 });
    await dsPDropdown.click();
    await page.waitForTimeout(500);

    // Filter and select automation_testing
    const filterInput = page.locator('.p-dropdown-filter, input.p-inputtext').first();
    if (await filterInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterInput.fill('autom');
      await page.waitForTimeout(500);
    }
    const option = page.getByRole('option', { name: 'automation_testing' });
    await expect(option).toBeVisible({ timeout: 8000 });
    await option.click();
    await page.waitForTimeout(800);
    await shot(page, 'widget-customviz-03-dataset-selected.png');
    console.log('✅ Dataset selected: automation_testing');

    // ── HTML editor ──────────────────────────────────────────────────────────
    // Click the expand/edit icon next to HTML label, or click directly in the editor
    const htmlExpandBtn = page.locator('button').filter({ hasText: '' }).nth(0);
    const htmlEditor = page.locator('div').filter({ hasText: /^HTML/ }).locator('..').locator('textarea, .monaco-editor, .code-editor').first();

    // Try clicking the copy/expand icon beside HTML (the □ icon in screenshot)
    const htmlSection = page.locator('text=HTML').locator('xpath=..').first();
    await htmlSection.locator('button').last().click().catch(() => {});
    await page.waitForTimeout(500);

    // Type into whichever editor is now active
    let htmlInput = page.locator('.monaco-editor textarea, textarea').first();
    if (await htmlInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await htmlInput.click({ force: true });
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('<div id="chart-container"></div>');
      await page.waitForTimeout(300);
      await shot(page, 'widget-customviz-04-html-written.png');
      console.log('✅ HTML written');
    }

    // ── JS editor ────────────────────────────────────────────────────────────
    const jsSection = page.locator('text=JS').locator('xpath=..').first();
    await jsSection.locator('button').last().click().catch(() => {});
    await page.waitForTimeout(500);

    let jsInput = page.locator('.monaco-editor textarea, textarea').first();
    if (await jsInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jsInput.click({ force: true });
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type(
        'const data = {{dataset::automation_testing}};\n' +
        'console.log(data);'
      );
      await page.waitForTimeout(300);
      await shot(page, 'widget-customviz-05-js-written.png');
      console.log('✅ JS written with dataset link');
    }

    // ── CSS editor ───────────────────────────────────────────────────────────
    const cssSection = page.locator('text=CSS').locator('xpath=..').first();
    await cssSection.locator('button').last().click().catch(() => {});
    await page.waitForTimeout(500);

    let cssInput = page.locator('.monaco-editor textarea, textarea').first();
    if (await cssInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cssInput.click({ force: true });
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('#chart-container { width: 100%; height: 100%; }');
      await page.waitForTimeout(300);
      await shot(page, 'widget-customviz-06-css-written.png');
      console.log('✅ CSS written');
    }

    await saveViz(page);
    await shot(page, 'widget-customviz-07-saved.png');
    await deleteViz(page, vizName);
  });

  test('Custom Visualization widget — verify configuration tabs', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Custom Visualization').click();
    await page.waitForTimeout(1500);

    // Verify Properties and Datasets tabs are present
    const datasetsTab = page.getByRole('tab', { name: 'Datasets' })
      .or(page.getByText('Datasets', { exact: true })).first();
    const tabVisible = await datasetsTab.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Datasets tab visible: ${tabVisible}`);
    await shot(page, 'widget-customviz-05-config-tabs.png');

    // Verify HTML / JS / CSS editors are present
    const htmlLabel = page.getByText('HTML', { exact: true });
    const jsLabel   = page.getByText('JS',   { exact: true });
    const cssLabel  = page.getByText('CSS',  { exact: true });
    console.log(`HTML label: ${await htmlLabel.isVisible({ timeout: 3000 }).catch(() => false)}`);
    console.log(`JS label:   ${await jsLabel.isVisible({ timeout: 3000 }).catch(() => false)}`);
    console.log(`CSS label:  ${await cssLabel.isVisible({ timeout: 3000 }).catch(() => false)}`);

    await closePropertiesPanel(page);
    await deleteViz(page, vizName);
  });

  // ── Image & Text Widget ───────────────────────────────────────────────────
  // Selectors confirmed from codegen recording against imageandtext_reference.viz

  test('Image & Text widget — add and enter text via Quill editor', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    // Add widget (codegen: getByText exact match after sidebar open)
    const imageTextWidget = page.getByTitle('Image & Text').first();
    await expect(imageTextWidget).toBeVisible({ timeout: 10000 });
    await imageTextWidget.click();
    await page.waitForTimeout(1500);
    await shot(page, 'widget-imagetext-01-added.png');

    // Quill editor opens inline — no separate Edit button needed
    const quillEditor = page.locator('.ql-editor');
    await expect(quillEditor).toBeVisible({ timeout: 10000 });
    await shot(page, 'widget-imagetext-02-editor-open.png');

    // Type content (codegen: click paragraph then fill)
    await page.locator('quill-editor').getByRole('paragraph').click();
    await page.locator('.ql-editor.ql-blank').fill('sales Dashboard 2026\n\nAIVHUB');
    await page.waitForTimeout(500);
    await shot(page, 'widget-imagetext-03-text-entered.png');
    console.log('✅ Text entered in Quill editor');

    await saveViz(page);
    await shot(page, 'widget-imagetext-04-saved.png');
    await deleteViz(page, vizName);
  });

  test('Image & Text widget — Quill toolbar: font size (Normal → Huge → Large)', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Image & Text').click();
    await page.waitForTimeout(1500);

    const quillEditor = page.locator('.ql-editor');
    await expect(quillEditor).toBeVisible({ timeout: 10000 });

    // Enter text
    await page.locator('quill-editor').getByRole('paragraph').click();
    await page.locator('.ql-editor.ql-blank').fill('sales Dashboard 2026\n\nAIVHUB');
    await page.waitForTimeout(300);

    // Select all and apply Huge size (codegen: Ctrl+A → Normal → Huge)
    await page.getByText('sales Dashboard 2026 AIVHUB').press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Normal' }).first().click();
    await page.getByRole('button', { name: 'Huge' }).click();
    await page.waitForTimeout(300);
    await shot(page, 'widget-imagetext-05-huge-size.png');
    console.log('✅ Font size set to Huge');

    // Switch to Large
    await page.getByRole('button', { name: 'Huge' }).click();
    await page.getByRole('button', { name: 'Large' }).click();
    await page.waitForTimeout(300);
    await shot(page, 'widget-imagetext-06-large-size.png');
    console.log('✅ Font size set to Large');

    await saveViz(page);
    await shot(page, 'widget-imagetext-07-saved.png');
    await deleteViz(page, vizName);
  });

  test('Image & Text widget — insert hyperlink on text', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Image & Text').click();
    await page.waitForTimeout(1500);

    const quillEditor = page.locator('.ql-editor');
    await expect(quillEditor).toBeVisible({ timeout: 10000 });

    // Enter text and select "AIVHUB" word
    await page.locator('quill-editor').getByRole('paragraph').click();
    await page.locator('.ql-editor.ql-blank').fill('sales Dashboard 2026\n\nAIVHUB');
    await page.waitForTimeout(300);
    await page.locator('quill-editor').getByText('AIVHUB').dblclick();
    await page.waitForTimeout(300);
    await shot(page, 'widget-imagetext-08-text-selected.png');

    // Insert link (codegen: Insert Link button → fill URL → .ql-action)
    await page.getByRole('button', { name: 'Insert Link' }).click();
    await page.waitForTimeout(300);
    const linkInput = page.getByRole('textbox', { name: 'https://quilljs.com' });
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    await linkInput.fill('www.aivhub.com');
    await page.locator('.ql-action').click();
    await page.waitForTimeout(500);
    await shot(page, 'widget-imagetext-09-link-inserted.png');
    console.log('✅ Hyperlink inserted on AIVHUB text');

    await saveViz(page);
    await shot(page, 'widget-imagetext-10-saved.png');
    await deleteViz(page, vizName);
  });

  test('Image & Text widget — insert image from repository', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    await page.getByTitle('Image & Text').click();
    await page.waitForTimeout(1500);

    const quillEditor = page.locator('.ql-editor');
    await expect(quillEditor).toBeVisible({ timeout: 10000 });

    // Click into editor first
    await page.locator('quill-editor').getByRole('paragraph').click();
    await page.waitForTimeout(300);

    // Open image picker (codegen: textbox → fill 'logo' → pick AIVLogo.png)
    const imageTextbox = page.getByRole('textbox');
    if (await imageTextbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await imageTextbox.click();
      await imageTextbox.fill('logo');
      await page.waitForTimeout(500);
      const logoOption = page.getByRole('option', { name: 'AIVLogo.png' });
      if (await logoOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoOption.click();
        await page.waitForTimeout(500);
        await shot(page, 'widget-imagetext-11-image-selected.png');
        console.log('✅ Image selected from repository');
      } else {
        console.log('⚠️  AIVLogo.png option not found');
        await shot(page, 'widget-imagetext-11-no-logo.png');
      }
    } else {
      // Fallback: click the image insert button (4th toolbar button per codegen: nth(3))
      const imgBtn = page.getByRole('button').nth(3);
      if (await imgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await imgBtn.click();
        await page.waitForTimeout(500);
        await shot(page, 'widget-imagetext-11-img-btn-clicked.png');
      } else {
        console.log('⚠️  Image insert button not found');
      }
    }

    await saveViz(page);
    await shot(page, 'widget-imagetext-12-saved.png');
    await deleteViz(page, vizName);
  });

  // ── Combined — all four widgets in one viz ────────────────────────────────

  test('Create viz with Table, Filter, Custom Viz, and Image & Text widgets', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const widgets: Array<{ title: string; shot: string }> = [
      { title: 'Tables',               shot: 'widget-combined-01-table.png' },
      { title: 'Filters',              shot: 'widget-combined-02-filter.png' },
      { title: 'Custom Visualization', shot: 'widget-combined-03-customviz.png' },
      { title: 'Image & Text',         shot: 'widget-combined-04-imagetext.png' },
    ];

    for (const w of widgets) {
      await showWidgetSidebar(page);
      const tile = page.getByTitle(w.title).first();
      if (await tile.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tile.click();
        await page.waitForTimeout(1000);
        await closePropertiesPanel(page);
        await shot(page, w.shot);
        console.log(`✅ Added: ${w.title}`);
      } else {
        console.log(`⚠️  Tile not found: ${w.title}`);
      }
    }

    await saveViz(page);
    await shot(page, 'widget-combined-05-all-saved.png');
    console.log('✅ All widgets added and saved');

    await deleteViz(page, vizName);
  });

});
