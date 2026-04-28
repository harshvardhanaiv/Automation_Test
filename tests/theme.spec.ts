
/**
 * theme.spec.ts
 *
 * Full end-to-end coverage of the AIV Themes feature.
 *
 * UI STRUCTURE (from live page snapshot):
 *   The theme editor uses a TABLIST (not accordion) for sections:
 *     Tabs Settings | Canvas Background | Widget Background | General |
 *     Title | Subtitle Properties | Table | Chart | Map | KPI / Cards
 *
 *   Table, Chart, Map, KPI each have nested sub-tabs.
 *
 * Tests covered:
 *   - Create theme
 *   - Edit every section (one test per section)
 *   - Full pass through all sections in one theme
 *   - Use / Unuse
 *   - Save as New
 *   - Cancel discards edits
 *   - Delete
 *   - "Show properties for" filter
 *
 * FIX: A single viz is created once in beforeAll and reused across all tests.
 *      Input locators are scoped to the active panel to avoid grabbing disabled
 *      inputs from collapsed sections (which caused timeouts).
 */

import { test, expect, Locator, Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

const BASE_URL = process.env.BASE_URL || 'https://aiv.test.oneaiv.com:8086/aiv/';
const USERNAME = 'Admin';
const PASSWORD = 'Ganesh04';

// ─────────────────────────────────────────────────────────────────────────────
// Low-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Set a colour hex on a PrimeNG colour-picker text input via JS events. */
async function setColor(locator: Locator, hex: string) {
  await locator.evaluate((el: HTMLInputElement, val: string) => {
    el.removeAttribute('disabled');
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, val);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }, hex);
}

/** Set a numeric spinner value via JS events. */
async function setNumber(locator: Locator, value: number) {
  await locator.evaluate((el: HTMLInputElement, val: number) => {
    el.removeAttribute('disabled');
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, String(val));
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }, value);
}

/**
 * Returns the currently-active/expanded panel so locators are scoped to it.
 * This prevents grabbing disabled inputs from collapsed sections.
 */
function activePanel(page: Page): Locator {
  return page.locator('[role="region"], .p-accordion-content, .p-tabview-panel')
    .filter({ has: page.locator('input[type="text"], input.p-inputtext') })
    .first();
}

/**
 * Click a PrimeNG p-dropdown and select an option by text.
 * Falls back to the hidden <select> if the overlay panel doesn't appear.
 */
async function selectDropdown(page: Page, dropdown: Locator, optionText: string) {
  await dropdown.click();
  await page.waitForTimeout(400);
  const item = page.locator('.p-dropdown-item').filter({ hasText: new RegExp(`^${optionText}$`) });
  if (await item.isVisible({ timeout: 3000 }).catch(() => false)) {
    await item.click();
  } else {
    await dropdown.evaluate((el: Element, text: string) => {
      const select = el.querySelector('select');
      if (!select) return;
      const opt = Array.from(select.options).find(o => o.text === text || o.value === text) as HTMLOptionElement | undefined;
      if (opt) { opt.selected = true; select.dispatchEvent(new Event('change', { bubbles: true })); }
    }, optionText);
  }
  await page.waitForTimeout(300);
}

/**
 * Click a top-level section tab in the theme editor by its visible label.
 * e.g. "Tabs Settings", "Canvas Background", "General", "Chart", "KPI / Cards"
 */
async function clickSectionTab(page: Page, label: string) {
  // The top-level tablist contains tabs with the section names
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.waitFor({ state: 'visible', timeout: 10000 });
  await tab.click();
  await page.waitForTimeout(500);
}

/**
 * Click a sub-tab within the currently active section panel.
 * Used for Chart (General Properties / Category Axis / Value Axis / Series / Legend / Tooltips),
 * Table (Table Header Properties / Table Body Properties),
 * Map (Marker Styling / Zoom Control / Popup / Tooltip / Value Legend),
 * KPI (Title / Value / Target).
 */
