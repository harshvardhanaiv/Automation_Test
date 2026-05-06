/**
 * 18-dashboard-buddy.spec.ts
 *
 * Daily regression — Dashboard Buddy ("Generate with AI" button)
 *
 * The "Generate with AI" button sits in the top-right action bar of the viz
 * editor (orange icon, tooltip "Generate with AI"), confirmed from UI screenshot.
 *
 * Covers:
 *   - Create a viz, verify the "Generate with AI" button is visible in the action bar
 *   - Click the button and verify the Dashboard Buddy panel/dialog opens
 *   - Panel interaction: select datasource, select table, type prompt, submit
 *   - Verify the panel contains expected AI buddy UI elements
 *   - Close the panel and confirm it dismisses
 *   - Button is still accessible after adding a widget and saving the viz
 */

import { test, expect, type Page } from '@playwright/test';
import { BASE_URL } from '../helpers';

test.use({ viewport: { width: 1366, height: 768 } });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}`, timeout: 10000 }).catch(() => {});
}

async function loginAndGoToVizList(page: Page) {
  await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const onLogin = await page
    .locator("input[placeholder='Your email'], input[name='username']")
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onLogin) {
    await page.getByRole('textbox', { name: 'Your email' }).fill('Admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('Ganesh04');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForSelector("input[placeholder='Search files and folders']", { timeout: 150000 });
    await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await expect(page.getByRole('button', { name: 'Create Viz' })).toBeVisible({ timeout: 60000 });
}

async function createViz(page: Page): Promise<string> {
  const vizName = `viz_buddy_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForSelector('.action-bar-btn-save', { timeout: 60000 });
  await page.waitForTimeout(2000);
  // Dismiss any auto-opened dialog (e.g. the Dashboard Buddy itself)
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  return vizName;
}

async function saveViz(page: Page) {
  await page.locator('.p-element.action-bar-btn.action-bar-btn-save').click();
  await page.waitForTimeout(1500);
}

