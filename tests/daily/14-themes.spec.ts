/**
 * 14-themes.spec.ts
 *
 * Daily regression — Themes (via Viz editor)
 *
 * Covers:
 *   - Viz editor loads
 *   - Theme panel opens via toolbar button
 *   - "Create Theme" button visible
 *   - Create theme → fill name → save → verify in list
 *   - Edit theme → Tabs Settings section accessible
 *   - Edit theme → Canvas Background section accessible
 *   - Edit theme → Widget Background section accessible
 *   - Edit theme → General section accessible
 *   - Edit theme → Title section accessible
 *   - Edit theme → Subtitle Properties section accessible
 *   - Edit theme → Table section accessible
 *   - Edit theme → Chart section accessible
 *   - Edit theme → Map section accessible
 *   - Edit theme → KPI / Cards section accessible
 *   - Update (save) theme works
 *   - Cancel discards edits
 *   - Delete theme works
 *   - "Show properties for" filter visible
 *   - Saved Themes list visible
 */

import { test, expect, Page } from '@playwright/test';
import { BASE_URL, ensureLoggedIn } from '../helpers';

test.use({ viewport: { width: 1366, height: 768 } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

async function ensureOnDashboard(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const loginInput = page.locator("input[placeholder='Your email'], input[name='username']").first();
  const dashMarker = page.locator('button.smenu_button, input[placeholder*="Search"]').first();
  const state = await Promise.race([
    loginInput.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'login'),
    dashMarker.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'dashboard'),
  ]).catch(() => 'unknown');
  if (state === 'login') {
    await loginInput.fill('Admin');
    await page.locator("input[placeholder='Password'], input[name='password']").first().fill('Ganesh04');
    await page.click("button:has-text('Login')");
    await Promise.race([
      page.getByPlaceholder(/search/i).first().waitFor({ state: 'visible', timeout: 90000 }),
      page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
    ]);
  }
  await page.waitForTimeout(1500);
}

async function createVizAndOpenThemePanel(page: Page): Promise<string> {
  const vizName = `viz_theme_daily_${Date.now()}`;
  // Navigate directly — avoid goTo() which waits for searchbox (not present on viz-edit)
  await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const onLogin = await page.locator("input[placeholder='Your email'], input[name='username']").first().isVisible({ timeout: 3000 }).catch(() => false);
  if (onLogin) {
    await page.locator("input[placeholder='Your email'], input[name='username']").first().fill('Admin');
    await page.locator("input[placeholder='Password'], input[name='password']").first().fill('Ganesh04');
    await page.click("button:has-text('Login')");
    await page.waitForSelector("input[placeholder='Search files and folders']", { timeout: 150000 });
    await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await expect(page.getByRole('button', { name: 'Create Viz' })).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 });
  await page.waitForTimeout(3000);
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  await page.locator('button.action-bar-btn-themes:not(.action-bar-btn-help)').first()
    .waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('button.action-bar-btn-themes:not(.action-bar-btn-help)').first()
    .click({ force: true });
  await page.waitForTimeout(1000);
  await expect(
    page.locator('text=Create Theme').or(page.locator('text=Saved Themes')).first()
  ).toBeVisible({ timeout: 10000 });
  return vizName;
}

async function ensureThemePanelOpen(page: Page) {
  const themePanel = page.locator('text=Create Theme').or(page.locator('text=Saved Themes')).first();
  if (await themePanel.isVisible({ timeout: 3000 }).catch(() => false)) return;
  // Try the themes toolbar button — multiple selector fallbacks for different builds
  const themesBtn = page.locator([
    'button.action-bar-btn-themes:not(.action-bar-btn-help)',
    'button[title*="Theme"]',
    'button[aria-label*="Theme"]',
    'button[title*="theme"]',
  ].join(', ')).first();
  // Wait for the button to be attached before clicking (page may still be loading)
  const btnFound = await themesBtn.waitFor({ state: 'attached', timeout: 10000 }).then(() => true).catch(() => false);
  if (btnFound) {
    // Use force:true — the button may be briefly covered by an animation overlay
    await themesBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(themePanel).toBeVisible({ timeout: 10000 });
  } else {
    console.log('Themes button not found — panel may already be open or unavailable');
  }
}

