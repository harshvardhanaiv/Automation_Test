/**
 * helpers.ts
 *
 * Shared helpers used across all daily regression test files.
 * Import from here — do NOT duplicate these in individual spec files.
 */

import { Page, expect } from '@playwright/test';

export const BASE_URL          = 'https://aiv.test.oneaiv.com:8086/aiv/';
export const USERNAME          = 'Admin';
export const PASSWORD          = 'Ganesh04';

// ── Section URLs ──────────────────────────────────────────────────────────────
export const URLS = {
  // Documents
  reports:         `${BASE_URL}Documents/Reports`,
  mergeReports:    `${BASE_URL}Documents/MergeReports`,
  sharedResources: `${BASE_URL}Documents/SharedResources`,
  quickRun:        `${BASE_URL}Documents/QuickRun`,
  messages:        `${BASE_URL}Documents/Messages`,
  reportBursting:  `${BASE_URL}reportmap`,
  groupReport:     `${BASE_URL}groupReport`,

  // Master Data
  datasource:      `${BASE_URL}MasterData/Datasource`,
  datasets:        `${BASE_URL}MasterData/Datasets`,
  parameters:      `${BASE_URL}MasterData/Parameters`,
  webhook:         `${BASE_URL}MasterData/webhook`,
  groupDataset:    `${BASE_URL}groupDataset`,

  // Request
  notifications:   `${BASE_URL}Request/Notifications`,
  requests:        `${BASE_URL}Request/Request`,
  alerts:          `${BASE_URL}Request/Alerts`,
  alertReports:    `${BASE_URL}Request/AlertsX`,

  // Administration
  repository:      `${BASE_URL}Administration/Repository`,
  departments:     `${BASE_URL}Administration/Department`,
  users:           `${BASE_URL}Administration/Users`,
  roles:           `${BASE_URL}Administration/Roles`,
  emailUsers:      `${BASE_URL}Administration/EmailUsers`,
  fileTypes:       `${BASE_URL}Administration/FileTypes`,
  aivConfig:       `${BASE_URL}Administration/AivConfig`,
  license:         `${BASE_URL}Administration/License`,

  // Viz / Dashboard
  viz:             `${BASE_URL}Visualization/GridDashboard`,
  apiTokens:       `${BASE_URL}ApiTokens`,
  annotations:     `${BASE_URL}Annotation`,
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Support both login form variants
  const emailInput = page.locator("input[placeholder='Your email'], input[name='username']").first();
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill(USERNAME);
  await page.locator("input[placeholder='Password'], input[name='password']").first().fill(PASSWORD);
  await page.locator("button:has-text('Login')").click();
  await Promise.race([
    page.getByRole('searchbox').first().waitFor({ state: 'visible', timeout: 150000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 150000 }),
  ]);
}

export async function ensureLoggedIn(page: Page) {
  const onLogin = await page
    .locator("input[placeholder='Your email'], input[name='username']")
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onLogin) await doLogin(page);
}

/**
 * Navigate to a URL, re-login if session expired, wait for app shell.
 */
export async function goTo(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const onLogin = await page
    .locator("input[placeholder='Your email'], input[name='username']")
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (onLogin) {
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  }

  await Promise.race([
    page.getByRole('searchbox').first().waitFor({ state: 'visible', timeout: 150000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 150000 }),
  ]);
  await page.waitForTimeout(1500);
}

// ── Screenshot helper ─────────────────────────────────────────────────────────

export async function shot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

// ── Dialog helpers ────────────────────────────────────────────────────────────

export async function fillDialogField(page: Page, index: number, value: string) {
  const dialog = page.getByRole('dialog');
  const input = dialog
    .locator(
      'input:not([readonly]):not([disabled]):not([type="checkbox"]):not([type="radio"]),' +
      'textarea:not([readonly]):not([disabled])'
    )
    .nth(index);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.click({ force: true });
  await input.clear();
  await input.fill(value);
}

export async function submitDialog(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: /submit/i }).click();
  await page.waitForTimeout(2000);
}

export async function cancelDialog(page: Page) {
  const btn = page.getByRole('dialog').getByRole('button', { name: /cancel/i });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) await btn.click();
  else await page.keyboard.press('Escape');
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

export async function rightClickRow(page: Page, rowText: string, menuItem: string) {
  const cell = page
    .locator('[role="gridcell"]')
    .filter({ hasText: new RegExp('^' + rowText + '$') })
    .first();
  await cell.waitFor({ state: 'visible', timeout: 30000 });
  await cell.click({ button: 'right' });
  await page.waitForTimeout(600);
  await page.getByText(menuItem, { exact: false }).first().click();
}

/**
 * Verify a page loaded correctly: correct URL fragment + app shell visible.
 */
export async function assertPageLoaded(page: Page, urlFragment: string) {
  await expect(page).toHaveURL(new RegExp(urlFragment, 'i'), { timeout: 15000 });
  // Use the search box only — it's unique and always present when the app shell is loaded.
  // Avoid .or() which causes strict mode violations when both elements are present.
  await expect(
    page.getByRole('searchbox').first()
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Right-click the first data row in a grid/table using page.mouse.click().
 * Works even when rows are clipped by a virtual-scroll overflow container,
 * where Playwright's locator.click() fails with "element is not visible".
 *
 * Returns true if a row was found and clicked, false if no rows exist.
 */
export async function rightClickFirstRow(page: Page): Promise<boolean> {
  // Dismiss any leaked context menu first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const rows = page.locator('table tbody tr, [role="row"]')
    .filter({ has: page.locator('td, [role="gridcell"]') });

  if (await rows.count() === 0) return false;

  const firstRow = rows.first();
  // Scroll the row into view via JS (works inside overflow:hidden containers)
  await firstRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);

  const box = await firstRow.boundingBox();
  if (!box || box.width === 0) return false;

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
  await page.waitForTimeout(600);
  return true;
}
export async function assertGridOrEmpty(page: Page) {
  const hasGrid  = await page.locator('[role="grid"], table').first().isVisible({ timeout: 10000 }).catch(() => false);
  const hasEmpty = await page.getByText(/no.*record|no.*data|no.*found|empty/i).isVisible({ timeout: 3000 }).catch(() => false);
  expect(hasGrid || hasEmpty, 'Expected a grid or empty-state message').toBe(true);
}

/**
 * Verify a Create/Add button is visible on the current page.
 */
export async function assertCreateButton(page: Page) {
  const btn = page
    .getByRole('button', { name: /^create/i })
    .or(page.getByRole('button', { name: /^add/i }))
    .or(page.getByRole('button', { name: /^new/i }))
    .first();
  await expect(btn).toBeVisible({ timeout: 10000 });
}
