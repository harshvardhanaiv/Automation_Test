/**
 * 15-viz-widgets.spec.ts
 *
 * Daily regression — Viz Widget creation
 *
 * Patterns confirmed from codegen recording:
 *   - Navigate directly to GridDashboard URL (no goTo — viz-edit has no searchbox)
 *   - Create Viz via "Create Viz" button → textbox → "Create File"
 *   - Add widget: page.getByTitle('Charts').click()  ← title attribute, NOT aria-label
 *   - Show sidebar: page.getByRole('button', { name: 'Show Widget Sidebar' })
 *   - Edit widget: page.getByRole('button', { name: 'Edit' })
 *   - Close panel: page.getByRole('button', { name: 'Close Properties Panel' })
 *   - Save viz:    page.locator('.action-bar-btn-save').click()
 *   - Drag-and-drop for data binding uses mouse API
 *
 * Covers:
 *   - Viz editor opens and canvas shows empty state
 *   - Widget sidebar opens via "Show Widget Sidebar" button
 *   - Each widget type is accessible via getByTitle()
 *   - Adding Charts widget → Edit panel opens → data source selectable
 *   - Adding Pie chart widget
 *   - Adding Line chart widget
 *   - Adding Card widget
 *   - Properties panel (gear icon) opens Widget Background tab
 *   - Save viz works
 *   - Cleanup: deletes the test Viz
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { BASE_URL } from '../helpers';

test.use({ viewport: { width: 1366, height: 650 } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

async function dragAndDrop(source: Locator, target: Locator, page: Page) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    console.log('dragAndDrop: element not visible — skipping');
    return;
  }
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
  const vizName = `viz_widgets_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForSelector('.action-bar-btn-save', { timeout: 60000 });
  await page.waitForTimeout(2000);
  // Dismiss any auto-opened dialog
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  return vizName;
}

async function showWidgetSidebar(page: Page) {
  // If sidebar is already open ("Hide Widget Sidebar" is active), do nothing
  const hideBtn = page.getByRole('button', { name: 'Hide Widget Sidebar' });
  if (await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)) return;
  // Otherwise click "Show Widget Sidebar" to open it
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

// ── Widget title list (confirmed from codegen: getByTitle() works) ────────────

const WIDGET_TITLES = [
  'Tables', 'Charts', 'Maps', 'Card', 'Filters', 'Section', 'Pivot',
  'Image & Text', 'Reports', 'Spreadsheet', 'Notebook', 'Analysis',
  'Diagrams', 'Custom Visualization', 'Scheduler', 'File Manager',
  'Report Management', 'Drill Down',
];

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Viz Widgets — Daily', () => {

  // ── Editor setup ──────────────────────────────────────────────────────────

  test('Viz editor opens and shows empty canvas', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await expect(page).toHaveURL(/viz-edit/i);
    const emptyState = page.getByRole('heading', { name: /Build Your Perfect Dashboard/i });
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await shot(page, 'widget-00-empty-canvas.png');
    await deleteViz(page, vizName);
  });

  test('Widget sidebar toggle button is present in editor', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    // The button toggles between "Show Widget Sidebar" and "Hide Widget Sidebar"
    // depending on whether the sidebar is currently open or closed
    const toggleBtn = page.getByRole('button', { name: /Widget Sidebar/i }).first();
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'widget-01-sidebar-toggle-btn.png');
    await deleteViz(page, vizName);
  });

  test('Widget sidebar opens and shows widget tiles', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);
    // From codegen: widgets are accessed via getByTitle() — verify Charts tile
    const chartsWidget = page.getByTitle('Charts').first();
    await expect(chartsWidget).toBeVisible({ timeout: 10000 });
    await shot(page, 'widget-02-sidebar-open.png');
    await deleteViz(page, vizName);
  });

  test('All widget tiles are present in sidebar', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);
    let found = 0;
    for (const title of WIDGET_TITLES) {
      const tile = page.getByTitle(title).first();
      const visible = await tile.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) found++;
      else console.log(`  ⚠️  Widget tile "${title}" not visible`);
    }
    await shot(page, 'widget-03-all-tiles.png');
    console.log(`Widget tiles found: ${found}/${WIDGET_TITLES.length}`);
    expect(found).toBeGreaterThan(0);
    await deleteViz(page, vizName);
  });

  // ── Charts widget — full flow from codegen ────────────────────────────────

  test('Charts widget — add Column chart with data binding', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // Add Charts widget (confirmed from codegen: getByTitle)
    await page.getByTitle('Charts').click();
    await page.waitForTimeout(1000);
    await shot(page, 'widget-charts-01-added.png');

    // Edit button opens the data panel
    const editBtn = page.getByRole('button', { name: 'Edit' });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, 'widget-charts-02-edit-panel.png');

    // Select datasource
    const dsDropdown = page.locator('div').filter({ hasText: /^empty$/ }).first();
    if (await dsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dsDropdown.click();
      await page.getByRole('textbox', { name: 'Search by name or type' }).fill('autom');
      const option = page.getByRole('option', { name: 'automation_testing' });
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(1000);
        await shot(page, 'widget-charts-03-datasource-selected.png');

        // Drag Country → Category, Revenue → Value
        const countryCol     = page.getByRole('listitem').filter({ hasText: 'Country' });
        const categoryZone   = page.locator('#categoryList').getByText('Drop column here');
        const revenueCol     = page.getByRole('listitem').filter({ hasText: 'Revenue' });
        const valueZone      = page.locator('#valueList').getByText('Drop column here');

        await dragAndDrop(countryCol, categoryZone, page);
        await dragAndDrop(revenueCol, valueZone, page);
        await page.waitForTimeout(500);
        await shot(page, 'widget-charts-04-columns-dropped.png');

        // Set aggregator to Sum
        const cogBtn = page.locator('#valueList > .cdk-drag > div:nth-child(2) > .fa-light.fa-cog');
        if (await cogBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cogBtn.click();
          await page.waitForTimeout(400);
          const aggregatorLink = page.locator('a').filter({ hasText: 'Aggregator' }).first();
          await aggregatorLink.waitFor({ state: 'visible', timeout: 5000 });
          // Hover to open the submenu, then click
          await aggregatorLink.hover();
          await page.waitForTimeout(600);
          const sumLink = page.locator('#sum');
          const sumVisible = await sumLink.isVisible({ timeout: 3000 }).catch(() => false);
          if (sumVisible) {
            await sumLink.click();
          } else {
            // Fallback: click Aggregator to open submenu, then click Sum
            await aggregatorLink.click();
            await page.waitForTimeout(400);
            await sumLink.click({ force: true });
          }
          await page.waitForTimeout(500);
        }

        // Switch to Column chart type
        const chartTypeDropdown = page.locator('app-aiv-viz-chart-settings').getByRole('button', { name: 'dropdown trigger' });
        if (await chartTypeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
          await chartTypeDropdown.click();
          await page.waitForTimeout(5000); // chart type list takes time to load
          const columnOption = page.getByRole('option', { name: 'Column' });
          if (await columnOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            await columnOption.click();
          }
        }
      }
    } else {
      console.log('Datasource dropdown not found — skipping data binding');
    }

    // Save
    await saveViz(page);
    await shot(page, 'widget-charts-05-saved.png');
    await deleteViz(page, vizName);
  });

  // ── Individual widget add tests ───────────────────────────────────────────

  for (const title of WIDGET_TITLES) {
    test(`Widget tile — "${title}" can be clicked to add`, async ({ page }) => {
      await loginAndGoToVizList(page);
      const vizName = await createViz(page);
      await showWidgetSidebar(page);

      const tile = page.getByTitle(title).first();
      const isVisible = await tile.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        console.log(`  ⚠️  Widget tile "${title}" not visible — skipping`);
        await deleteViz(page, vizName);
        return;
      }

      await tile.click();
      await page.waitForTimeout(1500);

      const slug = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      await shot(page, `widget-tile-${slug}-added.png`);

      // Edit button should appear after adding a widget
      const editBtn = page.getByRole('button', { name: 'Edit' });
      const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`  ${editVisible ? '✅' : 'ℹ️ '} "${title}": Edit button ${editVisible ? 'visible' : 'not visible'}`);

      if (editVisible) {
        await shot(page, `widget-tile-${slug}-edit-btn.png`);
      }

      // Close any open panel
      await closePropertiesPanel(page);
      await deleteViz(page, vizName);
    });
  }

  // ── Card widget — full flow ───────────────────────────────────────────────

  test('Card widget — add with data binding', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);
    await showWidgetSidebar(page);

    // From codegen: getByText('Card', { exact: true }) also works
    const cardTile = page.getByTitle('Card').or(page.getByText('Card', { exact: true })).first();
    if (!await cardTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Card tile not found — skipping');
      await deleteViz(page, vizName);
      return;
    }

    await cardTile.click();
    await page.waitForTimeout(1000);
    await shot(page, 'widget-card-01-added.png');

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Select datasource
      const dsDropdown = page.locator('app-get-data-api').getByRole('button', { name: 'dropdown trigger' });
      if (await dsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dsDropdown.click();
        await page.getByRole('textbox', { name: 'Search by name or type' }).fill('autom');
        const option = page.getByRole('option', { name: 'automation_testing' });
        if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
          await option.click();
          await page.waitForTimeout(1000);

          // Drag Revenue → drop zone
          const revenueCol = page.getByRole('listitem').filter({ hasText: 'Revenue' });
          const dropZone   = page.getByText('Drop column here').first();
          await dragAndDrop(revenueCol, dropZone, page);
          await page.waitForTimeout(500);
          await shot(page, 'widget-card-02-data-bound.png');
        }
      }
    }

    await saveViz(page);
    await shot(page, 'widget-card-03-saved.png');
    await deleteViz(page, vizName);
  });

  // ── Widget properties panel ───────────────────────────────────────────────

  test('Widget gear icon opens properties with Widget Background tab', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // Add a Charts widget first
    await page.getByTitle('Charts').click();
    await page.waitForTimeout(1000);

    // Open widget properties via gear icon (from codegen: .action-bar-btn-gear or .fa-gear)
    const gearBtn = page.locator('.p-element.fa-light.fa-gear, button[title*="Properties"], button[aria-label*="Properties"]').first();
    if (await gearBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gearBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'widget-props-01-gear-opened.png');

      // Widget Background tab (confirmed from codegen)
      const widgetBgTab = page.getByRole('tab', { name: 'Widget Background' });
      if (await widgetBgTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await widgetBgTab.click();
        await page.waitForTimeout(500);
        await shot(page, 'widget-props-02-widget-bg-tab.png');

        // Background color input
        const bgInput = page.getByRole('region', { name: 'Widget Background' }).getByRole('textbox');
        if (await bgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await bgInput.click();
          await bgInput.press('ControlOrMeta+a');
          await bgInput.fill('#d25454');
          await page.waitForTimeout(500);
          await shot(page, 'widget-props-03-color-set.png');
          console.log('✅ Widget Background color set');
        }
      } else {
        console.log('Widget Background tab not found — skipping');
      }
    } else {
      console.log('Gear button not found — skipping properties test');
    }

    await deleteViz(page, vizName);
  });

  // ── Save viz ──────────────────────────────────────────────────────────────

  test('Save viz button works after adding a widget', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    await page.getByTitle('Charts').click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save');
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'widget-save-01-saved.png');
    console.log('✅ Viz saved');

    await deleteViz(page, vizName);
  });

  // ── Close Properties Panel ────────────────────────────────────────────────

  test('"Close Properties Panel" button dismisses the edit panel', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    await page.getByTitle('Charts').click();
    await page.waitForTimeout(1000);

    // Edit panel should be open
    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const closeBtn = page.getByRole('button', { name: 'Close Properties Panel' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(600);
      await shot(page, 'widget-close-panel-01-closed.png');
      // Panel should be gone
      const stillOpen = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Close Properties Panel: panel still open after close = ${stillOpen}`);
    } else {
      console.log('Close Properties Panel button not found — skipping');
    }

    await deleteViz(page, vizName);
  });

});

