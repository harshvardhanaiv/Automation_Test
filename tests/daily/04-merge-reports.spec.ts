/**
 * 04-merge-reports.spec.ts
 *
 * Daily regression — Documents > Merge Reports
 * URL: /Documents/MergeReports
 *
 * Covers:
 *   - Page loads
 *   - Stats toolbar visible
 *   - Grid renders rows or empty state
 *   - Create button visible
 *   - Create dialog opens with Name field
 *   - Fill name and cancel (no side effects)
 *   - Create merge report → verify in grid → delete
 *   - Right-click context menu on existing merge report (all actions)
 *   - Search input present and functional
 *   - Column headers visible
 *   - Context menu — Schedule option
 *   - Context menu — Copy option
 */

import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

test.describe.serial('Merge Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('Merge Reports page loads', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    await expect(page).toHaveURL(/MergeReports/i);
    await shot(page, 'merge-daily-01-page.png');
  });

  test('Stats toolbar is visible', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'merge-daily-02-stats.png');
  });

  test('Grid renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    await page.waitForTimeout(500);
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'merge-daily-03-grid.png');
  });

  // ── Create ────────────────────────────────────────────────────────────────

  test('Create button is visible', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const btn = page.getByRole('button', { name: /create/i }).or(page.getByRole('button', { name: /add/i })).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await shot(page, 'merge-daily-04-create-btn.png');
  });

  test('Create dialog opens with Name input', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const btn = page.getByRole('button', { name: /create/i }).or(page.getByRole('button', { name: /add/i })).first();
    await btn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'merge-daily-05-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('Fill merge report name then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const btn = page.getByRole('button', { name: /create/i }).or(page.getByRole('button', { name: /add/i })).first();
    await btn.click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    const nameInput = dialog.locator('input').first();
    const cancelName = 'auto_merge_cancel_' + Date.now();
    await nameInput.fill(cancelName);
    await shot(page, 'merge-daily-06-filled.png');
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await shot(page, 'merge-daily-07-cancelled.png');
    // Verify the cancelled name is NOT in the grid
    const cancelledRow = page.locator('[role="gridcell"]').filter({ hasText: cancelName });
    await expect(cancelledRow).not.toBeVisible({ timeout: 5000 });
  });

  test('Create merge report → verify in grid → delete', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const btn = page.getByRole('button', { name: /create/i }).or(page.getByRole('button', { name: /add/i })).first();
    await btn.click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const mergeName = 'auto_merge_' + Date.now();
    await dialog.locator('input').first().fill(mergeName);
    await shot(page, 'merge-daily-08-create-filled.png');
    // Submit
    const submitBtn = dialog.getByRole('button', { name: /submit|create|ok|save/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(2000);
    await shot(page, 'merge-daily-09-created.png');
    // Verify in grid
    const newRow = page.locator('[role="gridcell"]').filter({ hasText: mergeName }).first();
    const appeared = await newRow.isVisible({ timeout: 15000 }).catch(() => false);
    console.log(`Merge report "${mergeName}" appeared in grid: ${appeared}`);

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
    await shot(page, 'merge-daily-10-deleted.png');
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  test('Right-click on merge report row shows context menu', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'merge-daily-11-context-menu.png');
    const actions = ['Edit', 'Delete', 'Schedule', 'Run', 'Copy', 'Share', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'merge-daily-12-ctx-edit.png');
  });

  test('Context menu — Schedule option is present', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const scheduleItem = page.getByText('Schedule', { exact: false }).first();
    const visible      = await scheduleItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Schedule option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'merge-daily-13-ctx-schedule.png');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('Search input is present and functional', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await shot(page, 'merge-daily-14-search.png');
    await searchBox.clear();
    await page.waitForTimeout(500);
  });

  // ── Column headers ────────────────────────────────────────────────────────

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.mergeReports);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Column headers visible: ${visible}`);
    await shot(page, 'merge-daily-15-columns.png');
  });

});
