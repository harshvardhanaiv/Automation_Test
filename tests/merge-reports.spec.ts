/**
 * merge-reports.spec.ts
 *
 * Tests for the Merge Reports feature.
 * Covers: navigate to Merge Reports, verify the UI elements,
 * add reports to the merge list, configure output, and cancel.
 *
 * The Merge Reports section is accessible from the sidebar under
 * Documents → Merge Reports (URL: /aiv/Documents/MergeReports).
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL         = 'https://aiv.test.oneaiv.com:8086/aiv/';
const MERGE_REPORTS_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Documents/MergeReports';
const REPORTS_URL      = 'https://aiv.test.oneaiv.com:8086/aiv/Documents/Reports';
const USERNAME         = 'Admin';
const PASSWORD         = 'Ganesh04';

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
  // Use a generous timeout — the app can be slow to respond
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const isOnLoginPage = await page
    .locator("input[name='username']")
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isOnLoginPage) {
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  }

  // Wait for the app shell — either the global search box or the hamburger menu
  await Promise.race([
    page.getByPlaceholder('Search files and folders in All sections').waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
  await page.waitForTimeout(1500);
}

async function safeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

/**
 * Navigate to Merge Reports via the sidebar.
 * Falls back to direct URL navigation if sidebar items are not found.
 */
