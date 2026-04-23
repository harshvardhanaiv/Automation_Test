/**
 * reports.spec.ts
 *
 * Run a report with PDF format and verify it appears in the Request section.
 * Flow: Reports → Templates folder → Customers details → Parameter tab →
 *       Schedule tab (Right Now) → Output tab (PDF) → Run → Request section → verify.
 *
 * Based on codegen output, adapted to match project conventions
 * (inline helpers, globalSetup session, no LoginPage import).
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL    = 'https://aiv.test.oneaiv.com:8086/aiv/';
const REPORTS_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports';
const REQUESTS_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Request/Request';
const USERNAME    = 'Admin';
const PASSWORD    = 'Ganesh04';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector("input[name='username']", { timeout: 15000 });
  await page.fill("input[name='username']", USERNAME);
  await page.fill("input[name='password']", PASSWORD);
  await page.click("button:has-text('Login')");
  await page.waitForSelector(
    "input[placeholder='Search files and folders in All sections']",
    { timeout: 90000 }
  );
}

async function ensureLoggedIn(page: Page) {
  const onLoginPage = await page
    .locator("input[name='username']")
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onLoginPage) await doLogin(page);
}

async function goTo(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const isOnLoginPage = await page
    .locator("input[name='username']")
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isOnLoginPage) {
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  }

  // Wait for the app shell
  await Promise.race([
    page.getByPlaceholder('Search files and folders in All sections').waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
  await page.waitForTimeout(1500);
}

async function safeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

// ── Page handler (adapted from codegen) ──────────────────────────────────────

class RunReportPageHandler {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Open a named item in the file browser by double-clicking its name cell.
   *  The PrimeNG grid renders all rows in DOM but clips them with overflow:hidden.
   *  We scroll the grid's scrollable body to bring the row into view, then dblclick.
   */
  async openItemByName(name: string) {
    // Find the row element in DOM (may be clipped/hidden by overflow)
    const cell = this.page.locator('[role="gridcell"]').filter({ hasText: name }).first();

    // Wait for it to be attached to DOM
    await cell.waitFor({ state: 'attached', timeout: 20000 });

    // Scroll the grid's scrollable container until the cell is in viewport
    await this.page.evaluate((itemName) => {
      const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));
      const target = cells.find(c => c.textContent?.includes(itemName));
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }, name);

    await this.page.waitForTimeout(500);

    // Now it should be visible — dblclick
    await cell.waitFor({ state: 'visible', timeout: 10000 });
    await cell.dblclick();
    await this.page.waitForTimeout(2000);
  }

  /** Fill the Parameter tab — skip inputs that are already filled or read-only */
  async fillParameterTab() {
    const paramTab = this.page.locator('[role="tab"]').filter({ hasText: /parameter/i }).first();
    if (await paramTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await paramTab.click();
      await this.page.waitForTimeout(500);
    }
    // Fill any empty visible text inputs (parameters vary per report)
    const inputs = this.page.locator(
      'input[type="text"]:visible:not([readonly]):not([disabled])'
    );
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const val = await inputs.nth(i).inputValue();
      if (!val) await inputs.nth(i).fill('1').catch(() => {});
    }
  }

  /** Click the Schedule tab */
  async goToScheduleTab() {
    await this.page.locator('[role="tab"]').filter({ hasText: /schedule/i }).first().click();
    await this.page.waitForTimeout(500);
  }

  /** Select "Right Now" frequency */
  async selectRightNow() {
    // Right Now is a radio button or clickable label
    const rightNow = this.page.getByText('Right Now', { exact: false }).first();
    await rightNow.waitFor({ state: 'visible', timeout: 10000 });
    await rightNow.click();
    await this.page.waitForTimeout(500);
  }

  /** Click the Output tab, set name and format to PDF */
  async fillOutputTab(runName: string) {
    await this.page.locator('[role="tab"]').filter({ hasText: /output/i }).first().click();
    await this.page.waitForTimeout(500);

    // Name field — placeholder is "Enter Static Name", name attr is "soutputname"
    const nameInput = this.page.locator('input[name="soutputname"]')
      .or(this.page.getByPlaceholder('Enter Static Name'));
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill(runName);

    // Format dropdown — click current value then pick PDF
    const currentFormat = this.page.getByText('rptdocument', { exact: true }).first();
    const isFormatVisible = await currentFormat.isVisible({ timeout: 3000 }).catch(() => false);
    if (isFormatVisible) {
      await currentFormat.click();
      const pdfOption = this.page.getByRole('option', { name: /^pdf$/i })
        .or(this.page.locator('li').filter({ hasText: /^pdf$/i }))
        .first();
      await pdfOption.waitFor({ state: 'visible', timeout: 5000 });
      await pdfOption.click();
    }
  }

  /** Click the RUN button */
  async clickRun() {
    await this.page.getByRole('button', { name: /^run$/i }).click();
    await this.page.waitForTimeout(3000);
  }

  /** Verify the run appears in the Request section (polls up to ~60s) */
  async verifyExecutionStatus(runName: string) {
    console.log(`\n🔍 Looking for request: "${runName}"`);
    for (let i = 0; i < 12; i++) {
      console.log(`  Attempt ${i + 1}/12`);
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.page.waitForTimeout(2000);

      const row = this.page.getByText(runName, { exact: false });
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  ✅ Request found');
        // Log status if visible
        for (const status of ['Completed', 'Running', 'Failed', 'Scheduled']) {
          if (await this.page.getByText(status, { exact: false }).isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`  📊 Status: ${status}`);
            break;
          }
        }
        return;
      }
      console.log('  ⏳ Not found yet...');
      await this.page.waitForTimeout(3000);
    }
    throw new Error(`❌ Request "${runName}" not found after 12 attempts`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Run report with PDF format and verify in Requests', async ({ page }) => {
    const handler = new RunReportPageHandler(page);

    // ── 1. Navigate to Reports ──────────────────────────────────────────────
    await goTo(page, REPORTS_URL);
    await safeScreenshot(page, 'reports-01-reports-list.png');

    // ── 2. Open "Customers details" report directly from root ───────────────
    await safeScreenshot(page, 'reports-02-reports-list.png');
    await handler.openItemByName('Customers details');
    await safeScreenshot(page, 'reports-03-scheduler-open.png');

    // ── 4. Parameter tab ────────────────────────────────────────────────────
    await handler.fillParameterTab();
    await safeScreenshot(page, 'reports-04-parameters-filled.png');

    // ── 5. Schedule tab → Right Now ─────────────────────────────────────────
    await handler.goToScheduleTab();
    await handler.selectRightNow();
    await safeScreenshot(page, 'reports-05-schedule-rightnow.png');

    // ── 6. Output tab → set name + PDF ──────────────────────────────────────
    const runName = `Run_${Date.now()}`;
    await handler.fillOutputTab(runName);
    await safeScreenshot(page, 'reports-06-output-filled.png');

    // ── 7. Click RUN ────────────────────────────────────────────────────────
    await handler.clickRun();
    await safeScreenshot(page, 'reports-07-run-clicked.png');

    // ── 8. Navigate to Request section ──────────────────────────────────────
    await goTo(page, REQUESTS_URL);
    await safeScreenshot(page, 'reports-08-requests-page.png');

    // ── 9. Verify the run appears ───────────────────────────────────────────
    await handler.verifyExecutionStatus(runName);
    await safeScreenshot(page, 'reports-09-final-success.png');
  });

});
