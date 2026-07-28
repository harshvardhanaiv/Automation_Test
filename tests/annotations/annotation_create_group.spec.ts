import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'https://aiv.test.oneaiv.com:8086/aiv/';
const USERNAME = 'Admin';
const PASSWORD = 'Ganesh04';

// ── Local Auth Helpers ─────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector("input[placeholder='Your email']", { timeout: 30000 });
  await page.fill("input[placeholder='Your email']", USERNAME);
  await page.fill("input[placeholder='Password']", PASSWORD);
  await page.click("button:has-text('Login')");
  await Promise.race([
    page.locator("input[placeholder*='Search']").first().waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
}

async function goTo(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  
  const loginInput = page.locator("input[placeholder='Your email']").first();
  const searchInput = page.locator("input[placeholder*='Search']").first();
  
  await Promise.race([
    loginInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);

  if (await loginInput.isVisible()) {
    console.log('👉 Not logged in / Session expired. Logging in...');
    await doLogin(page);
    
    const cleanUrl = url.replace(/\/$/, '');
    const cleanBaseUrl = BASE_URL.replace(/\/$/, '');
    if (cleanUrl !== cleanBaseUrl) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    }
  }

  await Promise.race([
    page.locator("input[placeholder*='Search']").first().waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
  await page.waitForTimeout(1500);
}

async function shot(page: Page, name: string) {
  const finalDir = path.join('screenshots', 'testing_w_deepseek', 'annotations', 'annotation group create');
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(finalDir, name), timeout: 15000 }).catch(() => {});
}

// ── Annotation Spec ────────────────────────────────────────────────────────────

test.describe('AIV Annotation - Create Group Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await goTo(page, BASE_URL);
    await page.waitForTimeout(1000);
  });

  test('annotation_create_group', async ({ page }) => {
    test.setTimeout(180000);

    // Step 1: Click Hamburger menu icon on top left
    console.log('👉 Clicking Hamburger icon...');
    const hamburgerBtn = page.locator('button.smenu_button, button:has(.fa-bars)').first();
    await expect(hamburgerBtn).toBeVisible({ timeout: 15000 });
    await hamburgerBtn.click();
    await page.waitForTimeout(1500);

    // Locate Annotations menu option
    console.log('👉 Locating Annotations in sidebar menu...');
    const annotationsMenu = page.locator('.sidebardiv span, .sidebardiv a, li a span')
      .filter({ hasText: /^Annotations$/ }).first();
    await expect(annotationsMenu).toBeVisible({ timeout: 15000 });
    await shot(page, '01-hamburger-menu-annotations.png');

    // Step 2: Click Annotations and wait 2 seconds for screen to load
    console.log('👉 Clicking Annotations menu item...');
    await annotationsMenu.click();
    await page.waitForTimeout(2000);

    // Verify URL
    await expect.poll(() => page.url(), { timeout: 30000 }).toContain('Annotation');
    await page.waitForTimeout(2000);

    // Step 3: Hover over Create Group cube icon
    console.log('👉 Locating Create Group cube icon...');
    const createGroupIcon = page.locator('i.fa-cubes, a:has(i.fa-cubes), [title="Create Group"]').first();
    await expect(createGroupIcon).toBeVisible({ timeout: 15000 });
    await createGroupIcon.hover();
    await page.waitForTimeout(1000);
    await shot(page, '02-create-group-icon.png');

    // Step 4: Click Create Group icon
    console.log('👉 Clicking Create Group icon...');
    await createGroupIcon.click();
    await page.waitForTimeout(2000);

    // Verify Create Group dialog appears
    console.log('👉 Verifying Create Group dialog...');
    const dialogTitle = page.locator('p-dialog, [role="dialog"], .p-dialog')
      .filter({ hasText: /Create Group/i }).first();
    await expect(dialogTitle).toBeVisible({ timeout: 15000 });
    await shot(page, '03-create-group-dialog.png');

    // Scope dialog inputs
    const dialogInputs = page.locator('[role="dialog"] input, p-dialog input, .p-dialog input');

    // Step 5: Fill Group Name = "Annotation AutoTest"
    console.log('👉 Entering Group Name: "Annotation AutoTest"...');
    const groupNameInput = dialogInputs.nth(0);
    await expect(groupNameInput).toBeVisible({ timeout: 15000 });
    await groupNameInput.click();
    await groupNameInput.clear();
    await groupNameInput.fill('Annotation AutoTest');
    await page.waitForTimeout(1000);
    await shot(page, '04-group-name-entered.png');

    // Step 6: Set Start Date (now) & End Date (tomorrow)
    console.log('👉 Setting Start Date and End Date...');
    const startDateInput = dialogInputs.nth(1);
    const endDateInput = dialogInputs.nth(2);

    // Click Start Date calendar icon or input
    const startDateBtn = page.locator('[role="dialog"] button:has(i), [role="dialog"] button:has(.fa-calendar), [role="dialog"] .p-calendar').nth(0);
    if (await startDateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startDateBtn.click();
    } else {
      await startDateInput.click();
    }
    await page.waitForTimeout(800);

    // If datepicker popup opens, click today's date / Now / Today if present
    const todayCell = page.locator('.p-datepicker-today, .e-today, [class*="today"], td.p-datepicker-today a, .p-datepicker td:not(.p-datepicker-other-month) span').first();
    if (await todayCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await todayCell.click();
    }
    await page.waitForTimeout(1000);

    // Click End Date calendar icon or input
    const endDateBtn = page.locator('[role="dialog"] button:has(i), [role="dialog"] button:has(.fa-calendar), [role="dialog"] .p-calendar').nth(1);
    if (await endDateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endDateBtn.click();
    } else {
      await endDateInput.click();
    }
    await page.waitForTimeout(800);

    // If datepicker popup opens, select tomorrow's date cell
    const tomorrowCell = page.locator('.p-datepicker-today + td, .p-datepicker td:not(.p-datepicker-other-month) span').nth(1);
    if (await tomorrowCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tomorrowCell.click();
    }
    await page.waitForTimeout(1000);
    await shot(page, '05-dates-selected.png');

    // Step 7: Fill Short Description = "AutoTest" & Visibility = "Public"
    console.log('👉 Setting Short Description and Visibility...');
    const shortDescInput = dialogInputs.nth(3);
    await expect(shortDescInput).toBeVisible({ timeout: 10000 });
    await shortDescInput.click();
    await shortDescInput.clear();
    await shortDescInput.fill('AutoTest');

    // Select Visibility Public
    const visibilityDropdown = page.locator('[role="dialog"] p-dropdown, [role="dialog"] .p-dropdown, [role="dialog"] [class*="dropdown"]').first();
    if (await visibilityDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await visibilityDropdown.click();
      await page.waitForTimeout(800);
      const publicOption = page.locator('.p-dropdown-item, p-dropdownitem, li, [role="option"]').filter({ hasText: /^Public$/ }).first()
        .or(page.getByText('Public', { exact: true }).first());
      if (await publicOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await publicOption.click();
      }
    }
    await page.waitForTimeout(1000);
    await shot(page, '06-short-desc-visibility.png');

    // Step 8: Fill Description = "This is Automation Test"
    console.log('👉 Entering Description...');
    const descEditor = page.locator('[role="dialog"] [contenteditable="true"], .e-rte-content [contenteditable="true"], [contenteditable="true"]').first();
    if (await descEditor.isVisible({ timeout: 10000 }).catch(() => false)) {
      await descEditor.click();
      await descEditor.fill('This is Automation Test');
    }
    await page.waitForTimeout(1000);
    await shot(page, '07-description-entered.png');

    // Step 9: Click Submit button
    console.log('👉 Clicking Submit button...');
    const submitBtn = page.locator('button').filter({ hasText: /^Submit$/ }).first()
      .or(page.locator('p-dialog button, [role="dialog"] button').filter({ hasText: /^Submit$/ }).first());
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Step 10: Scroll at the bottom from the left side and locate "Annotation AutoTest"
    console.log('👉 Scrolling left side list to bottom to locate "Annotation AutoTest"...');
    const leftContainer = page.locator('.annot_left, .annot_general, [class*="annot_left"]').first();
    if (await leftContainer.isVisible()) {
      await leftContainer.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(1000);
    }
    await shot(page, '08-annotation-autotest-created.png');

    console.log('✅ annotation_create_group test completed successfully!');
  });

});