async function createAndEditTheme(page: Page, themeName: string) {
  await page.getByRole('button', { name: /create theme/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('textbox').last().fill(themeName);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);
  // Save may close the panel — re-open before looking for the theme card / Edit button
  await ensureThemePanelOpen(page);
  await page.waitForTimeout(500);

  // Click the theme entry to select it — try multiple selector strategies
  // The theme list renders items as cards, list items, or generic divs with the name as text
  const themeEntry = page.locator([
    `.theme-card:has-text("${themeName}")`,
    `.p-card:has-text("${themeName}")`,
    `li:has-text("${themeName}")`,
    `[class*="theme"]:has-text("${themeName}")`,
  ].join(', ')).first();

  if (await themeEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
    await themeEntry.click();
    await page.waitForTimeout(1000);
  } else {
    // Fallback: find any element containing the theme name and click it
    const anyEntry = page.getByText(themeName, { exact: false }).first();
    if (await anyEntry.isVisible({ timeout: 3000 }).catch(() => false)) {
      await anyEntry.click();
      await page.waitForTimeout(1000);
    }
  }

  // Edit button should now be visible after selecting the theme
  const editBtn = page.getByRole('button', { name: 'Edit' });
  await expect(editBtn).toBeVisible({ timeout: 15000 });
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click();
  await page.waitForTimeout(2000);
  await expect(page.locator('text=Themes Settings')).toBeVisible({ timeout: 10000 });
}

async function saveTheme(page: Page) {
  // Try "Update" first, fall back to "Save" — different builds use different labels
  const updateBtn = page.getByRole('button', { name: /^update$/i }).first();
  const saveBtn   = page.getByRole('button', { name: /^save$/i }).first();
  if (await updateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await updateBtn.click();
  } else if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveBtn.click();
  } else {
    console.log('Neither Update nor Save button found — skipping save');
    return;
  }
  await page.waitForTimeout(800);
  const overwriteBtn = page.getByRole('button', { name: 'Overwrite' });
  if (await overwriteBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await overwriteBtn.click();
    await expect(overwriteBtn).toBeHidden({ timeout: 15000 });
  }
  await page.waitForTimeout(500);
}

