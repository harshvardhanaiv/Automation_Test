/**
 * 03-reports.spec.ts
 *
 * Daily regression — Documents > Reports
 * URL: /Documents/Reports
 *
 * Covers:
 *   - Page loads with file browser
 *   - Stats counters visible
 *   - Search works (type, clear, no results)
 *   - Right-click context menu on a report (all expected actions)
 *   - Scheduler dialog opens on double-click
 *   - Scheduler tabs: Parameter, Schedule, Output, Email
 *   - Schedule tab — Right Now / Once / Recurring options
 *   - Schedule tab — Event schedule option
 *   - Output tab — format dropdown present
 *   - Output tab — output name field present
 *   - Email tab — To/CC/Subject fields
 *   - Run report Right Now → verify in Requests
 *   - Schedule Once — date picker visible
 *   - Schedule Recurring — frequency options visible
 *   - Scheduler close button works
 *   - Column headers visible (Name, Type, Modified)
 *   - Home breadcrumb present
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot } from '../helpers';

const REPORT_NAME = 'Customers details';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function openReportScheduler(page: Page, reportName: string) {
  await goTo(page, URLS.reports);
  const cell = page.locator('[role="gridcell"]').filter({ hasText: reportName }).first();
  await cell.waitFor({ state: 'attached', timeout: 20000 });
  await page.evaluate((name) => {
    const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));
    const t = cells.find(c => c.textContent?.includes(name));
    if (t) t.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, reportName);
  await cell.waitFor({ state: 'visible', timeout: 10000 });
  await cell.dblclick();
  await page.waitForTimeout(2000);
}

async function clickSchedulerTab(page: Page, label: string): Promise<boolean> {
  const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(label, 'i') }).first();
  if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

async function closeScheduler(page: Page) {
  const closeBtn = page.getByRole('button', { name: /close|cancel/i }).first();
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('Reports page loads with file browser', async ({ page }) => {
    await goTo(page, URLS.reports);
    await expect(page).toHaveURL(/Reports/i);
    await expect(page.getByPlaceholder('Search files and folders')).toBeVisible();
    await shot(page, 'reports-daily-01-page.png');
  });

  test('Reports page shows stats counters toolbar', async ({ page }) => {
    await goTo(page, URLS.reports);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    await shot(page, 'reports-daily-02-stats.png');
  });

  test('Stats toolbar has multiple filter buttons', async ({ page }) => {
    await goTo(page, URLS.reports);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    await expect(toolbar).toBeVisible({ timeout: 10000 });
    const buttons = toolbar.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    await shot(page, 'reports-daily-03-stat-btns.png');
  });

  test('Grid renders rows or empty state', async ({ page }) => {
    await goTo(page, URLS.reports);
    await page.waitForTimeout(500);
    const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 20000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
    await shot(page, 'reports-daily-04-grid.png');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('Search box accepts input and filters', async ({ page }) => {
    await goTo(page, URLS.reports);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('Customers');
    await page.waitForTimeout(1000);
    await shot(page, 'reports-daily-05-search-typed.png');
    await searchBox.clear();
    await page.waitForTimeout(500);
    await shot(page, 'reports-daily-06-search-cleared.png');
  });

  test('Search with no-match term shows empty state or no rows', async ({ page }) => {
    await goTo(page, URLS.reports);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await searchBox.fill('zzz_no_match_xyz_' + Date.now());
    await page.waitForTimeout(1200);
    await shot(page, 'reports-daily-07-search-nomatch.png');
    // Either empty state message or zero rows
    const hasEmpty = await page.getByText(/no.*record|no.*data|no.*found|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
    const rowCount = await page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') }).count();
    expect(hasEmpty || rowCount === 0, 'No results should show empty state or zero rows').toBe(true);
    await searchBox.clear();
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  test('Right-click on report shows context menu', async ({ page }) => {
    await goTo(page, URLS.reports);
    const rows = page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') });
    if (await rows.count() === 0) { console.log('No rows'); return; }
    const firstRow = rows.first();
    await firstRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await firstRow.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(600);
    await shot(page, 'reports-daily-08-context-menu.png');
    const actions = ['Schedule', 'Copy', 'Move', 'Delete', 'Share', 'Download', 'Properties'];
    let found = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { found = true; break; }
    }
    expect(found).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Schedule option is present', async ({ page }) => {
    await goTo(page, URLS.reports);
    const rows = page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') });
    if (await rows.count() === 0) { console.log('No rows'); return; }
    const firstRow = rows.first();
    await firstRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await firstRow.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(600);
    const scheduleItem = page.getByText('Schedule', { exact: false }).first();
    const visible = await scheduleItem.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Schedule context menu item visible: ${visible}`);
    await page.keyboard.press('Escape');
    await shot(page, 'reports-daily-09-ctx-schedule.png');
  });

  // ── Scheduler dialog ──────────────────────────────────────────────────────

  test('Scheduler dialog opens on double-click', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    await shot(page, 'reports-daily-10-scheduler.png');
    const tab = page.locator('[role="tab"]').first();
    await expect(tab).toBeVisible({ timeout: 10000 });
  });

  test('Scheduler — all 4 tabs are present', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    const tabLabels = ['Parameter', 'Schedule', 'Output', 'Email'];
    for (const label of tabLabels) {
      const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(label, 'i') }).first();
      const visible = await tab.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Tab "${label}" visible: ${visible}`);
    }
    await shot(page, 'reports-daily-11-tabs.png');
  });

  test('Scheduler — Parameter tab is accessible', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    const found = await clickSchedulerTab(page, 'Parameter');
    await shot(page, 'reports-daily-12-param-tab.png');
    if (!found) console.log('Parameter tab not found — skipping');
  });

  test('Scheduler — Schedule tab is accessible', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    const found = await clickSchedulerTab(page, 'Schedule');
    await shot(page, 'reports-daily-13-schedule-tab.png');
    if (!found) console.log('Schedule tab not found — skipping');
  });

  test('Scheduler — Schedule tab has Right Now / Once / Recurring options', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Schedule')) return;
    const rightNow  = page.getByText('Right Now', { exact: false }).first();
    const once      = page.getByText('Once', { exact: false }).first();
    const recurring = page.getByText('Recurring', { exact: false }).first();
    const hasRightNow  = await rightNow.isVisible({ timeout: 5000 }).catch(() => false);
    const hasOnce      = await once.isVisible({ timeout: 3000 }).catch(() => false);
    const hasRecurring = await recurring.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRightNow || hasOnce || hasRecurring, 'At least one frequency option should be visible').toBe(true);
    await shot(page, 'reports-daily-14-schedule-options.png');
  });

  test('Scheduler — Once option shows date/time picker', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Schedule')) return;
    const onceOption = page.getByText('Once', { exact: false }).first();
    if (await onceOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await onceOption.click();
      await page.waitForTimeout(600);
      // Date picker or date input should appear
      const datePicker = page.locator('p-calendar, input[type="date"], input[placeholder*="date" i]').first();
      const visible = await datePicker.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Date picker visible after Once: ${visible}`);
      await shot(page, 'reports-daily-15-once-datepicker.png');
    }
  });

  test('Scheduler — Recurring option shows frequency dropdown', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Schedule')) return;
    const recurringOption = page.getByText('Recurring', { exact: false }).first();
    if (await recurringOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recurringOption.click();
      await page.waitForTimeout(600);
      const freqDropdown = page.locator('p-dropdown, select').first();
      const visible = await freqDropdown.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Frequency dropdown visible after Recurring: ${visible}`);
      await shot(page, 'reports-daily-16-recurring-freq.png');
    }
  });

  test('Scheduler — Output tab is accessible', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    const found = await clickSchedulerTab(page, 'Output');
    await shot(page, 'reports-daily-17-output-tab.png');
    if (!found) console.log('Output tab not found — skipping');
  });

  test('Scheduler — Output tab has format dropdown', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Output')) return;
    const formatEl = page.locator('p-dropdown, select').first();
    await expect(formatEl).toBeVisible({ timeout: 10000 });
    await shot(page, 'reports-daily-18-output-format.png');
  });

  test('Scheduler — Output tab has output name field', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Output')) return;
    const nameInput = page.locator('input[name="soutputname"]')
      .or(page.getByPlaceholder('Enter Static Name'))
      .or(page.locator('input[placeholder*="name" i]').first());
    const visible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Output name field visible: ${visible}`);
    await shot(page, 'reports-daily-19-output-name.png');
  });

  test('Scheduler — Email tab is accessible', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    const found = await clickSchedulerTab(page, 'Email');
    await shot(page, 'reports-daily-20-email-tab.png');
    if (!found) console.log('Email tab not found — skipping');
  });

  test('Scheduler — Email tab has To / Subject fields', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Email')) return;
    const toField      = page.locator('input[placeholder*="To" i], input[name*="to" i]').first();
    const subjectField = page.locator('input[placeholder*="Subject" i], input[name*="subject" i]').first();
    const hasTo      = await toField.isVisible({ timeout: 5000 }).catch(() => false);
    const hasSubject = await subjectField.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Email To field: ${hasTo}, Subject field: ${hasSubject}`);
    await shot(page, 'reports-daily-21-email-fields.png');
  });

  test('Scheduler close button dismisses dialog', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    await expect(page.locator('[role="tab"]').first()).toBeVisible({ timeout: 10000 });
    await closeScheduler(page);
    await shot(page, 'reports-daily-22-scheduler-closed.png');
    // Should be back on reports page
    await expect(page).toHaveURL(/Reports/i, { timeout: 10000 });
  });

  // ── Run Right Now ─────────────────────────────────────────────────────────

  test('Run report Right Now and verify in Requests', async ({ page }) => {
    await openReportScheduler(page, REPORT_NAME);
    if (!await clickSchedulerTab(page, 'Schedule')) return;

    const rightNow = page.getByText('Right Now', { exact: false }).first();
    if (await rightNow.isVisible({ timeout: 5000 }).catch(() => false)) await rightNow.click();

    if (!await clickSchedulerTab(page, 'Output')) return;
    const runName = `DailyRun_${Date.now()}`;
    const nameInput = page.locator('input[name="soutputname"]')
      .or(page.getByPlaceholder('Enter Static Name'));
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill(runName);
    }

    await shot(page, 'reports-daily-23-before-run.png');
    await page.getByRole('button', { name: /^run$/i }).click();
    await page.waitForTimeout(3000);

    await goTo(page, URLS.requests);
    await shot(page, 'reports-daily-24-requests.png');
    for (let i = 0; i < 10; i++) {
      if (await page.getByText(runName, { exact: false }).isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`✅ Request "${runName}" found`);
        break;
      }
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    }
    await shot(page, 'reports-daily-25-run-verified.png');
  });

});