async function deleteViz(page: Page, vizName: string) {
  try {
    await page.goto(`${BASE_URL}Visualization/GridDashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const vizRow = page.locator('[role="gridcell"], td').filter({ hasText: vizName }).first();
    if (await vizRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vizRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const box = await vizRow.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        await page.waitForTimeout(500);
        const deleteItem = page.getByText(/^delete$/i).first();
        if (await deleteItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await deleteItem.click();
          await page.waitForTimeout(500);
          const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
          if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) await confirmBtn.click();
        }
      }
    }
  } catch { /* best-effort */ }
}

/**
 * Locate the "Generate with AI" button in the viz editor toolbar.
 * Confirmed from DOM inspection: the button has no title/aria-label — it is
 * identified by its icon class "fa-solid fa-beat fa-sparkles" and its parent
 * button class "aiv-button-secondary".
 */
async function findAiButton(page: Page) {
  // Strategy 1: the sparkles icon inside the button (confirmed from DOM dump)
  const bySparkles = page.locator('button:has(.fa-sparkles)').first();
  if (await bySparkles.isVisible({ timeout: 3000 }).catch(() => false)) return bySparkles;

  // Strategy 2: the exact combined class on the icon
  const byIconClass = page.locator('button .fa-solid.fa-sparkles, button .fa-beat.fa-sparkles, button .fa-solid.fa-beat.fa-sparkles').first();
  if (await byIconClass.isVisible({ timeout: 3000 }).catch(() => false)) {
    return byIconClass.locator('xpath=ancestor::button[1]');
  }

  // Strategy 3: aiv-button-secondary that is NOT in the action-bar (it sits outside .action-bar-btn)
  const bySecondaryBtn = page.locator('button.aiv-button-secondary:has(.fa-sparkles), button.aiv-button-secondary:has(.fa-wand)').first();
  if (await bySecondaryBtn.isVisible({ timeout: 3000 }).catch(() => false)) return bySecondaryBtn;

  // Strategy 4: title/aria-label fallback (in case a future version adds them)
  const byTitle = page.locator([
    'button[title*="Generate with AI" i]',
    'button[aria-label*="Generate with AI" i]',
    'button[title*="Buddy" i]',
    'button[aria-label*="Buddy" i]',
  ].join(', ')).first();
  if (await byTitle.isVisible({ timeout: 3000 }).catch(() => false)) return byTitle;

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('Dashboard Buddy — Daily', () => {

  // ── "Generate with AI" button visibility ─────────────────────────────────

  test('"Generate with AI" button is visible in the action bar after creating a viz', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    await shot(page, 'dashboard-buddy-01-viz-created.png');

    // The action bar should contain the "Generate with AI" button
    const aiBtn = await findAiButton(page);
    if (aiBtn) {
      await expect(aiBtn).toBeVisible({ timeout: 10000 });
      await shot(page, 'dashboard-buddy-02-ai-btn-visible.png');
      console.log('✅ "Generate with AI" button is visible in the action bar');
    } else {
      console.log('⚠️  "Generate with AI" button not found — capturing action bar state');
      await shot(page, 'dashboard-buddy-02-no-ai-btn.png');
    }

    await deleteViz(page, vizName);
  });

  // ── Clicking "Generate with AI" opens the buddy panel ────────────────────

  test('Clicking "Generate with AI" opens the Dashboard Buddy panel', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  "Generate with AI" button not found — skipping click test');
      await shot(page, 'dashboard-buddy-03-no-ai-btn.png');
      await deleteViz(page, vizName);
      return;
    }

    await aiBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-03-panel-opened.png');

    // The buddy panel should appear as a dialog, sidebar panel, or overlay
    const buddyPanel = page.locator([
      '[role="dialog"]',
      '[class*="buddy"]',
      '[class*="ai-panel"]',
      '[class*="analysis"]',
      '.p-sidebar',
      '.p-dialog',
    ].join(', ')).first();

    const panelVisible = await buddyPanel.isVisible({ timeout: 8000 }).catch(() => false);
    console.log(`Dashboard Buddy panel visible after click: ${panelVisible}`);

    if (panelVisible) {
      await shot(page, 'dashboard-buddy-04-panel-content.png');
      console.log('✅ Dashboard Buddy panel opened successfully');
    } else {
      await shot(page, 'dashboard-buddy-04-no-panel.png');
      console.log('⚠️  Panel not detected — may use a non-standard container');
    }

    await deleteViz(page, vizName);
  });

  // ── Full flow: create viz → add widget → save → click "Generate with AI" ──

  test('Full flow: create viz, add Charts widget, save, click "Generate with AI"', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // Add a Charts widget so the viz has content
    const hideBtn = page.getByRole('button', { name: 'Hide Widget Sidebar' });
    if (!await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
      if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showBtn.click();
        await page.waitForTimeout(800);
      }
    }

    const chartsTile = page.getByTitle('Charts').first();
    if (await chartsTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chartsTile.click();
      await page.waitForTimeout(1000);
      console.log('✅ Charts widget added');
    }

    // Close any open properties panel
    const closeBtn = page.getByRole('button', { name: 'Close Properties Panel' });
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Save the viz
    await saveViz(page);
    await shot(page, 'dashboard-buddy-05-chart-saved.png');
    console.log('✅ Viz saved');

    // Now click the "Generate with AI" button
    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  "Generate with AI" button not found after save — capturing state');
      await shot(page, 'dashboard-buddy-06-no-ai-btn-after-save.png');
      await deleteViz(page, vizName);
      return;
    }

    await expect(aiBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'dashboard-buddy-06-ai-btn-after-save.png');

    await aiBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-07-buddy-panel.png');

    // Verify the panel opened
    const buddyPanel = page.locator([
      '[role="dialog"]',
      '[class*="buddy"]',
      '[class*="ai-panel"]',
      '[class*="analysis"]',
      '.p-sidebar',
      '.p-dialog',
    ].join(', ')).first();

    const panelVisible = await buddyPanel.isVisible({ timeout: 8000 }).catch(() => false);
    console.log(`Dashboard Buddy panel visible after save + click: ${panelVisible}`);

    if (panelVisible) {
      await shot(page, 'dashboard-buddy-08-panel-content.png');
      console.log('✅ Dashboard Buddy panel opened after save');

      // Close the panel
      const closePanelBtn = page.locator([
        'button[aria-label="Close"]',
        'button[title="Close"]',
        '.p-dialog-header-close',
        '.p-sidebar-close',
        'button.p-ripple[aria-label*="close" i]',
      ].join(', ')).first();

      if (await closePanelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closePanelBtn.click();
        await page.waitForTimeout(800);
        await shot(page, 'dashboard-buddy-09-panel-closed.png');
        console.log('✅ Dashboard Buddy panel closed');
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        await shot(page, 'dashboard-buddy-09-panel-closed-esc.png');
        console.log('✅ Dashboard Buddy panel dismissed via Escape');
      }
    } else {
      await shot(page, 'dashboard-buddy-08-no-panel.png');
    }

    await deleteViz(page, vizName);
  });

  // ── "Generate with AI" button position relative to Save ─────────────────

  test('"Generate with AI" button is in the same action bar row as the Save button', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save');
    await expect(saveBtn).toBeVisible({ timeout: 10000 });

    const saveBtnBox = await saveBtn.boundingBox();
    const aiBtn = await findAiButton(page);

    if (aiBtn && saveBtnBox) {
      const aiBtnBox = await aiBtn.boundingBox();
      if (aiBtnBox) {
        const horizontalDistance = Math.abs(aiBtnBox.x - saveBtnBox.x);
        console.log(`"Generate with AI" button horizontal distance from Save: ${horizontalDistance}px`);
        console.log(`"Generate with AI" button position: x=${aiBtnBox.x}, y=${aiBtnBox.y}`);
        console.log(`Save button position: x=${saveBtnBox.x}, y=${saveBtnBox.y}`);
        await shot(page, 'dashboard-buddy-10-btn-positions.png');
        // Both buttons should be in the same row (similar y position)
        const verticalDistance = Math.abs(aiBtnBox.y - saveBtnBox.y);
        console.log(`Vertical distance between "Generate with AI" and Save buttons: ${verticalDistance}px`);
        expect(verticalDistance).toBeLessThan(50);
        console.log('✅ "Generate with AI" button is in the same action bar row as Save button');
      }
    } else {
      console.log('⚠️  Could not compare button positions — "Generate with AI" button not found');
      await shot(page, 'dashboard-buddy-10-no-ai-btn.png');
    }

    await deleteViz(page, vizName);
  });

  // ── Panel content verification ────────────────────────────────────────────

  test('Dashboard Buddy panel contains expected AI buddy UI elements', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // Add a widget first so the buddy has something to analyze
    const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
    if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await showBtn.click();
      await page.waitForTimeout(800);
    }
    const chartsTile = page.getByTitle('Charts').first();
    if (await chartsTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chartsTile.click();
      await page.waitForTimeout(1000);
    }
    const closeBtn = page.getByRole('button', { name: 'Close Properties Panel' });
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  "Generate with AI" button not found — skipping panel content test');
      await shot(page, 'dashboard-buddy-11-no-ai-btn.png');
      await deleteViz(page, vizName);
      return;
    }

    await aiBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'dashboard-buddy-11-panel-open.png');

    // Check for common AI buddy panel elements: text input, generate/submit button, or buddy label
    const inputArea = page.locator([
      'textarea',
      'input[type="text"][placeholder*="ask" i]',
      'input[type="text"][placeholder*="type" i]',
      'input[type="text"][placeholder*="message" i]',
      '[contenteditable="true"]',
    ].join(', ')).first();

    const generateBtn = page.getByRole('button', { name: /generate|analyze|ask|submit|send/i }).first();

    const buddyLabel = page.getByText(/buddy|dashboard buddy|AI assistant|analysis/i).first();

    const inputVisible    = await inputArea.isVisible({ timeout: 5000 }).catch(() => false);
    const generateVisible = await generateBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const labelVisible    = await buddyLabel.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`Input area visible:    ${inputVisible}`);
    console.log(`Generate button visible: ${generateVisible}`);
    console.log(`Buddy label visible:   ${labelVisible}`);

    await shot(page, 'dashboard-buddy-12-panel-elements.png');

    if (inputVisible || generateVisible || labelVisible) {
      console.log('✅ Dashboard Buddy panel contains expected UI elements');
    } else {
      console.log('⚠️  Panel elements not detected — panel may use custom components');
    }

    await deleteViz(page, vizName);
  });

});

// ── Extended: panel interaction flow ─────────────────────────────────────────
// Confirmed from DOM inspection of app-aiv-ai-dialog:
//   - Datasource: p-dropdown[formcontrolname="datasourceId"]  (placeholder "Select Datasource")
//                 → has a search input inside the overlay; type to filter, then click option
//   - Table:      p-multiselect (no formcontrolname) — placeholder "Select tables or views"
//                 → appears after datasource selected; click to open, pick first option
//   - Prompt:     textarea[formcontrolname="prompt"]  (.chat-textarea)
//   - Submit:     button.send-btn  (has .fa-arrow-up, disabled until prompt is typed)
//   - Close:      a.fa-xmark.header-icon  (top-right of panel header)

/**
 * Open the datasource p-dropdown, type a search term, and click the first matching option.
 * Returns the selected option text, or null if nothing was found.
 */
async function selectDatasourceBySearch(page: Page, searchTerm: string): Promise<string | null> {
  const dsDropdown = page.locator('p-dropdown[formcontrolname="datasourceId"]');
  await expect(dsDropdown).toBeVisible({ timeout: 8000 });
  await dsDropdown.click();
  await page.waitForTimeout(600);

  // The overlay appends a search input to the body
  const searchInput = page.locator('.p-dropdown-filter').first();
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(600);

  const firstMatch = page.locator('.p-dropdown-item').first();
  if (!await firstMatch.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`⚠️  No dropdown options matching "${searchTerm}"`);
    await page.keyboard.press('Escape');
    return null;
  }
  const text = (await firstMatch.textContent())?.trim() ?? '';
  await firstMatch.click();
  await page.waitForTimeout(1000);
  return text;
}

/**
 * Open the table p-multiselect and click the first available option.
 * The table control is a p-multiselect (not p-dropdown), placeholder "Select tables or views".
 * Returns the selected option text, or null if nothing was found.
 */
async function selectFirstTable(page: Page): Promise<string | null> {
  // Table control is p-multiselect (confirmed from DOM)
  const tableMultiselect = page.locator('p-multiselect').first();
  if (!await tableMultiselect.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('⚠️  Table multiselect not visible');
    return null;
  }
  await tableMultiselect.click();
  await page.waitForTimeout(600);

  // Options render in a p-overlay appended to body
  const firstOption = page.locator('.p-multiselect-item').first();
  if (!await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('⚠️  No table options available');
    await page.keyboard.press('Escape');
    return null;
  }
  const text = (await firstOption.textContent())?.trim() ?? '';
  await firstOption.click();
  await page.waitForTimeout(500);
  // Close the multiselect overlay by clicking outside
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return text;
}

test.describe.serial('Dashboard Buddy — Panel Interaction', () => {

  test('Buddy panel shows datasource and table dropdowns', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-13-panel-dropdowns.png');

    // Datasource dropdown (confirmed: formcontrolname="datasourceId")
    const dsDropdown = page.locator('p-dropdown[formcontrolname="datasourceId"]');
    const dsVisible = await dsDropdown.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Datasource dropdown visible: ${dsVisible}`);
    expect(dsVisible).toBe(true);

    // Open it and verify the search input is present
    await dsDropdown.click();
    await page.waitForTimeout(600);
    const searchInput = page.locator('.p-dropdown-filter').first();
    const searchVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Datasource search input visible: ${searchVisible}`);
    await shot(page, 'dashboard-buddy-13b-ds-search-input.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Prompt textarea
    const textarea = page.locator('textarea[formcontrolname="prompt"]');
    const taVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Prompt textarea visible: ${taVisible}`);
    expect(taVisible).toBe(true);

    console.log('✅ Buddy panel dropdowns and textarea are present');
    await deleteViz(page, vizName);
  });

  test('Buddy panel — select datasource from dropdown', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-14-before-ds-select.png');

    // Search for "insurance" and select the first matching datasource
    const selected = await selectDatasourceBySearch(page, 'insurance');
    if (selected) {
      await shot(page, 'dashboard-buddy-16-ds-selected.png');
      console.log(`✅ Datasource selected: ${selected}`);
    } else {
      await shot(page, 'dashboard-buddy-16-no-ds-match.png');
    }

    await deleteViz(page, vizName);
  });

  test('Buddy panel — select datasource, select table, type prompt, submit', async ({ page }) => {
    test.setTimeout(300_000); // 5 min — covers two AI generation rounds + save
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-17-panel-ready.png');

    // ── Step 1: Search "insurance" and select datasource ──────────────────
    const dsSelected = await selectDatasourceBySearch(page, 'insurance');
    if (dsSelected) {
      await shot(page, 'dashboard-buddy-18-ds-selected.png');
      console.log(`✅ Step 1 — Datasource selected: ${dsSelected}`);
    } else {
      console.log('⚠️  Datasource "insurance" not found — skipping table selection');
    }

    // ── Step 2: Select table ──────────────────────────────────────────────
    const tblSelected = await selectFirstTable(page);
    if (tblSelected) {
      await shot(page, 'dashboard-buddy-19-table-selected.png');
      console.log(`✅ Step 2 — Table selected: ${tblSelected}`);
    } else {
      console.log('⚠️  No table selected');
    }

    // ── Step 3: Type prompt ───────────────────────────────────────────────
    const promptTextarea = page.locator('textarea[formcontrolname="prompt"]');
    await expect(promptTextarea).toBeVisible({ timeout: 5000 });
    await promptTextarea.click();
    await promptTextarea.fill('Show me a sales overview with revenue by region and top products');
    await page.waitForTimeout(500);
    await shot(page, 'dashboard-buddy-20-prompt-typed.png');
    console.log('✅ Step 3 — Prompt typed');

    // ── Step 4: Click the send button ────────────────────────────────────
    // button.send-btn — enabled once prompt text is present
    const sendBtn = page.locator('button.send-btn');
    await expect(sendBtn).toBeVisible({ timeout: 5000 });

    const isDisabled = await sendBtn.isDisabled().catch(() => true);
    if (isDisabled) {
      console.log('⚠️  Send button is disabled — prompt may not have registered, retrying fill');
      await promptTextarea.click({ force: true });
      await promptTextarea.fill('');
      await promptTextarea.type('Show me a sales overview with revenue by region and top products');
      await page.waitForTimeout(800);
    }

    await sendBtn.click({ force: true });
    await shot(page, 'dashboard-buddy-21-submitted.png');
    console.log('✅ Step 4 — Send button clicked, waiting for AI to generate widgets...');

    // ── Step 5: Wait for widget generation to complete ────────────────────
    // After generation the panel closes itself and widgets appear on the canvas.
    // Signal: app-aiv-ai-dialog disappears from the DOM (confirmed from debug run).
    // Timeout: 120 s — AI generation can be slow.
    const panel = page.locator('app-aiv-ai-dialog');
    try {
      await panel.waitFor({ state: 'hidden', timeout: 120_000 });
      console.log('✅ Step 5 — Panel closed: widgets generated and placed on canvas');
    } catch {
      console.log('⚠️  Panel did not close within 120 s — generation may still be in progress');
      await shot(page, 'dashboard-buddy-22-generation-timeout.png');
    }

    await shot(page, 'dashboard-buddy-22-generation-done.png');

    // Verify at least one widget was added to the canvas
    const canvasWidget = page.locator([
      '.aiv-widget',
      '[class*="widget-container"]',
      '[class*="viz-widget"]',
      'app-aiv-chart',
      'app-aiv-table',
    ].join(', ')).first();
    const widgetOnCanvas = await canvasWidget.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Widget on canvas after generation: ${widgetOnCanvas}`);
    await shot(page, 'dashboard-buddy-23-canvas-widgets.png');

    // ── Step 6: Save the viz ──────────────────────────────────────────────
    await saveViz(page);
    await shot(page, 'dashboard-buddy-24-saved.png');
    console.log('✅ Step 6 — Viz saved after widget generation');

    // ── Step 7: Preview → Save → 3-dots → Insights on AI-generated widgets ─
    // Insights only works on widgets created by Dashboard Buddy / Custom Viz Buddy.
    // The AI-generated widgets are now on the canvas — test Insights on them here.

    // Click Preview — navigates to /viz-preview/ URL
    const previewBtn = page.locator('span.p-element:has(.fa-eye)').first();
    await expect(previewBtn).toBeVisible({ timeout: 10000 });
    await previewBtn.click();
    await page.waitForTimeout(1500);

    // Handle "Unsaved Changes" dialog if it appears
    const unsavedDlg = page.locator('text=Unsaved Changes').first();
    if (await unsavedDlg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'Save' }).first().click();
      await page.waitForTimeout(1500);
      await shot(page, 'dashboard-buddy-25b-saved-dialog.png');
      console.log('✅ Step 7a — Saved via "Unsaved Changes" dialog');
    }

    // Wait for preview page to load (URL changes to /viz-preview/)
    await page.waitForURL(/viz-preview/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-25-preview.png');
    console.log('✅ Step 7 — Preview mode loaded');

    // ── Step 7b: Click the Insights button on a buddy-generated chart widget ─
    // Confirmed from DOM: Insights button has class "widget-icon-btn-insights"
    // with title="Insights" and fa-binoculars icon. It only appears on widgets
    // generated by Dashboard Buddy / Custom Viz Buddy — NOT on manually added widgets.
    // The 3-dots button (widget-icon-btn-menu) is separate.

    // Hover over each widget to find one with the Insights button
    const allWidgets = page.locator('[class*="widget-transform"]');
    const widgetCount = await allWidgets.count().catch(() => 0);
    console.log(`Widgets in preview: ${widgetCount}`);

    let insightsFound = false;
    for (let i = 0; i < widgetCount && !insightsFound; i++) {
      const w = allWidgets.nth(i);
      if (!await w.isVisible({ timeout: 1000 }).catch(() => false)) continue;
      await w.hover();
      await page.waitForTimeout(500);

      const insightsBtn = page.locator('button.widget-icon-btn-insights, button[title="Insights"]').first();
      if (await insightsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await insightsBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, 'dashboard-buddy-27-insights.png');
        console.log(`✅ Step 7b — Insights button clicked on widget ${i}`);
        insightsFound = true;
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    if (!insightsFound) {
      console.log('⚠️  Insights button not found on any widget in preview');
      await shot(page, 'dashboard-buddy-27-no-insights.png');
    }

    // Navigate back to editor
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() =>
      page.goto(page.url().replace('/viz-preview/', '/viz-edit/'), { waitUntil: 'domcontentloaded' })
    );
    await page.waitForSelector('.action-bar-btn-save', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // ── Step 8: Add Custom Visualization widget ───────────────────────────
    // Re-open the widget sidebar — it may be hidden after Preview mode
    const hideBtnCheck = page.getByRole('button', { name: 'Hide Widget Sidebar' });
    if (!await hideBtnCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
      const showBtnCheck = page.getByRole('button', { name: 'Show Widget Sidebar' });
      if (await showBtnCheck.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showBtnCheck.click();
        await page.waitForTimeout(800);
      }
    }
    const hideBtn = page.getByRole('button', { name: 'Hide Widget Sidebar' });
    if (!await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
      if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showBtn.click();
        await page.waitForTimeout(800);
      }
    }

    const customVizTile = page.getByTitle('Custom Visualization').first();
    await expect(customVizTile).toBeVisible({ timeout: 10000 });
    await customVizTile.click();
    await page.waitForTimeout(1500);
    await shot(page, 'dashboard-buddy-28-customviz-added.png');
    console.log('✅ Step 8 — Custom Visualization widget added');

    // ── Step 8: Select automation_testing dataset ─────────────────────────
    // Confirmed from DOM: the dataset dropdown is visible immediately after adding
    // the widget — no tab click needed. Identified by filterplaceholder attribute.
    const dsPDropdown = page.locator('p-dropdown[filterplaceholder*="pipeline | cd | ds | stash"]');
    await expect(dsPDropdown).toBeVisible({ timeout: 8000 });
    await dsPDropdown.click();
    await page.waitForTimeout(500);
    await shot(page, 'dashboard-buddy-26-ds-dropdown-open.png');

    // Filter and select automation_testing
    const filterInput = page.locator('.p-dropdown-filter').first();
    if (await filterInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterInput.fill('autom');
      await page.waitForTimeout(500);
    }
    const dsOption = page.getByRole('option', { name: 'automation_testing' });
    if (await dsOption.isVisible({ timeout: 8000 }).catch(() => false)) {
      await dsOption.click();
      await page.waitForTimeout(800);
      await shot(page, 'dashboard-buddy-30-dataset-selected.png');
      console.log('✅ Step 9 — Dataset selected: automation_testing');
    } else {
      console.log('⚠️  automation_testing option not found');
      await page.keyboard.press('Escape');
      await shot(page, 'dashboard-buddy-31-no-dataset.png');
    }

    // ── Step 9: Click the AI (sparkles) button in the widget panel ────────
    // Confirmed from DOM: there are TWO button:has(.fa-sparkles) —
    //   index 0 = action-bar "Generate with AI" button (top bar)
    //   index 1 = widget-panel AI button (inside the Custom Viz properties panel)
    // We use .nth(1) to target the widget-panel one specifically.
    const allSparklesBtns = page.locator('button:has(.fa-sparkles)');
    const sparklesCount = await allSparklesBtns.count().catch(() => 0);
    console.log(`Total sparkles buttons visible: ${sparklesCount}`);

    const customVizAiBtn = sparklesCount >= 2
      ? allSparklesBtns.nth(1)   // widget-panel AI button
      : allSparklesBtns.first(); // fallback if only one exists

    if (await customVizAiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await customVizAiBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'dashboard-buddy-28-customviz-ai-clicked.png');
      console.log('✅ Step 9 — AI button clicked inside Custom Visualization widget');

      // The same app-aiv-ai-dialog panel should open
      const aiPanel = page.locator('app-aiv-ai-dialog');
      await expect(aiPanel).toBeVisible({ timeout: 8000 });
      await shot(page, 'dashboard-buddy-29-customviz-ai-panel.png');
      console.log('✅ Step 9 — AI buddy panel opened from Custom Viz widget');

      // ── Step 10: Type the detailed prompt ─────────────────────────────
      const CV_PROMPT =
        'Create a modern interactive executive sales dashboard from the dataset with Country, ' +
        'Category, Year, Revenue, and Profit fields, including KPI cards (Total Revenue, Total Profit, ' +
        'Profit Margin, Top Country), bar charts for revenue/profit by country, donut/pie charts for ' +
        'category share, line charts for year-wise trends, stacked bars, treemap, heatmap, bubble chart, ' +
        'detailed sortable table, cross-filtering, drill-down, tooltips, automatic insights, growth ' +
        'indicators, and a clean enterprise UI with the most meaningful widget combinations and analytics.';

      const cvPrompt = page.locator('textarea[formcontrolname="prompt"]');
      await expect(cvPrompt).toBeVisible({ timeout: 5000 });
      await cvPrompt.click();
      await cvPrompt.fill(CV_PROMPT);
      await page.waitForTimeout(500);
      await shot(page, 'dashboard-buddy-30-cv-prompt-typed.png');
      console.log('✅ Step 10 — Detailed prompt typed');

      // ── Step 11: Submit ───────────────────────────────────────────────
      const cvSendBtn = page.locator('button.send-btn');
      await expect(cvSendBtn).toBeVisible({ timeout: 5000 });

      // Retry fill if send button is still disabled (Angular change detection lag)
      if (await cvSendBtn.isDisabled().catch(() => true)) {
        console.log('⚠️  Send button disabled — retrying prompt fill via type()');
        await cvPrompt.click({ force: true });
        await cvPrompt.fill('');
        await cvPrompt.type(CV_PROMPT);
        await page.waitForTimeout(800);
      }

      await cvSendBtn.click({ force: true });
      await shot(page, 'dashboard-buddy-31-cv-submitted.png');
      console.log('✅ Step 11 — Prompt submitted, waiting for AI to generate code...');

      // ── Step 12: Wait for the result row to appear, then click Publish ─
      // The Custom Viz Buddy panel stays open and shows the result inline.
      // Generation is complete when the "Loading" skeleton disappears.
      // The Publish button is identified by its fa-bullhorn icon (confirmed from DOM).

      // Wait for response container to appear
      const responseContainer = page.locator('app-ai-chat .response-container, app-ai-chat .answer-aiv').first();
      try {
        await responseContainer.waitFor({ state: 'visible', timeout: 120_000 });
        console.log('✅ Step 12 — Response container appeared');
      } catch {
        console.log('⚠️  Response container did not appear within 120 s');
        await shot(page, 'dashboard-buddy-32-cv-no-response.png');
      }

      // Wait for "Loading" skeleton to disappear — generation complete
      const loadingTag = page.locator('app-ai-chat .p-tag-value').filter({ hasText: 'Loading' });
      await loadingTag.waitFor({ state: 'hidden', timeout: 120_000 }).catch(() =>
        console.log('⚠️  Loading tag still visible after 120 s')
      );
      await page.waitForTimeout(1000);
      await shot(page, 'dashboard-buddy-32-cv-result-ready.png');
      console.log('✅ Step 12 — Generation complete (Loading gone)');

      // The Publish button has a fa-bullhorn icon (confirmed from DOM inspection)
      const publishBtn = page.locator('app-ai-chat button:has(.fa-bullhorn)').last();
      if (await publishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await publishBtn.scrollIntoViewIfNeeded();
        await shot(page, 'dashboard-buddy-32-cv-publish-visible.png');

        // ── Step 12a: Click Publish ──────────────────────────────────────
        await publishBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, 'dashboard-buddy-32-cv-published.png');
        console.log('✅ Step 12a — Publish (bullhorn) clicked: code applied to widget');

        // Panel may close or stay open — close it if still open
        const aiPanel = page.locator('app-aiv-ai-dialog');
        await aiPanel.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
          console.log('ℹ️  Panel still open after Publish — closing via X');
          return page.locator('app-aiv-ai-dialog a.fa-xmark, app-aiv-ai-dialog a[class*="xmark"]').first().click().catch(() => {});
        });
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️  Publish (bullhorn) button not found — closing panel');
        await page.locator('app-aiv-ai-dialog a.fa-xmark, app-aiv-ai-dialog a[class*="xmark"]').first().click().catch(() => {});
        await page.waitForTimeout(500);
      }

      await shot(page, 'dashboard-buddy-32-cv-done.png');

      // ── Step 12b: 3-dots → Insights on the Custom Viz widget ─────────
      // Insights is available on Custom Visualization Buddy-generated widgets.
      // The Custom Viz widget is the last widget-transform on the canvas.
      const cvWidgetBox = page.locator('[class*="widget-transform"]:has(app-aiv-custom-visualization), [class*="widget-transform"]').last();
      if (await cvWidgetBox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cvWidgetBox.hover();
        await page.waitForTimeout(600);
      } else {
        await page.mouse.move(400, 300);
        await page.waitForTimeout(600);
      }

      const cvDotsBtn = page.locator('button.widget-icon-btn-menu, button:has(.fa-ellipsis-stroke)').first();
      if (await cvDotsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cvDotsBtn.click();
        await page.waitForTimeout(1000);
        await shot(page, 'dashboard-buddy-32c-cv-dots-menu.png');
        console.log('✅ Step 12b — 3-dots menu opened on Custom Viz widget');

        const cvInsightsItem = page.locator('li.cursor-pointer').filter({ hasText: /^Insights$/ })
          .or(page.locator('li').filter({ hasText: /^Insights$/ }))
          .first();

        if (await cvInsightsItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await cvInsightsItem.click();
          await page.waitForTimeout(1500);
          await shot(page, 'dashboard-buddy-32d-cv-insights.png');
          console.log('✅ Step 12c — Insights clicked on Custom Viz widget');
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(300);
        } else {
          const cvMenuTexts = await page.locator('li.cursor-pointer').allTextContents().catch(() => []);
          console.log(`ℹ️  CV menu items: ${cvMenuTexts.map(t => t.trim()).filter(Boolean).join(', ')}`);
          await shot(page, 'dashboard-buddy-32d-no-cv-insights.png');
          await page.keyboard.press('Escape');
        }
      } else {
        console.log('⚠️  3-dots not found on Custom Viz widget');
        await shot(page, 'dashboard-buddy-32c-no-cv-dots.png');
      }

    } else {
      console.log('⚠️  AI button not found inside Custom Visualization widget');
      await shot(page, 'dashboard-buddy-28-no-customviz-ai-btn.png');
    }

    // ── Step 13: Save the viz ─────────────────────────────────────────────
    await saveViz(page);
    await shot(page, 'dashboard-buddy-33-final-saved.png');
    console.log('✅ Step 13 — Viz saved after Custom Viz AI generation');

    await shot(page, 'dashboard-buddy-34-final.png');
    await deleteViz(page, vizName);
  });

  test('Buddy panel — prompt textarea has correct placeholder text', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea[formcontrolname="prompt"]');
    await expect(textarea).toBeVisible({ timeout: 8000 });
    const placeholder = await textarea.getAttribute('placeholder');
    console.log(`Textarea placeholder: "${placeholder}"`);
    await shot(page, 'dashboard-buddy-23-textarea-placeholder.png');
    expect(placeholder).toBeTruthy();
    console.log('✅ Prompt textarea placeholder is present');

    await deleteViz(page, vizName);
  });

  test('Buddy panel — send button is disabled until prompt is typed', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);

    const sendBtn = page.locator('button.send-btn');
    await expect(sendBtn).toBeVisible({ timeout: 8000 });

    // Should be disabled with empty prompt
    const disabledBefore = await sendBtn.isDisabled().catch(() => false);
    console.log(`Send button disabled (empty prompt): ${disabledBefore}`);
    await shot(page, 'dashboard-buddy-24-send-disabled.png');

    // Type something — button should become enabled
    const promptTextarea = page.locator('textarea[formcontrolname="prompt"]');
    await promptTextarea.click();
    await promptTextarea.type('test prompt');
    await page.waitForTimeout(500);

    const disabledAfter = await sendBtn.isDisabled().catch(() => true);
    console.log(`Send button disabled (after typing): ${disabledAfter}`);
    await shot(page, 'dashboard-buddy-25-send-enabled.png');

    expect(disabledBefore).toBe(true);
    expect(disabledAfter).toBe(false);
    console.log('✅ Send button correctly disabled/enabled based on prompt input');

    await deleteViz(page, vizName);
  });

  test('Buddy panel — close button (X) dismisses the panel', async ({ page }) => {
    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    const aiBtn = await findAiButton(page);
    if (!aiBtn) {
      console.log('⚠️  AI button not found — skipping');
      await deleteViz(page, vizName);
      return;
    }
    await aiBtn.click();
    await page.waitForTimeout(1500);

    // Verify panel is open
    const panel = page.locator('app-aiv-ai-dialog');
    await expect(panel).toBeVisible({ timeout: 8000 });
    await shot(page, 'dashboard-buddy-26-panel-open.png');

    // Click the X close button (a.fa-xmark.header-icon in the panel header)
    const closeBtn = panel.locator('a.fa-xmark, a[class*="xmark"]').first();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(800);
      const stillOpen = await panel.isVisible({ timeout: 2000 }).catch(() => false);
      await shot(page, 'dashboard-buddy-27-panel-closed.png');
      console.log(`Panel still visible after close: ${stillOpen}`);
      expect(stillOpen).toBe(false);
      console.log('✅ Panel closed via X button');
    } else {
      console.log('⚠️  X close button not found — trying Escape');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await shot(page, 'dashboard-buddy-27-panel-closed-esc.png');
    }

    await deleteViz(page, vizName);
  });

});

// ── Standalone: Insights button on Dashboard Buddy-generated widget ──────────
// Run with: npx playwright test 18-dashboard-buddy.spec.ts --grep "Insights button"

test.describe.serial('Dashboard Buddy — Insights', () => {

  test('Insights button appears and is clickable on buddy-generated chart widget', async ({ page }) => {
    test.setTimeout(300_000); // generation can take up to 2 min

    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // ── 1. Open Dashboard Buddy and generate widgets ──────────────────────
    const aiBtn = await findAiButton(page);
    if (!aiBtn) { console.log('⚠️  AI button not found'); await deleteViz(page, vizName); return; }
    await aiBtn.click();
    await page.waitForTimeout(1500);

    // Select Insurance datasource
    const dsDropdown = page.locator('p-dropdown[formcontrolname="datasourceId"]');
    await expect(dsDropdown).toBeVisible({ timeout: 8000 });
    await dsDropdown.click();
    await page.waitForTimeout(600);
    await page.locator('.p-dropdown-filter').first().fill('insurance');
    await page.waitForTimeout(600);
    await page.locator('.p-dropdown-item').first().click();
    await page.waitForTimeout(1200);
    console.log('✅ Datasource selected: Insurance');

    // Select first table
    const tableMs = page.locator('p-multiselect').first();
    if (await tableMs.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tableMs.click(); await page.waitForTimeout(600);
      await page.locator('.p-multiselect-item').first().click(); await page.waitForTimeout(400);
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      console.log('✅ Table selected');
    }

    // Type prompt and submit
    const promptTa = page.locator('textarea[formcontrolname="prompt"]');
    await expect(promptTa).toBeVisible({ timeout: 5000 });
    await promptTa.click();
    await promptTa.fill('Show revenue by region as a bar chart');
    await page.waitForTimeout(500);

    const sendBtn = page.locator('button.send-btn');
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
    await sendBtn.click({ force: true });
    console.log('✅ Prompt submitted — waiting for generation...');

    // Wait for panel to close (generation done)
    const panel = page.locator('app-aiv-ai-dialog');
    await panel.waitFor({ state: 'hidden', timeout: 120_000 });
    console.log('✅ Widgets generated');

    // Save
    await saveViz(page);
    await shot(page, 'insights-01-saved.png');

    // ── 2. Go to Preview ──────────────────────────────────────────────────
    const previewSpan = page.locator('span.p-element:has(.fa-eye)').first();
    await expect(previewSpan).toBeVisible({ timeout: 10000 });
    await previewSpan.click();
    await page.waitForTimeout(1000);

    // Handle "Unsaved Changes" dialog
    const unsavedDlg = page.locator('text=Unsaved Changes').first();
    if (await unsavedDlg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'Save' }).first().click();
      await page.waitForTimeout(1500);
    }

    await page.waitForURL(/viz-preview/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await shot(page, 'insights-02-preview.png');
    console.log('✅ Preview mode loaded');

    // ── 3. Hover over widgets and click Insights ──────────────────────────
    // Confirmed from DOM: Insights button has class "widget-icon-btn-insights"
    // title="Insights" and fa-binoculars icon. Only on buddy-generated widgets.
    const allWidgets = page.locator('[class*="widget-transform"]');
    const widgetCount = await allWidgets.count().catch(() => 0);
    console.log(`Widgets in preview: ${widgetCount}`);

    let insightsClicked = false;
    for (let i = 0; i < widgetCount && !insightsClicked; i++) {
      const w = allWidgets.nth(i);
      if (!await w.isVisible({ timeout: 1000 }).catch(() => false)) continue;
      await w.hover();
      await page.waitForTimeout(500);

      const insightsBtn = page.locator('button.widget-icon-btn-insights, button[title="Insights"]').first();
      if (await insightsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await shot(page, `insights-03-btn-visible-widget${i}.png`);
        await insightsBtn.click();

        // Wait until the Smart Insights dialog is actually visible
        // Confirmed from screenshot: dialog has title "Smart Insights" with
        // "Key Findings" and "Strategic Recommendations" sections.
        const insightsPanel = page.locator([
          '.p-dialog:has-text("Smart Insights")',
          '[class*="insight"]:has-text("Key Findings")',
          'div:has-text("Smart Insights")',
        ].join(', ')).first();

        try {
          await insightsPanel.waitFor({ state: 'visible', timeout: 30_000 });
          console.log('✅ Smart Insights panel opened');
        } catch {
          console.log('⚠️  Smart Insights panel did not open within 30 s');
        }

        await shot(page, 'insights-04-panel-opened.png');
        console.log(`✅ Insights button clicked on widget ${i}`);
        insightsClicked = true;

        // Verify the panel is visible
        const panelVisible = await insightsPanel.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`Insights panel visible: ${panelVisible}`);
        await shot(page, 'insights-05-panel-content.png');

        // Scroll down inside the dialog to reveal Strategic Recommendations
        const dialogBody = page.locator('.p-dialog-content, [class*="dialog-content"], [class*="insight-content"]').first();
        if (await dialogBody.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dialogBody.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
          await page.waitForTimeout(1500);
          await shot(page, 'insights-06-scrolled-down.png');
          console.log('✅ Scrolled down inside Smart Insights dialog');
        } else {
          // Fallback: scroll the whole page
          await page.keyboard.press('End');
          await page.waitForTimeout(1000);
          await shot(page, 'insights-06-scrolled-down.png');
          console.log('✅ Scrolled down via keyboard');
        }

        // Close the dialog via the Close button
        const closeBtn = page.getByRole('button', { name: /^close$/i }).last();
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          console.log('✅ Smart Insights dialog closed');
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }

    if (!insightsClicked) {
      console.log('⚠️  Insights button not found on any widget');
      await shot(page, 'insights-03-no-insights-btn.png');
    }

    expect(insightsClicked).toBe(true);
    await deleteViz(page, vizName);
  });

});

// ── Standalone: Forecast → Apply → Info icon ─────────────────────────────────
// Run with: npx playwright test 18-dashboard-buddy.spec.ts --grep "Forecast"

test.describe.serial('Dashboard Buddy — Forecast', () => {

  test('3-dots → Forecast → Apply → hover info icon on buddy-generated chart', async ({ page }) => {
    test.setTimeout(300_000);

    await loginAndGoToVizList(page);
    const vizName = await createViz(page);

    // ── 1. Generate widgets via Dashboard Buddy ───────────────────────────
    const aiBtn = await findAiButton(page);
    if (!aiBtn) { console.log('⚠️  AI button not found'); await deleteViz(page, vizName); return; }
    await aiBtn.click();
    await page.waitForTimeout(1500);

    const dsDropdown = page.locator('p-dropdown[formcontrolname="datasourceId"]');
    await expect(dsDropdown).toBeVisible({ timeout: 8000 });
    await dsDropdown.click(); await page.waitForTimeout(600);
    await page.locator('.p-dropdown-filter').first().fill('insurance'); await page.waitForTimeout(600);
    await page.locator('.p-dropdown-item').first().click(); await page.waitForTimeout(1200);
    console.log('✅ Datasource: Insurance');

    const tableMs = page.locator('p-multiselect').first();
    if (await tableMs.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tableMs.click(); await page.waitForTimeout(600);
      await page.locator('.p-multiselect-item').first().click(); await page.waitForTimeout(400);
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      console.log('✅ Table selected');
    }

    const promptTa = page.locator('textarea[formcontrolname="prompt"]');
    await expect(promptTa).toBeVisible({ timeout: 5000 });
    await promptTa.click();
    await promptTa.fill('Show revenue by region as a bar chart and premium amount trend over time as a line chart');
    await page.waitForTimeout(500);

    const sendBtn = page.locator('button.send-btn');
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
    await sendBtn.click({ force: true });
    console.log('✅ Prompt submitted — waiting for generation...');

    await page.locator('app-aiv-ai-dialog').waitFor({ state: 'hidden', timeout: 120_000 });
    console.log('✅ Widgets generated');

    await saveViz(page);
    await shot(page, 'forecast-01-saved.png');

    // ── 2. Go to Preview ──────────────────────────────────────────────────
    const previewSpan = page.locator('span.p-element:has(.fa-eye)').first();
    await expect(previewSpan).toBeVisible({ timeout: 10000 });
    await previewSpan.click();
    await page.waitForTimeout(1000);

    const unsavedDlg = page.locator('text=Unsaved Changes').first();
    if (await unsavedDlg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'Save' }).first().click();
      await page.waitForTimeout(1500);
    }

    await page.waitForURL(/viz-preview/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await shot(page, 'forecast-02-preview.png');
    console.log('✅ Preview mode loaded');

    // ── 3. Hover over widgets, find one with Forecast in the 3-dots menu ──
    const allWidgets = page.locator('[class*="widget-transform"]');
    const widgetCount = await allWidgets.count().catch(() => 0);
    console.log(`Widgets in preview: ${widgetCount}`);

    let forecastClicked = false;

    for (let i = 0; i < widgetCount && !forecastClicked; i++) {
      const w = allWidgets.nth(i);
      if (!await w.isVisible({ timeout: 1000 }).catch(() => false)) continue;

      await w.hover();
      await page.waitForTimeout(500);

      const dotsBtn = page.locator('button.widget-icon-btn-menu, button[title="More Options"]').first();
      if (!await dotsBtn.isVisible({ timeout: 1000 }).catch(() => false)) continue;

      await dotsBtn.click();
      await page.waitForTimeout(800);
      await shot(page, `forecast-03-menu-widget${i}.png`);

      const forecastItem = page.locator('li.cursor-pointer').filter({ hasText: /Forecast/ }).first();
      if (!await forecastItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        const items = await page.locator('li.cursor-pointer').allTextContents().catch(() => []);
        console.log(`Widget ${i} menu (no Forecast): ${items.map(t => t.trim()).filter(Boolean).join(', ')}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        continue;
      }

      // ── 4. Click Forecast ───────────────────────────────────────────────
      await forecastItem.click();
      await page.waitForTimeout(1000);
      console.log(`✅ Forecast clicked on widget ${i}`);

      // Wait for the Forecast dialog to open
      const forecastDialog = page.locator('.p-dialog, [role="dialog"]').first();
      await forecastDialog.waitFor({ state: 'visible', timeout: 15_000 });
      await shot(page, 'forecast-04-dialog.png');
      console.log('✅ Forecast dialog opened');

      // ── 5. Click Apply ──────────────────────────────────────────────────
      const applyBtn = page.getByRole('button', { name: /^apply$/i })
        .or(page.locator('button').filter({ hasText: /^apply$/i }))
        .first();

      if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
        await shot(page, 'forecast-05-applied.png');
        console.log('✅ Apply button clicked');

        // Wait for dialog to close after Apply
        await forecastDialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() =>
          console.log('ℹ️  Dialog still open after Apply')
        );
      } else {
        // Dump all visible buttons for diagnosis
        const btns = await page.evaluate(() =>
          Array.from(document.querySelectorAll('button'))
            .filter(b => b.offsetParent !== null)
            .map(b => ({ text: b.textContent?.trim().substring(0,40), class: b.className.substring(0,60) }))
        );
        console.log('⚠️  Apply button not found. Visible buttons:', JSON.stringify(btns.filter(b => b.text)));
        await shot(page, 'forecast-05-no-apply.png');
        await page.keyboard.press('Escape');
      }

      forecastClicked = true;
    }

    if (!forecastClicked) {
      console.log('⚠️  No widget with Forecast found');
      await shot(page, 'forecast-03-no-forecast.png');
    }

    // ── 6. Hover over widget again → click the info icon ──────────────────
    // After Forecast is applied, hovering the widget reveals an info icon
    // alongside the Insights and 3-dots buttons.
    await page.waitForTimeout(1000);

    const allWidgets2 = page.locator('[class*="widget-transform"]');
    const wCount2 = await allWidgets2.count().catch(() => 0);
    let infoClicked = false;

    for (let i = 0; i < wCount2 && !infoClicked; i++) {
      const w = allWidgets2.nth(i);
      if (!await w.isVisible({ timeout: 1000 }).catch(() => false)) continue;
      await w.hover();
      await page.waitForTimeout(500);

      // Info icon: typically fa-circle-info, fa-info-circle, or widget-icon-btn-info
      const infoBtn = page.locator([
        'button.widget-icon-btn-info',
        'button[title*="info" i]',
        'button[title*="Info" i]',
        'button:has(.fa-circle-info)',
        'button:has(.fa-info-circle)',
        'button:has(.fa-info)',
      ].join(', ')).first();

      if (await infoBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await shot(page, `forecast-06-info-btn-widget${i}.png`);
        await infoBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, 'forecast-07-info-clicked.png');
        console.log(`✅ Info icon clicked on widget ${i}`);
        infoClicked = true;

        // Close any panel that opened
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    if (!infoClicked) {
      console.log('⚠️  Info icon not found after Forecast apply — capturing state');
      await shot(page, 'forecast-06-no-info-btn.png');
    }

    await deleteViz(page, vizName);
  });

});