async function navigateToMergeReports(page: Page) {
  const hamburger = page.locator('button.smenu_button');
  const isHamburgerVisible = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
  if (isHamburgerVisible) {
    await hamburger.click();
    await page.waitForTimeout(500);
  }

  const documentsItem = page.locator('.sidebardiv').getByText('Documents', { exact: false }).first();
  const isDocumentsVisible = await documentsItem.isVisible({ timeout: 3000 }).catch(() => false);
  if (isDocumentsVisible) {
    await documentsItem.click();
    await page.waitForTimeout(500);
  }

  const mergeItem = page.locator('.sidebardiv').getByText('Merge Reports', { exact: false }).first();
  const isMergeVisible = await mergeItem.isVisible({ timeout: 3000 }).catch(() => false);
  if (isMergeVisible) {
    await mergeItem.click();
    await page.waitForTimeout(1500);
  } else {
    await goTo(page, MERGE_REPORTS_URL);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  MERGE REPORTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Merge Reports', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── 1. Navigate to Merge Reports ──────────────────────────────────────────
  test('Navigate to Merge Reports section', async ({ page }) => {
    await goTo(page, BASE_URL);
    await navigateToMergeReports(page);
    await safeScreenshot(page, 'merge-reports-01-section.png');

    // Page should show "Merge Reports" heading or related text
    await expect(
      page.getByText('Merge', { exact: false }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  // ── 2. Merge Reports page loads ───────────────────────────────────────────
  test('Merge Reports page loads correctly', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);
    await safeScreenshot(page, 'merge-reports-02-page-load.png');

    // The page should be accessible (not a 404 / error page)
    const pageContent = await page.locator('body').innerText();
    expect(pageContent).not.toContain('404');
    expect(pageContent).not.toContain('Page not found');
  });

  // ── 3. Create Merge Report button is present ──────────────────────────────
  test('Create / Add button is visible on Merge Reports page', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);
    await safeScreenshot(page, 'merge-reports-03-create-btn.png');

    // Look for a Create / Add / New button
    const createBtn =
      page.getByRole('button', { name: /create/i })
        .or(page.getByRole('button', { name: /add/i }))
        .or(page.getByRole('button', { name: /new/i }))
        .first();

    await expect(createBtn).toBeVisible({ timeout: 15000 });
  });

  // ── 4. Open Create Merge Report dialog ───────────────────────────────────
  test('Open Create Merge Report dialog', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);

    const createBtn =
      page.getByRole('button', { name: /create/i })
        .or(page.getByRole('button', { name: /add/i }))
        .or(page.getByRole('button', { name: /new/i }))
        .first();

    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click();
    await page.waitForTimeout(1500);
    await safeScreenshot(page, 'merge-reports-04-dialog-open.png');

    // A dialog or panel should appear
    const dialog = page.getByRole('dialog')
      .or(page.locator('.p-dialog'))
      .or(page.locator('.modal'))
      .first();

    await expect(dialog).toBeVisible({ timeout: 10000 });
  });

  // ── 5. Merge Report dialog has a Name field ───────────────────────────────
  test('Merge Report dialog contains a Name input', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);

    const createBtn =
      page.getByRole('button', { name: /create/i })
        .or(page.getByRole('button', { name: /add/i }))
        .or(page.getByRole('button', { name: /new/i }))
        .first();

    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click();
    await page.waitForTimeout(1500);

    // Name input should be present in the dialog
    const nameInput = page.getByRole('dialog').locator('input').first()
      .or(page.locator('.p-dialog input').first());

    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'merge-reports-05-name-field.png');
  });

  // ── 6. Fill name and add reports to merge ────────────────────────────────
  test('Fill merge report name and add reports', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);

    const createBtn =
      page.getByRole('button', { name: /create/i })
        .or(page.getByRole('button', { name: /add/i }))
        .or(page.getByRole('button', { name: /new/i }))
        .first();

    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click();
    await page.waitForTimeout(1500);
    await safeScreenshot(page, 'merge-reports-06-before-fill.png');

    // Fill the merge report name
    const nameInput = page.getByRole('dialog').locator('input').first()
      .or(page.locator('.p-dialog input').first());
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    const mergeName = 'auto_merge_' + Date.now();
    await nameInput.fill(mergeName);

    await safeScreenshot(page, 'merge-reports-07-name-filled.png');

    // Look for an "Add Report" button inside the dialog to add reports to merge
    const addReportBtn = page.getByRole('dialog')
      .getByRole('button', { name: /add/i })
      .or(page.locator('.p-dialog').getByRole('button', { name: /add report/i }))
      .first();

    const isAddVisible = await addReportBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (isAddVisible) {
      await addReportBtn.click();
      await page.waitForTimeout(1000);
      await safeScreenshot(page, 'merge-reports-08-add-report-clicked.png');
    }

    // Cancel to clean up
    const cancelBtn = page.getByRole('dialog').getByRole('button', { name: /cancel/i })
      .or(page.locator('.p-dialog').getByRole('button', { name: /cancel/i }))
      .first();
    const isCancelVisible = await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (isCancelVisible) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);
    }
    await safeScreenshot(page, 'merge-reports-09-cancelled.png');
  });

  // ── 7. Merge Reports list shows existing entries ──────────────────────────
  test('Merge Reports list is displayed', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);
    await safeScreenshot(page, 'merge-reports-10-list.png');

    // Either a table/grid with rows, or an empty-state message — both are valid
    const hasRows = await page
      .locator('[role="row"]')
      .filter({ hasNot: page.locator('[role="columnheader"]') })
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    const hasEmptyMsg = await page
      .getByText(/no.*found|no.*data|empty/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasRows || hasEmptyMsg).toBe(true);
  });

  // ── 8. Right-click on a merge report row shows context menu ───────────────
  test('Right-click on merge report row shows context menu', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);

    const rows = page.locator('[role="row"]')
      .filter({ hasNot: page.locator('[role="columnheader"]') });

    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(); // No rows to right-click — skip gracefully
      return;
    }

    await rows.first().click({ button: 'right' });
    await page.waitForTimeout(600);
    await safeScreenshot(page, 'merge-reports-11-context-menu.png');

    // Context menu should appear with at least one option
    const menuVisible =
      (await page.getByText('Delete', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await page.getByText('Edit', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await page.getByText('Run', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await page.getByText('Schedule', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false));

    expect(menuVisible).toBe(true);
  });

  // ── 9. Merge Reports page has a search / filter input ─────────────────────
  test('Merge Reports page has a search input', async ({ page }) => {
    await goTo(page, MERGE_REPORTS_URL);
    await safeScreenshot(page, 'merge-reports-12-search.png');

    // Either the global search box or a local filter input
    const searchBox =
      page.getByPlaceholder('Search files and folders in All sections')
        .or(page.locator('input[type="text"]').first());

    await expect(searchBox).toBeVisible({ timeout: 10000 });
  });

});
