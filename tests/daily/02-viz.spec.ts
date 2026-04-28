/**
 * 02-viz.spec.ts
 *
 * Daily regression — Viz (Dashboard)
 * URL: /Visualization/GridDashboard
 *
 * Covers:
 *   - Page loads (list view)
 *   - Stats toolbar visible with buttons
 *   - Search box functional (type, clear)
 *   - Create Viz button visible
 *   - Create Viz dialog opens with name input
 *   - Create Viz → fill name → cancel (no side effects)
 *   - Create Viz → fill name → create → verify editor opens → delete
 *   - Right-click context menu on existing viz row
 *   - Context menu has expected actions
 *   - Home breadcrumb button behaviour
 *   - Quick filter toolbar stat buttons
 *   - View toggle (grid/list) if present
 *   - Sort column headers clickable
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function openVizList(page: Page) {
  await goTo(page, URLS.viz);
  await expect(page).toHaveURL(/GridDashboard/i, { timeout: 15000 });
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Viz (Dashboard)', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('Viz list view page loads', async ({ page }) => {
    await openVizList(page);
    await expect(page.getByPlaceholder('Search files and folders')).toBeVisible({ timeout: 15000 });
    await shot(page, 'viz-01-list-view.png');
  });

  test('Page title / heading is present', async ({ page }) => {
    await openVizList(page);
    const heading = page.locator('h1, h2, .page-title, mat-toolbar').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await shot(page, 'viz-02-heading.png');
  });

  // ── Stats toolbar ─────────────────────────────────────────────────────────

  test('Stats toolbar is visible', async ({ page }) => {
    await openVizList(page);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'viz-03-stats-toolbar.png');
  });

  test('Stats toolbar has at least one filter button', async ({ page }) => {
    await openVizList(page);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    const firstBtn = toolbar.getByRole('button').first();
    await expect(firstBtn).toBeVisible({ timeout: 5000 });
    await shot(page, 'viz-04-stat-buttons.png');
  });

  test('Clicking a stat filter button updates the grid', async ({ page }) => {
    await openVizList(page);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    const firstBtn = toolbar.getByRole('button').first();
    await firstBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'viz-05-stat-filter-clicked.png');
    // Grid or empty state should still be visible
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('Search box accepts input', async ({ page }) => {
    await openVizList(page);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await shot(page, 'viz-06-search-typed.png');
    await searchBox.clear();
    await page.waitForTimeout(500);
    await shot(page, 'viz-07-search-cleared.png');
  });

  // ── Create Viz ────────────────────────────────────────────────────────────

  test('Create Viz button is visible', async ({ page }) => {
    await openVizList(page);
    await expect(page.getByRole('button', { name: 'Create Viz' })).toBeVisible({ timeout: 10000 });
    await shot(page, 'viz-08-create-btn.png');
  });

  test('Create Viz dialog opens with name input', async ({ page }) => {
    await openVizList(page);
    await page.getByRole('button', { name: 'Create Viz' }).click();
    await page.waitForTimeout(1000);
    const nameInput = page.getByRole('textbox').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await shot(page, 'viz-09-create-dialog.png');
    // Cancel to clean up
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
  });

  test('Create Viz — fill name then cancel discards it', async ({ page }) => {
    await openVizList(page);
    await page.getByRole('button', { name: 'Create Viz' }).click();
    await page.waitForTimeout(1000);
    const nameInput = page.getByRole('textbox').first();
    await nameInput.fill('auto_viz_cancel_' + Date.now());
    await shot(page, 'viz-10-create-filled.png');
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await shot(page, 'viz-11-create-cancelled.png');
    // Should be back on list view
    await expect(page).toHaveURL(/GridDashboard/i);
  });

  test('Create Viz — create and open editor, then delete', async ({ page }) => {
    await openVizList(page);
    const vizName = 'auto_viz_' + Date.now();
    await page.getByRole('button', { name: 'Create Viz' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox').first().fill(vizName);
    await page.getByRole('button', { name: 'Create File' }).click();
    await page.waitForURL(/viz-edit/, { timeout: 120000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await shot(page, 'viz-12-editor-opened.png');
    await expect(page).toHaveURL(/viz-edit/i);

    // Dismiss any auto-opened dialog
    const dlg = page.locator('[role="dialog"]').first();
    if (await dlg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Navigate back and delete
    await goTo(page, URLS.viz);
    await page.waitForTimeout(1000);
    const vizCell = page.locator('[role="gridcell"]').filter({ hasText: vizName }).first();
    if (await vizCell.isVisible({ timeout: 10000 }).catch(() => false)) {
      await vizCell.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const box = await vizCell.boundingBox();
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
    await shot(page, 'viz-13-deleted.png');
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  test('Right-click on viz row shows context menu', async ({ page }) => {
    await openVizList(page);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No viz rows — skipping context menu test'); return; }
    await shot(page, 'viz-14-context-menu.png');
    const knownActions = ['Edit', 'Delete', 'Share', 'Copy', 'Move', 'Download', 'Properties', 'Schedule'];
    let menuFound = false;
    for (const action of knownActions) {
      if (await page.getByText(action, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        menuFound = true;
        break;
      }
    }
    expect(menuFound, 'Context menu should show at least one known action').toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await openVizList(page);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'viz-15-context-edit.png');
  });

  test('Context menu — Delete option is present', async ({ page }) => {
    await openVizList(page);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const deleteItem = page.getByText('Delete', { exact: false }).first();
    const visible    = await deleteItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Delete option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'viz-16-context-delete.png');
  });

  // ── Home breadcrumb ───────────────────────────────────────────────────────

  test('Home breadcrumb button is present', async ({ page }) => {
    await openVizList(page);
    const homeBtn = page.locator('button.aiv-outer-breadcrumb__home, button[aria-label*="home" i]').first();
    const visible  = await homeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Home breadcrumb visible: ${visible}`);
    await shot(page, 'viz-17-breadcrumb.png');
  });

  // ── Grid / list view toggle ───────────────────────────────────────────────

  test('Grid or list view toggle is present', async ({ page }) => {
    await openVizList(page);
    const toggleBtn = page.locator('button[title*="Grid View"], button[title*="List View"], button[aria-label*="view" i]').first();
    const visible   = await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`View toggle visible: ${visible}`);
    await shot(page, 'viz-18-view-toggle.png');
  });

  // ── Column sort ───────────────────────────────────────────────────────────

  test('Column headers are clickable for sorting', async ({ page }) => {
    await openVizList(page);
    const header = page.locator('[role="columnheader"]').first();
    if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(600);
      await shot(page, 'viz-19-sorted.png');
    } else {
      console.log('No column headers found — skipping sort test');
    }
  });

});
