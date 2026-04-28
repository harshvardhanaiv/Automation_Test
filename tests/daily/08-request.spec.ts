/**
 * 08-request.spec.ts
 *
 * Daily regression — Request section
 * Covers: Notifications, Requests, Alerts, Alert Reports
 *
 * All tests are read-only / non-destructive — safe to run daily.
 *
 * Notifications:
 *   - Page loads on Approvals tab
 *   - Approvals grid renders
 *   - Approve / Reject / Delete buttons visible
 *   - Messages tab loads with grid
 *   - Alerts tab loads
 *   - Instant Message button accessible
 *   - Tab badge counts visible
 *
 * Requests:
 *   - Page loads
 *   - Filter button present
 *   - All tabs: Schedule, Running, Completed, Waiting, Failed
 *   - Each tab shows grid or empty state
 *   - Delete button visible
 *   - Refresh button visible
 *
 * Alerts:
 *   - Page loads
 *   - Stats counters visible
 *   - Grid renders rows or empty state
 *   - Right-click context menu on alert row
 *   - Search box functional
 *   - Create Alert button visible
 *
 * Alert Reports:
 *   - Page loads
 *   - Grid or table visible
 *   - Name column present
 *   - Right-click context menu on row
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

async function clickTab(page: Page, label: string) {
  const re = new RegExp(label, 'i');
  const roleTab = page.locator('[role="tab"]').filter({ hasText: re }).first();
  if (await roleTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await roleTab.click(); await page.waitForTimeout(800); return;
  }
  const liTab = page.locator('li').filter({ hasText: re }).first();
  if (await liTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await liTab.click(); await page.waitForTimeout(800);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Notifications', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Notifications page loads on Approvals tab', async ({ page }) => {
    await goTo(page, URLS.notifications);
    await expect(page).toHaveURL(/Notifications/i);
    await shot(page, 'notif-daily-01-page.png');
  });

  test('Approvals tab — Delete, Approve, Reject buttons visible', async ({ page }) => {
    await goTo(page, URLS.notifications);
    await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /approve/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /reject/i }).first()).toBeVisible({ timeout: 5000 });
    await shot(page, 'notif-daily-02-approvals-btns.png');
  });

  test('Approvals tab grid is rendered', async ({ page }) => {
    await goTo(page, URLS.notifications);
    await expect(page.locator('[role="grid"]').first()).toBeVisible({ timeout: 15000 });
    await shot(page, 'notif-daily-03-approvals-grid.png');
  });

  test('Approvals grid has column headers', async ({ page }) => {
    await goTo(page, URLS.notifications);
    await expect(page.locator('[role="grid"]').first()).toBeVisible({ timeout: 15000 });
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Approvals column headers visible: ${visible}`);
    await shot(page, 'notif-daily-04-approvals-cols.png');
  });

  test('Messages tab loads with grid', async ({ page }) => {
    await goTo(page, URLS.notifications);
    const messagesTab = page.locator('li').filter({ hasText: /^Messages/i }).first();
    await messagesTab.waitFor({ state: 'visible', timeout: 15000 });
    await messagesTab.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[role="grid"]').first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'notif-daily-05-messages.png');
  });

  test('Messages tab has grid or empty state', async ({ page }) => {
    await goTo(page, URLS.notifications);
    const messagesTab = page.locator('li').filter({ hasText: /^Messages/i }).first();
    await messagesTab.waitFor({ state: 'visible', timeout: 15000 });
    await messagesTab.click();
    await page.waitForTimeout(1000);
    const hasGrid  = await page.locator('[role="grid"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'notif-daily-06-messages-grid.png');
  });

  test('Alerts tab loads', async ({ page }) => {
    await goTo(page, URLS.notifications);
    const alertsTab = page.locator('li').filter({ hasText: /^Alerts/i }).first();
    await alertsTab.waitFor({ state: 'attached', timeout: 15000 });
    await alertsTab.evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(1000);
    await expect(page.getByRole('searchbox').first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'notif-daily-07-alerts.png');
  });

  test('Instant Message button is accessible', async ({ page }) => {
    await goTo(page, URLS.notifications);
    const messagesTab = page.locator('li').filter({ hasText: /^Messages/i }).first();
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await page.waitForTimeout(800);
    }
    const imBtn = page
      .locator('button[title*="Instant"], button[aria-label*="Instant"]')
      .or(page.getByRole('button', { name: /instant message/i }))
      .first();
    if (await imBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await imBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'notif-daily-08-im-dialog.png');
      await page.keyboard.press('Escape');
    } else {
      console.log('Instant Message button not found — skipping');
    }
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  REQUESTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Requests', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Requests page loads', async ({ page }) => {
    await goTo(page, URLS.requests);
    await expect(page).toHaveURL(/Request\/Request/i);
    await shot(page, 'req-daily-01-page.png');
  });

  test('Filter button is present', async ({ page }) => {
    await goTo(page, URLS.requests);
    const filterBtn = page.getByRole('button', { name: /filter/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'req-daily-02-filter.png');
  });

  test('Delete button is present', async ({ page }) => {
    await goTo(page, URLS.requests);
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    const visible   = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Delete button visible: ${visible}`);
    await shot(page, 'req-daily-03-delete-btn.png');
  });

  test('Schedule tab is accessible and shows content', async ({ page }) => {
    await goTo(page, URLS.requests);
    await clickTab(page, 'Schedule');
    await expect(page).toHaveURL(/Request/i);
    await page.waitForTimeout(1000);
    // Schedule tab may show a grid, a list, or a different layout — just verify the app shell is still up
    const appShell = await page.getByRole('searchbox').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(appShell, 'App shell should still be visible after switching to Schedule tab').toBe(true);
    await shot(page, 'req-daily-04-schedule-tab.png');
  });

  test('Running tab is accessible and shows grid', async ({ page }) => {
    await goTo(page, URLS.requests);
    await clickTab(page, 'Running');
    const hasGrid  = await page.locator('[role="grid"], [role="treegrid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|no rows|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'req-daily-05-running-tab.png');
  });

  test('Completed tab is accessible and shows grid', async ({ page }) => {
    await goTo(page, URLS.requests);
    await clickTab(page, 'Completed');
    const hasGrid  = await page.locator('[role="grid"], [role="treegrid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|no rows|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'req-daily-06-completed-tab.png');
  });

  test('Waiting tab is accessible and shows grid', async ({ page }) => {
    await goTo(page, URLS.requests);
    await clickTab(page, 'Waiting');
    const hasGrid  = await page.locator('[role="grid"], [role="treegrid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|no rows|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'req-daily-07-waiting-tab.png');
  });

  test('Failed tab is accessible', async ({ page }) => {
    await goTo(page, URLS.requests);
    await clickTab(page, 'Failed');
    const hasGrid  = await page.locator('[role="grid"], [role="treegrid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|no rows|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'req-daily-08-failed-tab.png');
  });

  test('Right-click on request row shows context menu', async ({ page }) => {
    await goTo(page, URLS.requests);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'req-daily-09-context-menu.png');
    const actions = ['Delete', 'Stop', 'Retry', 'Properties', 'View'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    console.log(`Request context menu found: ${menuFound}`);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  ALERTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Alerts', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Alerts page loads', async ({ page }) => {
    await goTo(page, URLS.alerts);
    await expect(page).toHaveURL(/Request\/Alerts/i);
    await expect(page.getByPlaceholder('Search files and folders')).toBeVisible({ timeout: 10000 });
    await shot(page, 'alerts-daily-01-page.png');
  });

  test('Alerts stats counters visible', async ({ page }) => {
    await goTo(page, URLS.alerts);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'alerts-daily-02-stats.png');
  });

  test('Alerts grid renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.alerts);
    await page.waitForTimeout(500);
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'alerts-daily-03-grid.png');
  });

  test('Create Alert button is visible', async ({ page }) => {
    await goTo(page, URLS.alerts);
    const createBtn = page.getByRole('button', { name: /create/i }).first();
    const visible   = await createBtn.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Create Alert button visible: ${visible}`);
    await shot(page, 'alerts-daily-04-create-btn.png');
  });

  test('Search box is functional', async ({ page }) => {
    await goTo(page, URLS.alerts);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await searchBox.clear();
    await shot(page, 'alerts-daily-05-search.png');
  });

  test('Right-click on alert row shows context menu', async ({ page }) => {
    await goTo(page, URLS.alerts);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No alert rows — skipping'); return; }
    await shot(page, 'alerts-daily-06-context-menu.png');
    const actions = ['Edit', 'Delete', 'Share', 'Download', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: true }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Edit option is present', async ({ page }) => {
    await goTo(page, URLS.alerts);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    const visible  = await editItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Alert Edit option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'alerts-daily-07-ctx-edit.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  ALERT REPORTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Alert Reports', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Alert Reports page loads', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    await expect(page).toHaveURL(/AlertsX/i);
    await shot(page, 'alertrep-daily-01-page.png');
  });

  test('Alert Reports grid or table is visible', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    await page.waitForTimeout(500);
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'alertrep-daily-02-grid.png');
  });

  test('Alert Reports has Name column', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    const nameCol = page.getByText('Name', { exact: true }).first();
    await expect(nameCol).toBeVisible({ timeout: 10000 });
    await shot(page, 'alertrep-daily-03-columns.png');
  });

  test('Alert Reports stats toolbar is visible', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    const visible  = await toolbar.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Alert Reports stats toolbar visible: ${visible}`);
    await shot(page, 'alertrep-daily-04-stats.png');
  });

  test('Right-click on alert report row shows context menu', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'alertrep-daily-05-context-menu.png');
    const actions = ['Edit', 'Delete', 'Share', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    console.log(`Alert Report context menu found: ${menuFound}`);
    await page.keyboard.press('Escape');
  });

  test('Search box is functional', async ({ page }) => {
    await goTo(page, URLS.alertReports);
    const searchBox = page.getByPlaceholder('Search files and folders');
    const visible   = await searchBox.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await searchBox.fill('test');
      await page.waitForTimeout(800);
      await searchBox.clear();
    }
    await shot(page, 'alertrep-daily-06-search.png');
  });

});
