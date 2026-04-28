/**
 * users-roles.spec.ts
 *
 * FIELD INDEX NOTES (fillDialogField excludes readonly/disabled/checkbox/radio):
 *
 * Create User dialog (all fields enabled):
 *   0=Username, 1=Email, 2=FirstName, 3=LastName, 4=Password, 5=ConfirmPassword
 *
 * Edit User dialog (Username is disabled → excluded):
 *   0=Email, 1=FirstName, 2=LastName, 3=Password, 4=ConfirmPassword
 *
 * Create Role dialog (all fields enabled):
 *   0=Name, 1=Email, 2=Description
 *
 * Edit Role dialog (Name is disabled → excluded):
 *   0=Email, 1=Description
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL  = 'https://aiv.test.oneaiv.com:8086/aiv/';
const USERS_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Administration/Users';
const ROLES_URL = 'https://aiv.test.oneaiv.com:8086/aiv/Administration/Roles';
const USERNAME  = 'Admin';
const PASSWORD  = 'Ganesh04';

const TS = Date.now();
const TEST_USER = {
  username:  'tuser_' + TS,
  email:     'tuser_' + TS + '@test.com',
  firstName: 'Auto',
  lastName:  'Test',
  password:  'Test@1234',
};
const TEST_ROLE = {
  name:        'trole_' + TS,
  email:       'trole_' + TS + '@test.com',
  description: 'Auto test role ' + TS,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector("input[placeholder='Your email']", { timeout: 15000 });
  await page.fill("input[placeholder='Your email']", USERNAME);
  await page.fill("input[placeholder='Password']", PASSWORD);
  await page.click("button:has-text('Login')");
  await page.waitForSelector(
    "input[placeholder='Search files and folders']",
    { timeout: 90000 }
  );
}

async function ensureLoggedIn(page: Page) {
  // Only login if we're currently on the login page (not yet authenticated)
  const onLoginPage = await page.locator("input[placeholder='Your email']").isVisible({ timeout: 3000 }).catch(() => false);
  if (onLoginPage) await doLogin(page);
}

async function goTo(page: Page, url: string) {
  const searchBox = page.getByPlaceholder('Search files and folders');

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Check if we landed on the login page (session expired)
  const isOnLoginPage = await page.locator("input[placeholder='Your email']").isVisible({ timeout: 2000 }).catch(() => false);
  if (isOnLoginPage) {
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  // Wait for the search box — if the app redirected to Control Panel it will
  // eventually settle; just wait longer rather than firing another navigation
  await expect(searchBox).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(1500);
}

async function safeScreenshot(page: Page, screenshotPath: string) {
  await page.screenshot({ path: screenshotPath, timeout: 10000 }).catch(() => {});
}

async function rightClickRow(page: Page, rowText: string, menuItem: string) {
  // Exact-match the cell text so partial matches (e.g. tuser_123 vs tuser_1234) don't fire
  const cell = page
    .locator('[role="gridcell"]')
    .filter({ hasText: new RegExp('^' + rowText + '$') })
    .first();
  await cell.waitFor({ state: 'visible', timeout: 30000 });
  await cell.click({ button: 'right' });
  await page.waitForTimeout(600);
  await page.getByText(menuItem, { exact: false }).first().click();
}

async function fillDialogField(page: Page, index: number, value: string) {
  const dialog = page.getByRole('dialog');
  const input = dialog
    .locator(
      'input:not([readonly]):not([disabled]):not([type="checkbox"]):not([type="radio"]),' +
      'textarea:not([readonly]):not([disabled])'
    )
    .nth(index);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  // Click first — PrimeNG dialogs can leave fields visible-but-not-editable during animation
  await input.click({ force: true });
  await input.clear();
  await input.fill(value);
}

async function submitDialog(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /submit/i }).click();
  await page.waitForTimeout(2000);
}

async function cancelDialog(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /cancel/i }).click();
}

// ═════════════════════════════════════════════════════════════════════════════
//  USERS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Users', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Create User', async ({ page }) => {
    await goTo(page, USERS_URL);
    await safeScreenshot(page, 'screenshots/users-01-before-create.png');

    await page.getByRole('button', { name: 'Create User' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/users-02-create-dialog.png');

    // 0=Username, 1=Email, 2=FirstName, 3=LastName, 4=Password, 5=ConfirmPassword
    await fillDialogField(page, 0, TEST_USER.username);
    await fillDialogField(page, 1, TEST_USER.email);
    await fillDialogField(page, 2, TEST_USER.firstName);
    await fillDialogField(page, 3, TEST_USER.lastName);
    await fillDialogField(page, 4, TEST_USER.password);
    await fillDialogField(page, 5, TEST_USER.password);

    await safeScreenshot(page, 'screenshots/users-03-create-filled.png');
    await submitDialog(page);
    await safeScreenshot(page, 'screenshots/users-04-create-done.png');

    await expect(
      page.locator('[role="gridcell"]')
        .filter({ hasText: new RegExp('^' + TEST_USER.username + '$') })
        .first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('Edit User', async ({ page }) => {
    await goTo(page, USERS_URL);

    await rightClickRow(page, TEST_USER.username, 'Edit User');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/users-05-edit-dialog.png');

    // Username is disabled on edit → excluded; 0=Email, 1=FirstName, 2=LastName ...
    await fillDialogField(page, 1, 'Edited');

    await safeScreenshot(page, 'screenshots/users-06-edit-filled.png');
    await submitDialog(page);
    await safeScreenshot(page, 'screenshots/users-07-edit-done.png');
  });

  test('Assign Role to User', async ({ page }) => {
    await goTo(page, USERS_URL);

    // Right-click the user row → "Assign Roles by Users" from context menu
    await rightClickRow(page, TEST_USER.username, 'Assign Role');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/users-08-assign-role-dialog.png');

    // The Assign Role dialog shows a list of available roles — pick the first one
    // Roles are rendered as list items inside the dialog (not standard li visibility)
    const dialog = page.getByRole('dialog');
    const roleItem = dialog.locator('li').first();
    await roleItem.waitFor({ state: 'visible', timeout: 20000 });
    await roleItem.click({ force: true });

    await safeScreenshot(page, 'screenshots/users-09-assign-role-selected.png');
    await submitDialog(page);
    await safeScreenshot(page, 'screenshots/users-10-assign-role-done.png');
  });

  test('Delete User', async ({ page }) => {
    await goTo(page, USERS_URL);

    await rightClickRow(page, TEST_USER.username, 'Delete');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/users-11-delete-confirm.png');

    await page.getByRole('button', { name: /delete/i }).last().click();
    await page.waitForTimeout(2000);
    await safeScreenshot(page, 'screenshots/users-12-delete-done.png');

    await expect(
      page.locator('[role="gridcell"]')
        .filter({ hasText: new RegExp('^' + TEST_USER.username + '$') })
    ).not.toBeVisible({ timeout: 15000 });
  });

  test('Create User — cancel discards form', async ({ page }) => {
    await goTo(page, USERS_URL);

    await page.getByRole('button', { name: 'Create User' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

    await cancelDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await safeScreenshot(page, 'screenshots/users-13-create-cancelled.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  ROLES
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Roles', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Create Role', async ({ page }) => {
    await goTo(page, ROLES_URL);
    await safeScreenshot(page, 'screenshots/roles-01-before-create.png');

    await page.getByRole('button', { name: 'Create', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/roles-02-create-dialog.png');

    // 0=Name, 1=Email, 2=Description
    await fillDialogField(page, 0, TEST_ROLE.name);
    await fillDialogField(page, 1, TEST_ROLE.email);
    await fillDialogField(page, 2, TEST_ROLE.description);

    await safeScreenshot(page, 'screenshots/roles-03-create-filled.png');
    await submitDialog(page);
    await safeScreenshot(page, 'screenshots/roles-04-create-done.png');

    await expect(
      page.locator('[role="gridcell"]')
        .filter({ hasText: new RegExp('^' + TEST_ROLE.name + '$') })
        .first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('Edit Role', async ({ page }) => {
    await goTo(page, ROLES_URL);

    await rightClickRow(page, TEST_ROLE.name, 'Edit Role');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/roles-05-edit-dialog.png');

    // Name is disabled on edit → excluded; 0=Email, 1=Description
    await fillDialogField(page, 1, 'Updated by automated test');

    await safeScreenshot(page, 'screenshots/roles-06-edit-filled.png');
    await submitDialog(page);
    await safeScreenshot(page, 'screenshots/roles-07-edit-done.png');
  });

  test('Delete Role', async ({ page }) => {
    await goTo(page, ROLES_URL);

    await rightClickRow(page, TEST_ROLE.name, 'Delete');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'screenshots/roles-08-delete-confirm.png');

    await page.getByRole('button', { name: /delete/i }).last().click();
    await page.waitForTimeout(2000);
    await safeScreenshot(page, 'screenshots/roles-09-delete-done.png');

    await expect(
      page.locator('[role="gridcell"]')
        .filter({ hasText: new RegExp('^' + TEST_ROLE.name + '$') })
    ).not.toBeVisible({ timeout: 15000 });
  });

  test('Create Role — cancel discards form', async ({ page }) => {
    await goTo(page, ROLES_URL);

    await page.getByRole('button', { name: 'Create', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

    await cancelDialog(page);
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await safeScreenshot(page, 'screenshots/roles-10-create-cancelled.png');
  });

});