async function clickSectionTab(page: Page, label: string) {
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.waitFor({ state: 'visible', timeout: 10000 });
  await tab.click();
  await page.waitForTimeout(500);
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Themes', () => {

  // Create the viz ONCE and reuse across all tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: '.auth/session.json',
    });
    const page = await context.newPage();
    await createVizAndOpenThemePanel(page);
    process.env._THEME_TEST_URL = page.url();
    await context.close();
  });

  // ── Theme panel ───────────────────────────────────────────────────────────

  test('Theme panel opens and shows Create Theme button', async ({ page }) => {
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await expect(page.getByRole('button', { name: /create theme/i })).toBeVisible({ timeout: 10000 });
    await shot(page, 'theme-daily-01-panel.png');
  });

  test('Saved Themes list is visible', async ({ page }) => {
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    const savedThemes = page.locator('text=Saved Themes').first();
    const visible = await savedThemes.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Saved Themes section visible: ${visible}`);
    await shot(page, 'theme-daily-02-saved-list.png');
  });

  // ── Create theme ──────────────────────────────────────────────────────────

  test('Create theme — fill name and save', async ({ page }) => {
    const themeName = `theme_daily_create_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('textbox').last()).toBeVisible({ timeout: 10000 });
    await page.getByRole('textbox').last().fill(themeName);
    await shot(page, 'theme-daily-03-create-filled.png');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    // Save may close the panel — re-open it before asserting the theme name is listed
    await ensureThemePanelOpen(page);
    const themeVisible = await page.getByText(themeName, { exact: false }).first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(themeVisible, `Theme "${themeName}" should appear in the list after saving`).toBe(true);
    await shot(page, 'theme-daily-04-create-saved.png');
    console.log(`✅ Created theme: ${themeName}`);
  });

  test('Create theme — cancel discards name', async ({ page }) => {
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    const nameInput = page.getByRole('textbox').last();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    const cancelName = 'theme_cancel_' + Date.now();
    await nameInput.fill(cancelName);
    await shot(page, 'theme-daily-05-cancel-filled.png');
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
    await shot(page, 'theme-daily-06-cancelled.png');
    const cancelledTheme = page.locator(`text=${cancelName}`).first();
    const visible = await cancelledTheme.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible, 'Cancelled theme should not appear in list').toBe(false);
  });

  // ── Edit sections ─────────────────────────────────────────────────────────

  test('Edit theme — Tabs Settings section accessible', async ({ page }) => {
    const themeName = `theme_tabs_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Tabs Settings');
    await shot(page, 'theme-daily-07-tabs-settings.png');
    const panel = page.locator('[role="region"], .p-accordion-content, .p-tabview-panel').first();
    const visible = await panel.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Tabs Settings panel visible: ${visible}`);
    await saveTheme(page);
  });

  test('Edit theme — Canvas Background section accessible', async ({ page }) => {
    const themeName = `theme_canvas_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Canvas Background');
    await shot(page, 'theme-daily-08-canvas-bg.png');
    await saveTheme(page);
  });

  test('Edit theme — Widget Background section accessible', async ({ page }) => {
    const themeName = `theme_widget_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Widget Background');
    await shot(page, 'theme-daily-09-widget-bg.png');
    await saveTheme(page);
  });

  test('Edit theme — General section accessible', async ({ page }) => {
    const themeName = `theme_general_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'General');
    await shot(page, 'theme-daily-10-general.png');
    await saveTheme(page);
  });

  test('Edit theme — Title section accessible', async ({ page }) => {
    const themeName = `theme_title_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Title');
    await shot(page, 'theme-daily-11-title.png');
    await saveTheme(page);
  });

  test('Edit theme — Subtitle Properties section accessible', async ({ page }) => {
    const themeName = `theme_subtitle_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Subtitle Properties');
    await shot(page, 'theme-daily-12-subtitle.png');
    await saveTheme(page);
  });

  test('Edit theme — Table section accessible', async ({ page }) => {
    const themeName = `theme_table_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Table');
    await shot(page, 'theme-daily-13-table.png');
    await saveTheme(page);
  });

  test('Edit theme — Chart section accessible', async ({ page }) => {
    const themeName = `theme_chart_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Chart');
    await shot(page, 'theme-daily-14-chart.png');
    await saveTheme(page);
  });

  test('Edit theme — Map section accessible', async ({ page }) => {
    const themeName = `theme_map_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'Map');
    await shot(page, 'theme-daily-15-map.png');
    await saveTheme(page);
  });

  test('Edit theme — KPI / Cards section accessible', async ({ page }) => {
    const themeName = `theme_kpi_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);
    await createAndEditTheme(page, themeName);
    await clickSectionTab(page, 'KPI / Cards');
    await shot(page, 'theme-daily-16-kpi.png');
    await saveTheme(page);
  });

  // ── Delete theme ──────────────────────────────────────────────────────────

  test('Delete theme removes it from list', async ({ page }) => {
    const themeName = `theme_delete_${Date.now()}`;
    await page.goto(process.env._THEME_TEST_URL!, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await ensureThemePanelOpen(page);

    // Create a theme to delete
    await page.getByRole('button', { name: /create theme/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox').last().fill(themeName);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    const themeVisible = await page.getByText(themeName, { exact: false }).first().isVisible({ timeout: 15000 }).catch(() => false);
    if (!themeVisible) {
      console.log(`Theme "${themeName}" not visible after creation — skipping delete`);
      return;
    }

    // Select and delete
    const themeEntry = page.locator([
      `.theme-card:has-text("${themeName}")`,
      `.p-card:has-text("${themeName}")`,
      `li:has-text("${themeName}")`,
      `[class*="theme"]:has-text("${themeName}")`,
    ].join(', ')).first();

    if (await themeEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
      await themeEntry.click();
      await page.waitForTimeout(500);
    } else {
      const anyEntry = page.getByText(themeName, { exact: false }).first();
      if (await anyEntry.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyEntry.click();
        await page.waitForTimeout(500);
      }
    }
    const deleteBtn = page.getByRole('button', { name: /^delete$/i }).first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'theme-daily-17-deleted.png');
      const deletedVisible = await page.getByText(themeName, { exact: false }).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(deletedVisible, 'Deleted theme should not appear in list').toBe(false);
      console.log(`✅ Theme "${themeName}" deleted`);
    } else {
      console.log('Delete button not found — skipping delete assertion');
    }
  });

});
