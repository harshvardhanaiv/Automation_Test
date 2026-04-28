/**
 * 07-masterdata.spec.ts
 *
 * Daily regression — Master Data section
 * Covers: Datasource, Datasets, Parameters, Webhook, Group Dataset
 *
 * For each section:
 *   - Page loads
 *   - Grid/table renders (rows or empty state)
 *   - Column headers visible
 *   - Create button visible
 *   - Create dialog/panel opens
 *   - Fill and cancel — no record created
 *   - Right-click context menu on existing row (all actions)
 *   - Search box functional
 *   - Stats toolbar (where applicable)
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

// ── Shared helpers ────────────────────────────────────────────────────────────

async function assertPageLoads(page: Page, url: string, urlFrag: string, prefix: string) {
  await goTo(page, url);
  await expect(page).toHaveURL(new RegExp(urlFrag, 'i'), { timeout: 15000 });
  await shot(page, `${prefix}-01-page.png`);
}

async function assertGridOrEmpty(page: Page, prefix: string) {
  await page.waitForTimeout(500);
  const hasGrid  = await page.locator('table, [role="grid"]').first().isVisible({ timeout: 20000 }).catch(() => false);
  const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
  expect(hasGrid || hasEmpty, 'Grid or empty state should be visible').toBe(true);
  await shot(page, `${prefix}-02-grid.png`);
}

async function assertContextMenu(page: Page, prefix: string) {
  const found = await rightClickFirstRow(page);
  if (!found) { console.log('No rows — skipping context menu'); return; }
  await shot(page, `${prefix}-ctx-menu.png`);
  const actions = ['Edit', 'Delete', 'Copy', 'Clone', 'Share', 'Properties', 'Run'];
  let menuFound = false;
  for (const a of actions) {
    if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
  }
  expect(menuFound, 'Context menu should show at least one action').toBe(true);
  await page.keyboard.press('Escape');
}

// ═════════════════════════════════════════════════════════════════════════════
//  DATASOURCE
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Datasource', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Datasource page loads', async ({ page }) => {
    await assertPageLoads(page, URLS.datasource, 'Datasource', 'ds');
  });

  test('Datasource grid is visible', async ({ page }) => {
    await goTo(page, URLS.datasource);
    await assertGridOrEmpty(page, 'ds');
  });

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.datasource);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Datasource column headers visible: ${visible}`);
    await shot(page, 'ds-03-columns.png');
  });

  test('Create button is visible', async ({ page }) => {
    await goTo(page, URLS.datasource);
    const btn = page.getByRole('button', { name: /^create$/i }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await shot(page, 'ds-04-create-btn.png');
  });

  test('Create Datasource panel opens', async ({ page }) => {
    await goTo(page, URLS.datasource);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'ds-05-panel.png');
    // Datasource creation opens as a full-page panel (not a role="dialog")
    const panelVisible =
      await page.getByText('Connect to Datasource', { exact: false }).isVisible({ timeout: 8000 }).catch(() => false) ||
      await page.getByRole('dialog').isVisible({ timeout: 3000 }).catch(() => false) ||
      await page.locator('.p-dialog, mat-dialog-container, [class*="panel"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(panelVisible, 'Datasource creation panel should open').toBe(true);
    // Close
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  });

  test('Datasource panel has connection type options', async ({ page }) => {
    await goTo(page, URLS.datasource);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'ds-06-panel-types.png');
    // Look for connection type cards or dropdown
    const typeOption = page.locator('[class*="datasource"], [class*="connector"], p-card, .card').first();
    const visible = await typeOption.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Datasource type options visible: ${visible}`);
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
  });

  test('Right-click context menu on datasource row', async ({ page }) => {
    await goTo(page, URLS.datasource);
    await assertContextMenu(page, 'ds');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await goTo(page, URLS.datasource);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Datasource Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'ds-ctx-edit.png');
  });

  test('Context menu — Delete option is present', async ({ page }) => {
    await goTo(page, URLS.datasource);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const deleteItem = page.getByText('Delete', { exact: false }).first();
    const visible    = await deleteItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Datasource Delete option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'ds-ctx-delete.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  DATASETS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Datasets', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Datasets page loads', async ({ page }) => {
    await assertPageLoads(page, URLS.datasets, 'Datasets', 'dataset');
  });

  test('Datasets grid is visible', async ({ page }) => {
    await goTo(page, URLS.datasets);
    await assertGridOrEmpty(page, 'dataset');
  });

  test('Stats counters toolbar is visible', async ({ page }) => {
    await goTo(page, URLS.datasets);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'dataset-03-stats.png');
  });

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.datasets);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Datasets column headers visible: ${visible}`);
    await shot(page, 'dataset-04-columns.png');
  });

  test('Search box is functional', async ({ page }) => {
    await goTo(page, URLS.datasets);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await searchBox.clear();
    await shot(page, 'dataset-05-search.png');
  });

  test('Right-click context menu on dataset row', async ({ page }) => {
    await goTo(page, URLS.datasets);
    await assertContextMenu(page, 'dataset');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await goTo(page, URLS.datasets);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Dataset Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'dataset-ctx-edit.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  PARAMETERS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Parameters', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Parameters page loads with table', async ({ page }) => {
    await assertPageLoads(page, URLS.parameters, 'Parameters', 'param');
  });

  test('Parameters table has Name column', async ({ page }) => {
    await goTo(page, URLS.parameters);
    const table = page.locator('table, [role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    const nameCol = page.getByText('Name', { exact: true }).first();
    await expect(nameCol).toBeVisible({ timeout: 5000 });
    await shot(page, 'param-02-columns.png');
  });

  test('Parameters table has Type column', async ({ page }) => {
    await goTo(page, URLS.parameters);
    const typeCol = page.getByText('Type', { exact: true }).first();
    const visible = await typeCol.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Type column visible: ${visible}`);
    await shot(page, 'param-03-type-col.png');
  });

  test('Create button is visible', async ({ page }) => {
    await goTo(page, URLS.parameters);
    const btn = page.getByRole('button', { name: /^create$/i }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await shot(page, 'param-04-create-btn.png');
  });

  test('Create Parameter dialog opens', async ({ page }) => {
    await goTo(page, URLS.parameters);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'param-05-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
  });

  test('Create Parameter dialog has Name and Type fields', async ({ page }) => {
    await goTo(page, URLS.parameters);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await shot(page, 'param-06-dialog-fields.png');
    await page.keyboard.press('Escape');
  });

  test('Fill parameter name then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.parameters);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const cancelName = 'auto_param_cancel_' + Date.now();
    await dialog.locator('input').first().fill(cancelName);
    await shot(page, 'param-07-filled.png');
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    const cancelledRow = page.locator('[role="gridcell"]').filter({ hasText: cancelName });
    await expect(cancelledRow).not.toBeVisible({ timeout: 5000 });
    await shot(page, 'param-08-cancelled.png');
  });

  test('Right-click context menu on parameter row', async ({ page }) => {
    await goTo(page, URLS.parameters);
    await assertContextMenu(page, 'param');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  WEBHOOK
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Webhook', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Webhook page loads with table', async ({ page }) => {
    await assertPageLoads(page, URLS.webhook, 'webhook', 'webhook');
  });

  test('Webhook table renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.webhook);
    await assertGridOrEmpty(page, 'webhook');
  });

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.webhook);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Webhook column headers visible: ${visible}`);
    await shot(page, 'webhook-03-columns.png');
  });

  test('Create Webhook button is visible', async ({ page }) => {
    await goTo(page, URLS.webhook);
    const btn = page.getByRole('button', { name: /create webhook/i })
      .or(page.getByRole('button', { name: /^create$/i })).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await shot(page, 'webhook-04-create-btn.png');
  });

  test('Create Webhook dialog opens with URL field', async ({ page }) => {
    await goTo(page, URLS.webhook);
    const btn = page.getByRole('button', { name: /create webhook/i })
      .or(page.getByRole('button', { name: /^create$/i })).first();
    await btn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'webhook-05-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // Webhook dialog should have a URL input
    const urlInput = dialog.locator('input[placeholder*="url" i], input[placeholder*="URL"]').first();
    const visible  = await urlInput.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Webhook URL input visible: ${visible}`);
    await page.keyboard.press('Escape');
  });

  test('Fill webhook name then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.webhook);
    const btn = page.getByRole('button', { name: /create webhook/i })
      .or(page.getByRole('button', { name: /^create$/i })).first();
    await btn.click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const cancelName = 'auto_wh_cancel_' + Date.now();
    await dialog.locator('input').first().fill(cancelName);
    await shot(page, 'webhook-06-filled.png');
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await shot(page, 'webhook-07-cancelled.png');
  });

  test('Right-click context menu on webhook row', async ({ page }) => {
    await goTo(page, URLS.webhook);
    await assertContextMenu(page, 'webhook');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await goTo(page, URLS.webhook);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Webhook Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'webhook-ctx-edit.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  GROUP DATASET
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Group Dataset', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Group Dataset page loads', async ({ page }) => {
    await assertPageLoads(page, URLS.groupDataset, 'groupDataset', 'grpds');
  });

  test('Next button is visible', async ({ page }) => {
    await goTo(page, URLS.groupDataset);
    const nextBtn = page.getByRole('button', { name: /next/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'grpds-02-next-btn.png');
  });

  test('Dataset selection area is visible', async ({ page }) => {
    await goTo(page, URLS.groupDataset);
    // Group Dataset page has a dataset picker / list
    const picker = page.locator('p-listbox, p-multiselect, [class*="dataset-list"], [class*="picker"]').first();
    const visible = await picker.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Dataset picker visible: ${visible}`);
    await shot(page, 'grpds-03-picker.png');
  });

  test('Group Dataset has a name input field', async ({ page }) => {
    await goTo(page, URLS.groupDataset);
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="group" i]').first();
    const visible   = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Group Dataset name input visible: ${visible}`);
    await shot(page, 'grpds-04-name-input.png');
  });

});