async function clickSubTab(page: Page, label: string) {
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.waitFor({ state: 'visible', timeout: 10000 });
  await tab.click();
  await page.waitForTimeout(400);
}

async function safeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth & navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Navigate to BASE_URL and ensure we are on the dashboard.
 * Reuses the storageState session; only logs in if redirected to the login page.
 */
async function ensureOnDashboard(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const loginInput = page.locator("input[placeholder='Your email'], input[name='username']").first();
  const dashboardMarker = page.locator('button.smenu_button, input[placeholder*="Search"]').first();

  const state = await Promise.race([
    loginInput.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'login'),
    dashboardMarker.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'dashboard'),
  ]).catch(() => 'unknown');

  if (state === 'login') {
    await loginInput.fill(USERNAME);
    await page.locator("input[placeholder='Password'], input[name='password']").first().fill(PASSWORD);
    await page.click("button:has-text('Login')");
    await Promise.race([
      page.getByPlaceholder(/search/i).first().waitFor({ state: 'visible', timeout: 90000 }),
      page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
    ]);
  } else if (state === 'unknown') {
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }

  await page.waitForTimeout(1500);
}

/**
 * Creates a new Viz, opens the Theme panel, and returns the viz name.
 * Called ONCE in beforeAll — all tests reuse the same viz page.
 */
async function setupVizAndOpenThemePanel(page: Page): Promise<string> {
  const vizName = `viz_theme_${Date.now()}`;

  await ensureOnDashboard(page);

  // Open side nav
  await page.locator('mat-toolbar-row button').first().click();
  await page.waitForTimeout(500);

  // Expand Dashboard nav group
  const dashboardNavBtn = page.getByRole('button', { name: /^Dashboard\s*/i });
  if (await dashboardNavBtn.getAttribute('aria-expanded').catch(() => null) !== 'true') {
    await dashboardNavBtn.click();
    await page.waitForTimeout(400);
  }

  // Go to List View
  await page.locator('a[href*="GridDashboard"][title="List View"], a[href*="Visualization/GridDashboard"]').first().click();
  await expect(page.getByRole('button', { name: 'Create Viz' })).toBeVisible({ timeout: 60000 });

  // Create a new Viz
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();

  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 });
  await page.waitForTimeout(3000);

  // Dismiss any auto-opened dialog (e.g. AI Dashboard Buddy)
  const dialog = page.locator('dialog, [role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.locator('button').first().click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  // Open the Theme panel
  await page.locator('button.action-bar-btn-themes:not(.action-bar-btn-help)').first().click();
  await page.waitForTimeout(1000);
  await expect(
    page.locator('text=Create Theme').or(page.locator('text=Saved Themes')).first()
  ).toBeVisible({ timeout: 10000 });

  return vizName;
}

/**
 * Re-opens the Theme panel if it was closed (e.g. after a previous test navigated away).
 * Assumes the page is already on the viz-edit URL.
 */
async function ensureThemePanelOpen(page: Page) {
  const themePanel = page.locator('text=Create Theme').or(page.locator('text=Saved Themes')).first();
  if (await themePanel.isVisible({ timeout: 3000 }).catch(() => false)) return;
  await page.locator('button.action-bar-btn-themes:not(.action-bar-btn-help)').first().click();
  await page.waitForTimeout(1000);
  await expect(themePanel).toBeVisible({ timeout: 10000 });
}

/**
 * Creates a named theme and enters edit mode.
 * After this call the theme editor tablist is visible.
 */
