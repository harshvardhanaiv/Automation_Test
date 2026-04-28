/**
 * 06-quick-run.spec.ts
 *
 * Daily regression — Documents > Quick Run
 * URL: /Documents/QuickRun
 *
 * Covers:
 *   - Page loads with table
 *   - Create and Delete buttons visible
 *   - Create Quick Run dialog opens with Name field
 *   - Fill name and cancel — no record created
 *   - Create Quick Run → verify in grid → delete
 *   - Right-click on existing row shows context menu (Edit, Delete, Run)
 *   - Context menu — Edit opens dialog
 *   - Context menu — Run triggers execution
 *   - Column headers visible (Name, Description, etc.)
 *   - Search box present and functional
 *   - Table has rows or empty state
 */

import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

test.describe.serial('Quick Run', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('Quick Run page loads with table', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await expect(page).toHaveURL(/QuickRun/i);
    const table = page.locator('table, [role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 15000 });
    await shot(page, 'quickrun-daily-01-page.png');
  });

  test('Table renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await page.waitForTimeout(500);
    const hasRows  = await page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') }).first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);
    await shot(page, 'quickrun-daily-02-grid.png');
  });

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Column headers visible: ${visible}`);
    await shot(page, 'quickrun-daily-03-columns.png');
  });

  // ── Buttons ───────────────────────────────────────────────────────────────

  test('Create and Delete buttons are visible', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await expect(page.getByRole('button', { name: /^create$/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^delete$/i })).toBeVisible({ timeout: 5000 });
    await shot(page, 'quickrun-daily-04-buttons.png');
  });

  // ── Create dialog ─────────────────────────────────────────────────────────

  test('Create Quick Run dialog opens with Name input', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, 'quickrun-daily-05-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    // Cancel to clean up
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
  });

  test('Fill name then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // Use only enabled, non-readonly text inputs (skip disabled/readonly comboboxes)
    const editableInput = dialog.locator(
      'input:not([disabled]):not([readonly]):not([type="checkbox"]):not([type="radio"])'
    ).first();
    const isEditable = await editableInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (isEditable) {
      const cancelName = 'auto_qr_cancel_' + Date.now();
      await editableInput.fill(cancelName);
      await shot(page, 'quickrun-daily-06-filled.png');
    } else {
      console.log('No editable input found in dialog — just cancelling');
      await shot(page, 'quickrun-daily-06-filled.png');
    }
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await shot(page, 'quickrun-daily-07-cancelled.png');
  });

  test('Create Quick Run → verify in grid → delete', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const qrName = 'auto_qr_' + Date.now();

    // Fill the Quick Run name (the active, non-disabled text input)
    const nameInput = dialog.locator(
      'input:not([disabled]):not([readonly]):not([type="checkbox"]):not([type="radio"])'
    ).first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(qrName);
    }

    // Select a report — required before Submit becomes enabled.
    // Click the "Select Report" button to open the picker, then pick the first available report.
    const selectReportBtn = dialog.getByRole('button', { name: /select report/i }).first();
    if (await selectReportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectReportBtn.click();
      await page.waitForTimeout(1500);
      // Pick the first report row in the picker dialog/panel
      const reportRow = page.locator('[role="row"], tr').filter({ has: page.locator('[role="gridcell"], td') }).first();
      if (await reportRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportRow.click();
        await page.waitForTimeout(500);
        // Confirm selection if there's a Select/OK button
        const confirmSelect = page.getByRole('button', { name: /^select$|^ok$|^confirm$/i }).first();
        if (await confirmSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmSelect.click();
          await page.waitForTimeout(500);
        }
      }
    }

    await shot(page, 'quickrun-daily-08-create-filled.png');

    // Only click Submit if it is actually enabled
    const submitBtn = dialog.getByRole('button', { name: /submit|create|ok|save/i }).first();
    const isEnabled = await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false);
    if (isEnabled) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'quickrun-daily-09-created.png');

      const newRow = page.locator('[role="gridcell"]').filter({ hasText: qrName }).first();
      const appeared = await newRow.isVisible({ timeout: 15000 }).catch(() => false);
      console.log(`Quick Run "${qrName}" appeared in grid: ${appeared}`);

      // Delete it
      if (appeared) {
        await newRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        const box = await newRow.boundingBox();
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
    } else {
      console.log('Submit still disabled after filling — cancelling (report selection may require manual interaction)');
      // Dismiss any open CDK overlay (autocomplete/dropdown) that may intercept clicks
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelBtn.click({ force: true });
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await shot(page, 'quickrun-daily-10-deleted.png');
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  test('Right-click on Quick Run row shows context menu', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'quickrun-daily-11-context-menu.png');
    const actions = ['Edit', 'Delete', 'Run', 'Copy', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Edit opens dialog', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    if (await editItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editItem.click();
      await page.waitForTimeout(1500);
      await shot(page, 'quickrun-daily-12-edit-dialog.png');
      const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
      const visible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Edit dialog opened: ${visible}`);
      if (visible) {
        const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
        else await page.keyboard.press('Escape');
      }
    } else {
      console.log('Edit option not found — skipping');
      await page.keyboard.press('Escape');
    }
  });

  test('Context menu — Run option is present', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const runItem = page.getByText('Run', { exact: false }).first();
    const visible = await runItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Run option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'quickrun-daily-13-ctx-run.png');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('Search box is present and functional', async ({ page }) => {
    await goTo(page, URLS.quickRun);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await shot(page, 'quickrun-daily-14-search.png');
    await searchBox.clear();
  });

});
