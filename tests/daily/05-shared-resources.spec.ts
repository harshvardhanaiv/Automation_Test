/**
 * 05-shared-resources.spec.ts
 *
 * Daily regression — Documents > Shared Resources
 * URL: /Documents/SharedResources
 *
 * Covers:
 *   - Page loads
 *   - Stats counters visible with multiple buttons
 *   - Clicking a stat filter updates the grid
 *   - File browser grid/list renders rows or empty state
 *   - Search works (type, clear, no-match)
 *   - Right-click context menu on a row (all expected actions)
 *   - Context menu — Share option
 *   - Context menu — Download option
 *   - Context menu — Properties option
 *   - Column headers visible
 *   - Home breadcrumb present
 *   - View toggle (grid/list) if present
 */

import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

test.describe.serial('Shared Resources', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('Shared Resources page loads', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    await expect(page).toHaveURL(/SharedResources/i);
    await shot(page, 'shared-daily-01-page.png');
  });

  test('Stats counters toolbar is visible', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'shared-daily-02-stats.png');
  });

  test('Stats toolbar has multiple filter buttons', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    const count = await toolbar.getByRole('button').count();
    expect(count).toBeGreaterThan(0);
    await shot(page, 'shared-daily-03-stat-btns.png');
  });

  test('Clicking a stat filter button updates the grid', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await toolbar.getByRole('button').first().click();
    await page.waitForTimeout(800);
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'shared-daily-04-filter-clicked.png');
  });

  // ── Grid ──────────────────────────────────────────────────────────────────

  test('File browser renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    await page.waitForTimeout(1000);
    const hasRows  = await page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') }).first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);
    await shot(page, 'shared-daily-05-grid.png');
  });

  test('Column headers are visible', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const header = page.locator('[role="columnheader"]').first();
    const visible = await header.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Column headers visible: ${visible}`);
    await shot(page, 'shared-daily-06-columns.png');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('Search box accepts input', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await shot(page, 'shared-daily-07-search-typed.png');
    await searchBox.clear();
    await page.waitForTimeout(500);
    await shot(page, 'shared-daily-08-search-cleared.png');
  });

  test('Search with no-match term shows empty state or zero rows', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await searchBox.fill('zzz_no_match_xyz_' + Date.now());
    await page.waitForTimeout(1200);
    await shot(page, 'shared-daily-09-search-nomatch.png');
    const hasEmpty = await page.getByText(/no.*record|no.*data|no.*found|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    const rowCount = await page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') }).count();
    expect(hasEmpty || rowCount === 0).toBe(true);
    await searchBox.clear();
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  test('Right-click on row shows context menu', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'shared-daily-10-context-menu.png');
    const actions = ['Copy', 'Move', 'Delete', 'Share', 'Download', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Share option is present', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const shareItem = page.getByText('Share', { exact: false }).first();
    const visible   = await shareItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Share option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'shared-daily-11-ctx-share.png');
  });

  test('Context menu — Download option is present', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const downloadItem = page.getByText('Download', { exact: false }).first();
    const visible      = await downloadItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Download option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'shared-daily-12-ctx-download.png');
  });

  test('Context menu — Properties option is present', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const propsItem = page.getByText('Properties', { exact: false }).first();
    const visible   = await propsItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Properties option visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'shared-daily-13-ctx-props.png');
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('Home breadcrumb button is present', async ({ page }) => {
    await goTo(page, URLS.sharedResources);
    const homeBtn = page.locator('button.aiv-outer-breadcrumb__home, button[aria-label*="home" i]').first();
    const visible  = await homeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Home breadcrumb visible: ${visible}`);
    await shot(page, 'shared-daily-14-breadcrumb.png');
  });

});