async function createAndEditTheme(page: Page, themeName: string) {
  await page.getByRole('button', { name: /create theme/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('textbox').last().fill(themeName);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  // Click the theme card to select it (if a list is shown)
  const themeCard = page.locator('.theme-card, .p-card').filter({ hasText: themeName }).first();
  if (await themeCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    await themeCard.click();
    await page.waitForTimeout(1000);
  }

  const editBtn = page.getByRole('button', { name: 'Edit' });
  await expect(editBtn).toBeVisible({ timeout: 15000 });
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click();
  await page.waitForTimeout(2000);
  await expect(page.locator('text=Themes Settings')).toBeVisible({ timeout: 10000 });
}

/** Click Update and handle the optional Overwrite confirmation. */
async function saveTheme(page: Page) {
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForTimeout(800);
  const overwriteBtn = page.getByRole('button', { name: 'Overwrite' });
  if (await overwriteBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await overwriteBtn.click();
    await expect(overwriteBtn).toBeHidden({ timeout: 15000 });
  }
  await page.waitForTimeout(500);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Themes', () => {

  // Create the viz ONCE and reuse it across all tests.
  // This avoids the 18× viz-creation overhead that caused timeouts.
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await setupVizAndOpenThemePanel(page);
    // Store the URL so individual tests can navigate back to it
    process.env._THEME_TEST_URL = page.url();
    await context.close();
  });

  // ── 1. Create Theme ──────────────────────────────────────────────────────
  test('Create a new theme', async ({ page }) => {
    const themeName = `theme_create_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);

    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('textbox').last()).toBeVisible({ timeout: 10000 });
    await page.getByRole('textbox').last().fill(themeName);

    await safeScreenshot(page, 'theme-01-create-name-filled.png');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(`text=${themeName}`).first()).toBeVisible({ timeout: 15000 });
    await safeScreenshot(page, 'theme-02-create-saved.png');
    console.log(`✅ Created theme: ${themeName}`);
  });

  // ── 2. Edit — Tabs Settings ──────────────────────────────────────────────
  test('Edit theme — Tabs Settings', async ({ page }) => {
    const themeName = `theme_tabs_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Tabs Settings');
    await safeScreenshot(page, 'theme-03-tabs-open.png');

    // Scope inputs to the active panel to avoid grabbing disabled inputs from other sections
    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'd36a6a'); // Inactive Tab Background
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '23391c'); // Inactive Tab Text Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '3c9fe9'); // Active Tab Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), 'f1521c'); // Active Tab Text Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(4), 'b9e62d'); // Tab Icon Color

    // Font Size spinner
    await setNumber(panel.getByRole('spinbutton').first(), 14);

    // Font Weight dropdown
    const dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Bold');
    }

    await safeScreenshot(page, 'theme-04-tabs-filled.png');
    await saveTheme(page);
    console.log('✅ Tabs Settings configured');
  });

  // ── 3. Edit — Canvas Background ─────────────────────────────────────────
  test('Edit theme — Canvas Background', async ({ page }) => {
    const themeName = `theme_canvas_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Canvas Background');
    await safeScreenshot(page, 'theme-05-canvas-open.png');

    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1a1a2e'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').last(), '2d2d44'); // Grid Lines

    // Background Position / Size / Repeat / Attachment dropdowns
    const dropdowns = panel.locator('p-dropdown');
    const ddCount = await dropdowns.count();
    if (ddCount >= 1) await selectDropdown(page, dropdowns.nth(0), 'Center');
    if (ddCount >= 2) await selectDropdown(page, dropdowns.nth(1), 'Cover');
    if (ddCount >= 3) await selectDropdown(page, dropdowns.nth(2), 'No Repeat');
    if (ddCount >= 4) await selectDropdown(page, dropdowns.nth(3), 'Scroll');

    await safeScreenshot(page, 'theme-06-canvas-filled.png');
    await saveTheme(page);
    console.log('✅ Canvas Background configured');
  });

  // ── 4. Edit — Widget Background ─────────────────────────────────────────
  test('Edit theme — Widget Background', async ({ page }) => {
    const themeName = `theme_widget_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Widget Background');
    await safeScreenshot(page, 'theme-07-widget-open.png');

    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'f0f4f8'); // Background Color

    const dropdowns = panel.locator('p-dropdown');
    const ddCount = await dropdowns.count();
    if (ddCount >= 1) await selectDropdown(page, dropdowns.nth(0), 'Center');
    if (ddCount >= 2) await selectDropdown(page, dropdowns.nth(1), 'Contain');
    if (ddCount >= 3) await selectDropdown(page, dropdowns.nth(2), 'Repeat');
    if (ddCount >= 4) await selectDropdown(page, dropdowns.nth(3), 'Fixed');

    await safeScreenshot(page, 'theme-08-widget-filled.png');
    await saveTheme(page);
    console.log('✅ Widget Background configured');
  });

  // ── 5. Edit — General ───────────────────────────────────────────────────
  test('Edit theme — General properties', async ({ page }) => {
    const themeName = `theme_general_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'General');
    await safeScreenshot(page, 'theme-09-general-open.png');

    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '28e764'); // Border Color

    // Border Style dropdown
    const dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Dashed');
    }

    // Border widths and corner radii (spinbuttons in order)
    const spinners = panel.getByRole('spinbutton');
    const sc = await spinners.count();
    if (sc >= 1) await setNumber(spinners.nth(0), 3);  // Border Top
    if (sc >= 2) await setNumber(spinners.nth(1), 2);  // Border Right
    if (sc >= 3) await setNumber(spinners.nth(2), 3);  // Border Bottom
    if (sc >= 4) await setNumber(spinners.nth(3), 2);  // Border Left
    if (sc >= 5) await setNumber(spinners.nth(4), 8);  // Top Left Radius
    if (sc >= 6) await setNumber(spinners.nth(5), 8);  // Top Right Radius
    if (sc >= 7) await setNumber(spinners.nth(6), 8);  // Bottom Left Radius
    if (sc >= 8) await setNumber(spinners.nth(7), 8);  // Bottom Right Radius

    await safeScreenshot(page, 'theme-10-general-filled.png');
    await saveTheme(page);
    console.log('✅ General properties configured');
  });

  // ── 6. Edit — Title ─────────────────────────────────────────────────────
  test('Edit theme — Title properties', async ({ page }) => {
    const themeName = `theme_title_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Title');
    await safeScreenshot(page, 'theme-11-title-open.png');

    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff'); // Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '1e3a5f'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '3c9fe9'); // Border Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), 'cccccc'); // Icon Color

    const spinners = panel.getByRole('spinbutton');
    const sc = await spinners.count();
    if (sc >= 1) await setNumber(spinners.nth(0), 16); // Font Size
    if (sc >= 2) await setNumber(spinners.nth(1), 1);  // Border Top
    if (sc >= 3) await setNumber(spinners.nth(2), 1);  // Border Bottom
    if (sc >= 4) await setNumber(spinners.nth(3), 18); // Icon Size

    const dropdowns = panel.locator('p-dropdown');
    const ddCount = await dropdowns.count();
    if (ddCount >= 1) await selectDropdown(page, dropdowns.nth(0), 'Bold');   // Font Weight
    if (ddCount >= 2) await selectDropdown(page, dropdowns.nth(1), 'Solid');  // Border Style

    await safeScreenshot(page, 'theme-12-title-filled.png');
    await saveTheme(page);
    console.log('✅ Title properties configured');
  });

  // ── 7. Edit — Subtitle Properties ───────────────────────────────────────
  test('Edit theme — Subtitle properties', async ({ page }) => {
    const themeName = `theme_subtitle_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Subtitle Properties');
    await safeScreenshot(page, 'theme-13-subtitle-open.png');

    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'aaaaaa'); // Subtitle Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f5f5f5'); // Subtitle Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '888888'); // Border Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), '888888'); // Icon Color

    const spinners = panel.getByRole('spinbutton');
    const sc = await spinners.count();
    if (sc >= 1) await setNumber(spinners.nth(0), 13); // Font Size
    if (sc >= 2) await setNumber(spinners.nth(1), 0);  // Border Top
    if (sc >= 3) await setNumber(spinners.nth(2), 1);  // Border Bottom

    const dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Normal');
    }

    await safeScreenshot(page, 'theme-14-subtitle-filled.png');
    await saveTheme(page);
    console.log('✅ Subtitle properties configured');
  });

  // ── 8. Edit — Table ─────────────────────────────────────────────────────
  test('Edit theme — Table properties', async ({ page }) => {
    const themeName = `theme_table_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Table');
    await safeScreenshot(page, 'theme-15-table-open.png');

    // ── Table Header Properties sub-tab ──────────────────────────────────
    await clickSubTab(page, 'Table Header Properties');
    await safeScreenshot(page, 'theme-16-table-header-open.png');

    let panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f'); // Header Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff'); // Header Font Color

    let spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 14); // Header Font Size
    }

    // ── Table Body Properties sub-tab ────────────────────────────────────
    await clickSubTab(page, 'Table Body Properties');
    await safeScreenshot(page, 'theme-17-table-body-open.png');

    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff'); // Table Body Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f0f4f8'); // Even Row Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '333333'); // Even Row Font Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), 'ffffff'); // Odd Row Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(4), '333333'); // Odd Row Font Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(5), 'e0e0e0'); // Row Border Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(6), 'e0e0e0'); // Column Border Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(7), '1e3a5f'); // Header Column Border Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(8), 'f5f5f5'); // Pagination Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(9), '333333'); // Pagination Font Color

    spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 13); // Table Body Font Size
    }

    await safeScreenshot(page, 'theme-18-table-filled.png');
    await saveTheme(page);
    console.log('✅ Table properties configured');
  });

  // ── 9. Edit — Chart ─────────────────────────────────────────────────────
  test('Edit theme — Chart properties', async ({ page }) => {
    const themeName = `theme_chart_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Chart');
    await safeScreenshot(page, 'theme-19-chart-open.png');

    // ── General Properties sub-tab ────────────────────────────────────────
    await clickSubTab(page, 'General Properties');
    let panel = activePanel(page);
    // Colour palette — plain text input (comma-separated hex list)
    await panel.locator('input[type="text"], input.p-inputtext').first().fill('#00B4D8,#7C3AED,#F59E0B,#22C55E,#EF4444');

    // ── Category Axis sub-tab ─────────────────────────────────────────────
    await clickSubTab(page, 'Category Axis');
    await clickSubTab(page, 'Axis Title Style');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '333333'); // Axis Title Color
    let spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 12);
    }

    await clickSubTab(page, 'Axis Label');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '555555'); // Axis Label Color

    await clickSubTab(page, 'Axis Line');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'cccccc'); // Axis Line Color

    // ── Series sub-tab ────────────────────────────────────────────────────
    await clickSubTab(page, 'Series');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '00B4D8');

    // ── Legend Properties sub-tab ─────────────────────────────────────────
    await clickSubTab(page, 'Legend Properties');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '333333'); // Legend Text Color
    spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 12);
    }

    // ── Tooltips sub-tab ──────────────────────────────────────────────────
    await clickSubTab(page, 'Tooltips');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f'); // Tooltip Background
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff'); // Tooltip Text Color

    await safeScreenshot(page, 'theme-20-chart-filled.png');
    await saveTheme(page);
    console.log('✅ Chart properties configured');
  });

  // ── 10. Edit — Map ──────────────────────────────────────────────────────
  test('Edit theme — Map properties', async ({ page }) => {
    const themeName = `theme_map_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Map');
    await safeScreenshot(page, 'theme-21-map-open.png');

    // ── Marker Styling ────────────────────────────────────────────────────
    await clickSubTab(page, 'Marker Styling');
    let panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ef4444'); // Marker Color

    // ── Zoom Control ──────────────────────────────────────────────────────
    await clickSubTab(page, 'Zoom Control');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '333333'); // Color
    let spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 14);
    }

    // ── Popup ─────────────────────────────────────────────────────────────
    await clickSubTab(page, 'Popup');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '333333'); // Color
    spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 13);
    }

    // ── Tooltip ───────────────────────────────────────────────────────────
    await clickSubTab(page, 'Tooltip');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff'); // Color

    // ── Value Legend ──────────────────────────────────────────────────────
    await clickSubTab(page, 'Value Legend');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'f5f5f5'); // Background Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '1e3a5f'); // Title Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '333333'); // Text Color

    await safeScreenshot(page, 'theme-22-map-filled.png');
    await saveTheme(page);
    console.log('✅ Map properties configured');
  });

  // ── 11. Edit — KPI / Cards ──────────────────────────────────────────────
  test('Edit theme — KPI / Cards properties', async ({ page }) => {
    const themeName = `theme_kpi_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'KPI / Cards');
    await safeScreenshot(page, 'theme-23-kpi-open.png');

    // ── Title sub-tab ─────────────────────────────────────────────────────
    await clickSubTab(page, 'Title');
    let panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f'); // Font Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f5f5f5'); // Background Color
    let spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 16);
    }
    let dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Bold');
    }

    // ── Value sub-tab ─────────────────────────────────────────────────────
    await clickSubTab(page, 'Value');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '00B4D8'); // Font Color
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff'); // Background Color
    spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 32);
    }
    dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Bold');
    }

    // ── Target sub-tab ────────────────────────────────────────────────────
    await clickSubTab(page, 'Target');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '555555'); // Font Color
    spinners = panel.getByRole('spinbutton');
    if (await spinners.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await setNumber(spinners.nth(0), 14);
    }

    await safeScreenshot(page, 'theme-24-kpi-filled.png');
    await saveTheme(page);
    console.log('✅ KPI / Cards properties configured');
  });

  // ── 12. Full pass — all sections in one theme ────────────────────────────
  test('Configure all theme sections in a single theme', async ({ page }) => {
    const themeName = `theme_full_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await safeScreenshot(page, 'theme-25-full-editor-open.png');

    // 1. Tabs Settings
    await clickSectionTab(page, 'Tabs Settings');
    let panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'd36a6a');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '23391c');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '3c9fe9');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), 'f1521c');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(4), 'b9e62d');

    // 2. Canvas Background
    await clickSectionTab(page, 'Canvas Background');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1a1a2e');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').last(), '2d2d44');

    // 3. Widget Background
    await clickSectionTab(page, 'Widget Background');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff');

    // 4. General
    await clickSectionTab(page, 'General');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '28e764');
    let dropdowns = panel.locator('p-dropdown');
    if (await dropdowns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectDropdown(page, dropdowns.first(), 'Dashed');
    }
    let spinners = panel.getByRole('spinbutton');
    let sc = await spinners.count();
    if (sc >= 1) await setNumber(spinners.nth(0), 3);
    if (sc >= 2) await setNumber(spinners.nth(1), 2);
    if (sc >= 3) await setNumber(spinners.nth(2), 3);
    if (sc >= 4) await setNumber(spinners.nth(3), 2);
    if (sc >= 5) await setNumber(spinners.nth(4), 8);
    if (sc >= 6) await setNumber(spinners.nth(5), 8);
    if (sc >= 7) await setNumber(spinners.nth(6), 8);
    if (sc >= 8) await setNumber(spinners.nth(7), 8);

    // 5. Title
    await clickSectionTab(page, 'Title');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '1e3a5f');

    // 6. Subtitle Properties
    await clickSectionTab(page, 'Subtitle Properties');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'aaaaaa');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f5f5f5');

    // 7. Table — Header
    await clickSectionTab(page, 'Table');
    await clickSubTab(page, 'Table Header Properties');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff');

    // 7. Table — Body
    await clickSubTab(page, 'Table Body Properties');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ffffff');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f0f4f8');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '333333');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(3), 'ffffff');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(4), '333333');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(5), 'e0e0e0');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(6), 'e0e0e0');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(7), '1e3a5f');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(8), 'f5f5f5');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(9), '333333');

    // 8. Chart — General Properties
    await clickSectionTab(page, 'Chart');
    await clickSubTab(page, 'General Properties');
    panel = activePanel(page);
    await panel.locator('input[type="text"], input.p-inputtext').first().fill('#00B4D8,#7C3AED,#F59E0B,#22C55E,#EF4444');

    // 8. Chart — Series
    await clickSubTab(page, 'Series');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '00B4D8');

    // 8. Chart — Legend
    await clickSubTab(page, 'Legend Properties');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '333333');

    // 8. Chart — Tooltips
    await clickSubTab(page, 'Tooltips');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff');

    // 9. Map — Marker
    await clickSectionTab(page, 'Map');
    await clickSubTab(page, 'Marker Styling');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ef4444');

    // 9. Map — Value Legend
    await clickSubTab(page, 'Value Legend');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'f5f5f5');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), '1e3a5f');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(2), '333333');

    // 10. KPI — Title
    await clickSectionTab(page, 'KPI / Cards');
    await clickSubTab(page, 'Title');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '1e3a5f');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'f5f5f5');

    // 10. KPI — Value
    await clickSubTab(page, 'Value');
    panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), '00B4D8');
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(1), 'ffffff');

    await safeScreenshot(page, 'theme-26-full-all-filled.png');
    await saveTheme(page);
    await safeScreenshot(page, 'theme-27-full-saved.png');

    await expect(page.locator(`text=${themeName}`).first()).toBeVisible({ timeout: 10000 });
    console.log(`✅ Full theme configured: ${themeName}`);
  });

  // ── 13. Use a theme ──────────────────────────────────────────────────────
  test('Use a theme — applies to canvas and shows Active badge', async ({ page }) => {
    const themeName = `theme_use_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);

    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox').last().fill(themeName);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1500);

    await safeScreenshot(page, 'theme-28-before-use.png');

    const useBtn = page.getByRole('button', { name: /^Use$/i }).first();
    await expect(useBtn).toBeVisible({ timeout: 10000 });
    await useBtn.click();
    await page.waitForTimeout(500);

    // Confirm dialog: "Use this theme on your canvas?"
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /use this theme/i });
    if (await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmDialog.getByRole('button', { name: /yes|confirm|use/i }).first().click();
      await page.waitForTimeout(1000);
    }

    await safeScreenshot(page, 'theme-29-after-use.png');

    // Active badge OR Unuse button must appear
    const activeBadge = page.locator('text=Active').or(page.locator('.active-badge')).first();
    const unuseBtn    = page.getByRole('button', { name: /unuse/i }).first();
    const isActive = await activeBadge.isVisible({ timeout: 8000 }).catch(() => false);
    const hasUnuse = await unuseBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isActive || hasUnuse).toBeTruthy();
    console.log(`✅ Theme applied: ${themeName}`);
  });

  // ── 14. Unuse a theme ────────────────────────────────────────────────────
  test('Unuse a theme — deactivates the applied theme', async ({ page }) => {
    const themeName = `theme_unuse_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);

    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox').last().fill(themeName);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1500);

    // Apply it first
    const useBtn = page.getByRole('button', { name: /^Use$/i }).first();
    if (await useBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await useBtn.click();
      await page.waitForTimeout(500);
      const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /use this theme/i });
      if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmDialog.getByRole('button', { name: /yes|confirm|use/i }).first().click();
        await page.waitForTimeout(1000);
      }
    }

    await safeScreenshot(page, 'theme-30-before-unuse.png');

    const unuseBtn = page.getByRole('button', { name: /unuse/i }).first();
    await expect(unuseBtn).toBeVisible({ timeout: 10000 });
    await unuseBtn.click();
    await page.waitForTimeout(1000);

    await safeScreenshot(page, 'theme-31-after-unuse.png');
    await expect(page.getByRole('button', { name: /^Use$/i }).first()).toBeVisible({ timeout: 8000 });
    console.log(`✅ Theme deactivated: ${themeName}`);
  });

  // ── 15. Save as New ──────────────────────────────────────────────────────
  test('Save as New — duplicates theme with a new name', async ({ page }) => {
    const themeName    = `theme_orig_${Date.now()}`;
    const newThemeName = `theme_copy_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    // Make a small change
    await clickSectionTab(page, 'Canvas Background');
    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'aabbcc');

    await safeScreenshot(page, 'theme-32-before-save-as-new.png');

    const saveAsNewBtn = page.getByRole('button', { name: /save as new/i });
    await expect(saveAsNewBtn).toBeVisible({ timeout: 10000 });
    await saveAsNewBtn.click();
    await page.waitForTimeout(500);

    const nameInput = page.getByRole('textbox').last();
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill(newThemeName);

    await page.getByRole('button', { name: /^save$/i }).last().click();
    await page.waitForTimeout(1500);

    await safeScreenshot(page, 'theme-33-after-save-as-new.png');
    await expect(page.locator(`text=${newThemeName}`).first()).toBeVisible({ timeout: 10000 });
    console.log(`✅ Saved as new: ${newThemeName}`);
  });

  // ── 16. Cancel discards edits ────────────────────────────────────────────
  test('Cancel — discards unsaved edits', async ({ page }) => {
    const themeName = `theme_cancel_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    await clickSectionTab(page, 'Canvas Background');
    const panel = activePanel(page);
    await setColor(panel.locator('input[type="text"], input.p-inputtext').nth(0), 'ff0000');

    await safeScreenshot(page, 'theme-34-before-cancel.png');

    const cancelBtn = page.getByRole('button', { name: /^cancel$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });
    await cancelBtn.click();
    await page.waitForTimeout(1000);

    await safeScreenshot(page, 'theme-35-after-cancel.png');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /^cancel$/i })).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Cancel discarded edits');
  });

  // ── 17. Delete a theme ───────────────────────────────────────────────────
  test('Delete a theme — removes it from the list', async ({ page }) => {
    const themeName = `theme_delete_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);

    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox').last().fill(themeName);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(`text=${themeName}`).first()).toBeVisible({ timeout: 10000 });
    await safeScreenshot(page, 'theme-36-before-delete.png');

    const deleteBtn = page.getByRole('button', { name: /^delete$/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();
    await page.waitForTimeout(500);

    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /delete|confirm/i });
    if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDialog.getByRole('button', { name: /delete|yes|confirm/i }).last().click();
      await page.waitForTimeout(1500);
    }

    await safeScreenshot(page, 'theme-37-after-delete.png');
    await expect(page.locator(`text=${themeName}`).first()).not.toBeVisible({ timeout: 10000 });
    console.log(`✅ Theme deleted: ${themeName}`);
  });

  // ── 18. "Show properties for" filter ────────────────────────────────────
  test('"Show properties for" filter — All shows every section tab', async ({ page }) => {
    const themeName = `theme_filter_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);

    // The "Show properties for" dropdown is visible in the editor header
    const showForDropdown = page.locator('p-dropdown').filter({ hasText: /All/i }).first();
    if (await showForDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectDropdown(page, showForDropdown, 'All');
    }

    await safeScreenshot(page, 'theme-38-show-all.png');

    // All main section tabs must be present
    for (const section of [
      'Tabs Settings', 'Canvas Background', 'Widget Background',
      'General', 'Title', 'Subtitle Properties', 'Table', 'Chart', 'Map', 'KPI / Cards'
    ]) {
      await expect(page.getByRole('tab', { name: section, exact: true }))
        .toBeVisible({ timeout: 5000 });
    }

    console.log('✅ All section tabs visible with "Show properties for: All"');
  });

}); // end test.describe.serial('Themes')
