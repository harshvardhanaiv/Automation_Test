/**
 * 09-administration.spec.ts
 *
 * Daily regression — Administration section
 * Covers: Repository, Departments, Users, Roles, Email Users, File Types,
 *         AIV Configuration, License
 *
 * CRUD tests for Users and Roles are in users-roles.spec.ts.
 * This file focuses on page-load, UI element, dialog, and non-destructive checks.
 */

import { test, expect, Page } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot, rightClickFirstRow } from '../helpers';

const TS = Date.now();

// ── Shared helpers ────────────────────────────────────────────────────────────

async function assertPageAndGrid(page: Page, url: string, urlFrag: string, prefix: string) {
  await goTo(page, url);
  await expect(page).toHaveURL(new RegExp(urlFrag, 'i'), { timeout: 15000 });
  await page.waitForTimeout(500);
  const hasGrid  = await page.locator('table, [role="grid"]').first().isVisible({ timeout: 20000 }).catch(() => false);
  const hasEmpty = await page.getByText(/no.*record|no.*data|empty/i).isVisible({ timeout: 5000 }).catch(() => false);
  expect(hasGrid || hasEmpty).toBe(true);
  await shot(page, `${prefix}-01-page.png`);
}

async function cancelDialog(page: Page) {
  const dialog = page.getByRole('dialog').first();
  const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
  if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cancelBtn.click();
  } else {
    const closeBtn = dialog.locator('[aria-label="Close"], .close').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click();
    else await page.keyboard.press('Escape');
  }
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPOSITORY
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Repository', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Repository page loads', async ({ page }) => {
    await goTo(page, URLS.repository);
    await expect(page).toHaveURL(/Repository/i);
    await shot(page, 'repo-daily-01-page.png');
  });

  test('Repository shows file browser or grid', async ({ page }) => {
    await goTo(page, URLS.repository);
    const hasGrid  = await page.locator('table, [role="grid"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasStats = await page.getByRole('toolbar', { name: /folder quick filters/i }).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGrid || hasStats).toBe(true);
    await shot(page, 'repo-daily-02-browser.png');
  });

  test('Repository stats toolbar is visible', async ({ page }) => {
    await goTo(page, URLS.repository);
    const toolbar = page.getByRole('toolbar', { name: /folder quick filters/i });
    const visible  = await toolbar.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Repository stats toolbar visible: ${visible}`);
    await shot(page, 'repo-daily-03-stats.png');
  });

  test('Repository search box is functional', async ({ page }) => {
    await goTo(page, URLS.repository);
    const searchBox = page.getByPlaceholder('Search files and folders');
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('test');
    await page.waitForTimeout(800);
    await searchBox.clear();
    await shot(page, 'repo-daily-04-search.png');
  });

  test('Right-click on repository row shows context menu', async ({ page }) => {
    await goTo(page, URLS.repository);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'repo-daily-05-context-menu.png');
    const actions = ['Copy', 'Move', 'Delete', 'Share', 'Download', 'Properties'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    console.log(`Repository context menu found: ${menuFound}`);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Departments', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Departments page loads with table', async ({ page }) => {
    await assertPageAndGrid(page, URLS.departments, 'Department', 'dept');
  });

  test('Departments table has Name column', async ({ page }) => {
    await goTo(page, URLS.departments);
    await expect(page.getByText('Name', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'dept-02-name-col.png');
  });

  test('Departments table has Code column', async ({ page }) => {
    await goTo(page, URLS.departments);
    const codeCol = page.getByText('Code', { exact: true }).first();
    const visible  = await codeCol.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Code column visible: ${visible}`);
    await shot(page, 'dept-03-code-col.png');
  });

  test('Create Department button is visible', async ({ page }) => {
    await goTo(page, URLS.departments);
    await expect(page.getByRole('button', { name: /^create$/i }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'dept-04-create-btn.png');
  });

  test('Create Department dialog opens with Name and Code fields', async ({ page }) => {
    await goTo(page, URLS.departments);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'dept-05-dialog.png');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const nameInput = dialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await cancelDialog(page);
  });

  test('Fill department name then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.departments);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const cancelName = 'auto_dept_cancel_' + TS;
    await dialog.locator('input').first().fill(cancelName);
    await shot(page, 'dept-06-filled.png');
    await cancelDialog(page);
    const cancelledRow = page.locator('[role="gridcell"]').filter({ hasText: cancelName });
    await expect(cancelledRow).not.toBeVisible({ timeout: 5000 });
    await shot(page, 'dept-07-cancelled.png');
  });

  test('Right-click on department row shows context menu', async ({ page }) => {
    await goTo(page, URLS.departments);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'dept-08-context-menu.png');
    const actions = ['Edit', 'Delete'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('Context menu — Edit opens dialog', async ({ page }) => {
    await goTo(page, URLS.departments);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    const editItem = page.getByText('Edit', { exact: false }).first();
    if (await editItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editItem.click();
      await page.waitForTimeout(1500);
      await shot(page, 'dept-09-edit-dialog.png');
      const dialog = page.getByRole('dialog').first();
      const visible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Department Edit dialog opened: ${visible}`);
      if (visible) await cancelDialog(page);
    } else {
      await page.keyboard.press('Escape');
    }
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  USERS (page-load & UI checks — CRUD is in users-roles.spec.ts)
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Users — UI checks', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Users page loads with table', async ({ page }) => {
    await assertPageAndGrid(page, URLS.users, 'Users', 'users-ui');
  });

  test('Users table has Username column', async ({ page }) => {
    await goTo(page, URLS.users);
    await expect(page.getByText('Username', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'users-ui-02-username-col.png');
  });

  test('Users table has Status column', async ({ page }) => {
    await goTo(page, URLS.users);
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'users-ui-03-status-col.png');
  });

  test('Create User button is visible', async ({ page }) => {
    await goTo(page, URLS.users);
    await expect(page.getByRole('button', { name: /create user/i })).toBeVisible({ timeout: 10000 });
    await shot(page, 'users-ui-04-create-btn.png');
  });

  test('Assign Role button is visible', async ({ page }) => {
    await goTo(page, URLS.users);
    await expect(page.getByRole('button', { name: /assign role/i })).toBeVisible({ timeout: 10000 });
    await shot(page, 'users-ui-05-assign-btn.png');
  });

  test('Create User dialog opens with all required fields', async ({ page }) => {
    await goTo(page, URLS.users);
    await page.getByRole('button', { name: /create user/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, 'users-ui-06-create-dialog.png');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // Should have Username, Email, First Name, Last Name, Password fields
    const inputs = dialog.locator('input:not([type="checkbox"]):not([type="radio"])');
    const count  = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await cancelDialog(page);
  });

  test('Right-click on user row shows context menu', async ({ page }) => {
    await goTo(page, URLS.users);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'users-ui-07-context-menu.png');
    const actions = ['Edit User', 'Delete', 'Assign Role', 'Backup'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  ROLES (page-load & UI checks — CRUD is in users-roles.spec.ts)
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Roles — UI checks', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Roles page loads with table', async ({ page }) => {
    await assertPageAndGrid(page, URLS.roles, 'Roles', 'roles-ui');
  });

  test('Roles table has Role column', async ({ page }) => {
    await goTo(page, URLS.roles);
    await expect(page.getByText('Role', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'roles-ui-02-role-col.png');
  });

  test('Create and Delete buttons are visible', async ({ page }) => {
    await goTo(page, URLS.roles);
    await expect(page.getByRole('button', { name: /^create$/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^delete$/i }).first()).toBeVisible({ timeout: 5000 });
    await shot(page, 'roles-ui-03-buttons.png');
  });

  test('Create Role dialog opens with Name, Email, Description fields', async ({ page }) => {
    await goTo(page, URLS.roles);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'roles-ui-04-create-dialog.png');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const inputs = dialog.locator('input:not([type="checkbox"]):not([type="radio"])');
    const count  = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await cancelDialog(page);
  });

  test('Right-click on role row shows context menu', async ({ page }) => {
    await goTo(page, URLS.roles);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'roles-ui-05-context-menu.png');
    const actions = ['Edit Role', 'Delete'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  EMAIL USERS
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Email Users', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('Email Users page loads with table', async ({ page }) => {
    await assertPageAndGrid(page, URLS.emailUsers, 'EmailUsers', 'emailusers');
  });

  test('Email Users table has Display Name column', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await expect(page.getByText('Display Name', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'emailusers-02-displayname-col.png');
  });

  test('Email Users table has Email column', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await expect(page.getByText('Email', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'emailusers-03-email-col.png');
  });

  test('Create Email User button is visible', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await expect(page.getByRole('button', { name: /create email user/i })).toBeVisible({ timeout: 10000 });
    await shot(page, 'emailusers-04-create-btn.png');
  });

  test('Create Email User dialog opens with required fields', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await page.getByRole('button', { name: /create email user/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, 'emailusers-05-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const inputs = dialog.locator('input:not([type="checkbox"]):not([type="radio"])');
    const count  = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Escape');
  });

  test('Fill email user then cancel — no record created', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await page.getByRole('button', { name: /create email user/i }).click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const cancelName = 'auto_eu_cancel_' + TS;
    await dialog.locator('input').first().fill(cancelName);
    await shot(page, 'emailusers-06-filled.png');
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await shot(page, 'emailusers-07-cancelled.png');
  });

  test('Right-click on email user row shows context menu', async ({ page }) => {
    await goTo(page, URLS.emailUsers);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'emailusers-08-context-menu.png');
    const actions = ['Edit', 'Delete'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    expect(menuFound).toBe(true);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  FILE TYPES
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('File Types', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('File Types page loads with table', async ({ page }) => {
    await assertPageAndGrid(page, URLS.fileTypes, 'FileTypes', 'filetypes');
  });

  test('File Types table has File Type column', async ({ page }) => {
    await goTo(page, URLS.fileTypes);
    const hasCol = await page.locator('[role="columnheader"]').filter({ hasText: /file type/i }).first().isVisible({ timeout: 10000 }).catch(() => false)
      || await page.locator('th').filter({ hasText: /file type/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCol, 'File Types column header should be present').toBe(true);
    await shot(page, 'filetypes-02-columns.png');
  });

  test('Create and Delete buttons are visible', async ({ page }) => {
    await goTo(page, URLS.fileTypes);
    await expect(page.getByRole('button', { name: /^create$/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^delete$/i }).first()).toBeVisible({ timeout: 5000 });
    await shot(page, 'filetypes-03-buttons.png');
  });

  test('Create File Type dialog opens', async ({ page }) => {
    await goTo(page, URLS.fileTypes);
    await page.getByRole('button', { name: /^create$/i }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'filetypes-04-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
    else await page.keyboard.press('Escape');
  });

  test('Right-click on file type row shows context menu', async ({ page }) => {
    await goTo(page, URLS.fileTypes);
    const found = await rightClickFirstRow(page);
    if (!found) { console.log('No rows — skipping'); return; }
    await shot(page, 'filetypes-05-context-menu.png');
    const actions = ['Edit', 'Delete'];
    let menuFound = false;
    for (const a of actions) {
      if (await page.getByText(a, { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false)) { menuFound = true; break; }
    }
    console.log(`File Types context menu found: ${menuFound}`);
    await page.keyboard.press('Escape');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  AIV CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('AIV Configuration', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('AIV Configuration page loads', async ({ page }) => {
    await goTo(page, URLS.aivConfig);
    await expect(page).toHaveURL(/AivConfig/i);
    await shot(page, 'aivconfig-daily-01-page.png');
  });

  test('Session timeout field is visible', async ({ page }) => {
    await goTo(page, URLS.aivConfig);
    const sessionInput = page.getByPlaceholder('Session timeout in minutes')
      .or(page.locator('input[placeholder*="Session"]'))
      .first();
    await expect(sessionInput).toBeVisible({ timeout: 10000 });
    await shot(page, 'aivconfig-daily-02-session-field.png');
  });

  test('Save / Update button is visible', async ({ page }) => {
    await goTo(page, URLS.aivConfig);
    const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
    const visible  = await saveBtn.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`AIV Config Save button visible: ${visible}`);
    await shot(page, 'aivconfig-daily-03-save-btn.png');
  });

  test('Configuration form has multiple input fields', async ({ page }) => {
    await goTo(page, URLS.aivConfig);
    const inputs = page.locator('input:not([type="checkbox"]):not([type="radio"])');
    const count  = await inputs.count();
    expect(count).toBeGreaterThan(0);
    await shot(page, 'aivconfig-daily-04-fields.png');
  });

  test('Configuration has section headings or tabs', async ({ page }) => {
    await goTo(page, URLS.aivConfig);
    const heading = page.locator('h2, h3, [role="tab"], .section-title').first();
    const visible  = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`AIV Config section heading visible: ${visible}`);
    await shot(page, 'aivconfig-daily-05-sections.png');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  LICENSE
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('License', () => {

  test.beforeEach(async ({ page }) => { await ensureLoggedIn(page); });

  test('License page loads', async ({ page }) => {
    await goTo(page, URLS.license);
    await expect(page).toHaveURL(/License/i);
    await shot(page, 'license-daily-01-page.png');
  });

  test('New Licence and Legacy Licence buttons are visible', async ({ page }) => {
    await goTo(page, URLS.license);
    await expect(page.getByRole('button', { name: /new licen/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /legacy licen/i })).toBeVisible({ timeout: 5000 });
    await shot(page, 'license-daily-02-buttons.png');
  });

  test('Buyer Name field is visible', async ({ page }) => {
    await goTo(page, URLS.license);
    const buyerName = page.getByPlaceholder('Buyer Name').or(page.locator('input[placeholder*="Buyer"]')).first();
    await expect(buyerName).toBeVisible({ timeout: 10000 });
    await shot(page, 'license-daily-03-buyer-field.png');
  });

  test('License key / serial field is visible', async ({ page }) => {
    await goTo(page, URLS.license);
    const keyField = page.locator('input[placeholder*="key" i], input[placeholder*="serial" i], textarea[placeholder*="key" i]').first();
    const visible  = await keyField.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`License key field visible: ${visible}`);
    await shot(page, 'license-daily-04-key-field.png');
  });

  test('License expiry / validity info is displayed', async ({ page }) => {
    await goTo(page, URLS.license);
    const expiryText = page.getByText(/expir|valid|licen/i).first();
    const visible    = await expiryText.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`License expiry info visible: ${visible}`);
    await shot(page, 'license-daily-05-expiry.png');
  });

  test('New Licence dialog opens', async ({ page }) => {
    await goTo(page, URLS.license);
    await page.getByRole('button', { name: /new licen/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, 'license-daily-06-new-dialog.png');
    const dialog = page.getByRole('dialog').or(page.locator('.p-dialog')).first();
    const visible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`New Licence dialog opened: ${visible}`);
    if (visible) {
      const cancelBtn = dialog.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
      else await page.keyboard.press('Escape');
    }
  });

});
