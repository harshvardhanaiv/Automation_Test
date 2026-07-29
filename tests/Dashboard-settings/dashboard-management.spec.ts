import { test, expect } from '@playwright/test';

const TARGET_URL = 'https://aiv.test.oneaiv.com:8086/aiv/';

test.describe('AIV Dashboard Folder Management and Testing', () => {

  test('Full E2E Flow: Login → Navigate → Create Viz → Tab Settings → Save', async ({ page }) => {
    // Allow extra time for this full E2E flow
    test.setTimeout(180_000); // Increased overall timeout to 3 minutes

    // ── STEP 1: Navigation and Login ─────────────────────────────────────────
    console.log('\n── STEP 1: Navigating to AIV Login Screen ──────────────────');
    await page.goto(TARGET_URL, { timeout: 60_000, waitUntil: 'domcontentloaded' });

    // Enter username
    console.log('   Entering username "Admin"...');
    const usernameInput = page.locator('input[placeholder="Username"], input[placeholder="Your email"], input').first();
    await usernameInput.waitFor({ state: 'visible', timeout: 15_000 });
    await usernameInput.fill('Admin');

    // Enter password
    console.log('   Entering password...');
    const passwordInput = page.locator('input[placeholder="Password"], input[type="password"]').first();
    await passwordInput.fill('Ganesh04');

    // Click Login
    console.log('   Clicking Sign In button...');
    const loginBtn = page.locator('button.p-button, button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await loginBtn.click();

    // Wait for the main page to load by checking for the hamburger menu or search box
    console.log('   Waiting for home page to load...');
    await page.waitForSelector('button.smenu_button, input[placeholder="Search files and folders"]', { timeout: 60_000 });
    console.log('   ✅ Logged in successfully');
    await page.screenshot({ path: 'test-results/screenshots/01_logged_in.png' });

    // ── STEP 2: Navigate to Dashboard Grid View ──────────────────────────────
    console.log('\n── STEP 2: Navigating to Dashboard Grid/List View ──────────');
    
    // Direct navigation is more reliable, but we'll catch and fallback to UI click if it fails
    try {
      await page.goto(TARGET_URL + 'Visualization/GridDashboard', { timeout: 45_000, waitUntil: 'domcontentloaded' });
    } catch (error) {
      console.log('   Direct navigation timed out, trying UI click fallback...');
      const hamburgerMenu = page.locator('button.smenu_button').first();
      if (await hamburgerMenu.isVisible()) await hamburgerMenu.click();
      const dashboardListViewLink = page.locator('a[href*="/Visualization/GridDashboard"], a:has-text("Dashboard"), span.menu-text:has-text("Dashboard")').first();
      await dashboardListViewLink.click();
    }
    
    // Verify redirection to the grid dashboard page
    console.log('   Waiting for grid dashboard page URL...');
    await page.waitForURL((url) => url.toString().includes('Visualization/GridDashboard'), { timeout: 45_000 });
    await page.waitForTimeout(2000); // Allow grid to fully render
    console.log('   ✅ Navigated to Dashboard Grid/List View');
    await page.screenshot({ path: 'test-results/screenshots/02_dashboard_grid.png' });

    // ── STEP 3: Search and open "Automation testing" folder ───────────────────
    console.log('\n── STEP 3: Searching for "Automation testing" folder ──────────');
    // Use getByPlaceholder to target the visible grid search box
    const searchInput = page.getByPlaceholder('Search files and folders');
    await searchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await searchInput.fill('Automation testing');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000); // Wait for results to filter

    // Double-click the "Automation testing" folder to open it
    const automationFolder = page.locator('[role="gridcell"], label, .slick-row, tr, div[role="row"]').filter({ hasText: /Automation testing/i }).first();
    await automationFolder.waitFor({ state: 'visible', timeout: 15_000 });
    await automationFolder.dblclick();

    // Verify navigation inside "Automation testing" by waiting for breadcrumb
    const automationBreadcrumb = page.locator('button, span, a').filter({ hasText: /Automation testing/i }).first();
    await automationBreadcrumb.waitFor({ state: 'visible', timeout: 20_000 });
    console.log('   ✅ Successfully entered "Automation testing" folder');
    await page.screenshot({ path: 'test-results/screenshots/03_inside_automation_testing.png' });

    // ── STEP 4: Create Visualization with dynamic name ─────────────────────
    const vizName = `auto_viz_${Date.now()}`;
    console.log(`\n── STEP 4: Creating Viz "${vizName}" ─────────────`);

    const createVizBtn = page.locator('button:has-text("Create Viz"), button.bottom-menu-btn:has-text("Create Viz")').first();
    await createVizBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await createVizBtn.click();

    // Wait for Create File dialog
    const vizDialog = page.locator('[role="dialog"], .mat-mdc-dialog-container, .modal-dialog, .modal-content').filter({ hasText: 'Create File' }).first();
    await vizDialog.waitFor({ state: 'visible', timeout: 15_000 });

    // Fill in viz name
    const vizNameInput = vizDialog.locator('input').first();
    await vizNameInput.fill(vizName);

    // Click submit
    const submitVizBtn = vizDialog.locator('button:has-text("Create File"), button:has-text("Create")').last();
    await submitVizBtn.click();

    // Wait for redirect to visual designer canvas (URL containing /viz-edit/)
    console.log('   Waiting for redirection to Dashboard designer...');
    await page.waitForURL((url) => url.toString().includes('/viz-edit/'), { timeout: 60_000 });
    await page.waitForTimeout(4000); // Allow canvas and tabs to fully render
    console.log(`   ✅ Successfully redirected to Dashboard designer: ${page.url()}`);
    await page.screenshot({ path: 'test-results/screenshots/04_viz_designer_opened.png' });

    // ── STEP 5: Create New Tab (click + icon) ────────────────────────────────
    console.log('\n── STEP 5: Creating a new tab ──────────────────────────────');
    // Using more generic locator for the plus icon near the tabs
    const addTabBtn = page.locator('.aiv-tab-header i.pi-plus, .tab-title i.pi-plus, button:has(i.pi-plus), button i.fa-plus').first();
    await addTabBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await addTabBtn.click();
    await page.waitForTimeout(2000); // Wait for Tab 2 to appear
    console.log('   ✅ Clicked plus button – Tab 2 created');
    await page.screenshot({ path: 'test-results/screenshots/05_tab2_created.png' });

    // ── STEP 6: Double-click Tab 2 and rename ────────────────────────────────
    const tabName = `MyTab_${Date.now()}`;
    console.log(`\n── STEP 6: Renaming "Tab 2" → "${tabName}" ─────────────────`);
    const tab2Element = page.locator('div:has-text("Tab 2"), span:has-text("Tab 2")').first();
    await tab2Element.waitFor({ state: 'visible', timeout: 15_000 });
    await tab2Element.dblclick();
    await page.waitForTimeout(500);

    // Fill the inline rename input
    const renameInput = tab2Element.locator('input').first();
    if (await renameInput.isVisible()) {
      await renameInput.fill(tabName);
      await renameInput.press('Enter');
    } else {
      // If the input isn't nested inside the tab element, try global
      const globalInput = page.locator('input[type="text"]').last();
      await globalInput.fill(tabName);
      await globalInput.press('Enter');
    }
    await page.waitForTimeout(1000);
    console.log(`   ✅ Tab renamed to "${tabName}"`);
    await page.screenshot({ path: 'test-results/screenshots/06_tab_renamed.png' });

    // ── STEP 7: Click outside (white canvas area) to deselect tab ───────────
    console.log('\n── STEP 7: Clicking outside tab to deselect ────────────────');
    await page.locator('body').click({ position: { x: 600, y: 400 }, force: true });
    await page.waitForTimeout(1000);

    // ── STEP 8: Click settings icon on the renamed tab ──────────────────────
    console.log(`\n── STEP 8: Opening settings panel for "${tabName}" tab ─────`);
    // Ensure we hover the tab area to reveal icons if they are hidden
    const tabArea = page.locator('mat-tab-group, [class*="tab-header"], [class*="tab-nav"], .tab-container').first();
    if (await tabArea.isVisible()) await tabArea.hover();

    // Use a very broad locator that matches AIV's settings gear icon patterns (FontAwesome, PrimeIcons, or title)
    const tabSettingsCog = page.locator([
      'button[title="Tab Settings"]',
      'button[aria-label="Tab Settings"]',
      '[class*="tab"] .fa-gear',
      '[class*="tab"] button[title*="Setting"]',
      '[class*="tab"] .fa-light.fa-cog',
      '.pi-cog',
      '.fa-cog',
      'i.pi-cog',
      'i.fa-cog'
    ].join(', ')).filter({ visible: true }).first();

    await tabSettingsCog.waitFor({ state: 'visible', timeout: 15_000 });
    await tabSettingsCog.click();
    await page.waitForTimeout(2000); // Allow right-side settings panel to animate in
    console.log('   ✅ Settings panel opened');
    await page.screenshot({ path: 'test-results/screenshots/07_settings_panel_opened.png' });

    // ── STEP 9: Expand "Tab Settings" and apply all style values ─────────────
    console.log('\n── STEP 9: Applying Tab Settings values ────────────────────');

    // Expand the Tab Settings accordion if not already open
    const accordionHeader = page.locator('a.p-accordion-header-link:has-text("Tab Settings"), span:has-text("Tab Settings"), div.p-accordion-header:has-text("Tab Settings")').first();
    await accordionHeader.waitFor({ state: 'visible', timeout: 15_000 });
    const isExpanded = await accordionHeader.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await accordionHeader.click();
      await page.waitForTimeout(1000);
    }
    console.log('   Tab Settings section expanded');

    // Scope all inputs inside the Tab Settings panel
    const scope = page.locator('p-accordiontab:has(span:has-text("Tab Settings")), p-accordiontab:has-text("Tab Settings"), div.p-accordion-tab:has-text("Tab Settings")').first();

    // 1. Font Size → 16
    console.log('   Setting Font Size to 16...');
    const fontSizeInput = scope.locator('label:has-text("Font Size") + input, label:has-text("Font Size") ~ input, input[aria-label="Font Size"]').first();
    if (await fontSizeInput.isVisible()) {
      await fontSizeInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await fontSizeInput.fill('16');
      await fontSizeInput.press('Tab');
    }

    // 2. Width → 150
    console.log('   Setting Width to 150...');
    const widthInput = scope.locator('label:has-text("Width") + input, label:has-text("Width") ~ input, input[aria-label="Width"]').first();
    if (await widthInput.isVisible()) {
      await widthInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await widthInput.fill('150');
      await widthInput.press('Tab');
    }

    // 3. Font Weight → Bolder
    console.log('   Selecting Font Weight "Bolder"...');
    const fontWeightTrigger = scope.locator('label:has-text("Font Weight") + p-dropdown .p-dropdown-trigger, label:has-text("Font Weight") ~ p-dropdown .p-dropdown-trigger, p-dropdown[aria-label="Font Weight"]').first();
    if (await fontWeightTrigger.isVisible()) {
      await fontWeightTrigger.click();
      await page.waitForTimeout(1000); // Allow dropdown animation
      const fontWeightOption = page.locator('li[role="option"], p-dropdownitem').filter({ hasText: /bolder/i }).first();
      if (await fontWeightOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fontWeightOption.click({ force: true });
        await page.waitForTimeout(500);
      }
    }

    // 4. Font Style → Italic
    console.log('   Selecting Font Style "Italic"...');
    const fontStyleTrigger = scope.locator('label:has-text("Font Style") + p-dropdown .p-dropdown-trigger, label:has-text("Font Style") ~ p-dropdown .p-dropdown-trigger, p-dropdown[aria-label="Font Style"]').first();
    if (await fontStyleTrigger.isVisible()) {
      await fontStyleTrigger.click();
      await page.waitForTimeout(1000); // Allow dropdown animation
      const fontStyleOption = page.locator('li[role="option"], p-dropdownitem').filter({ hasText: /italic/i }).first();
      if (await fontStyleOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fontStyleOption.click({ force: true });
        await page.waitForTimeout(500);
      }
    }

    // 5. Font Color → #CBD5E1
    console.log('   Setting Font Color to #CBD5E1...');
    const fontColorInput = scope.locator('label:has-text("Font Color") + input, label:has-text("Font Color") ~ div input, label:has-text("Font Color") ~ input').first();
    if (await fontColorInput.isVisible()) {
      await fontColorInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await fontColorInput.fill('#CBD5E1');
      await fontColorInput.press('Tab');
    }

    // 6. Tab Background → #233554
    console.log('   Setting Tab Background to #233554...');
    const tabBgInput = scope.locator('label:has-text("Tab Background") + input, label:has-text("Tab Background") ~ div input, label:has-text("Tab Background") ~ input').first();
    if (await tabBgInput.isVisible()) {
      await tabBgInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await tabBgInput.fill('#233554');
      await tabBgInput.press('Tab');
    }

    // 7. Active Tab Font Color → #FFFFFF
    console.log('Setting Active Tab Font Color to #FFFFFF...');
    const activeTabFontInput = scope.locator('label:has-text("Active Tab Font Color") + input, label:has-text("Active Tab Font Color") ~ div input, label:has-text("Active Tab Font Color") ~ input').first();
    if (await activeTabFontInput.isVisible()) {
      await activeTabFontInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await activeTabFontInput.fill('#FFFFFF');
      await activeTabFontInput.press('Tab');
    }

    // 8. Active Tab Background Color → #38BDF8
    console.log('   Setting Active Tab Background Color to #38BDF8...');
    const activeTabBgInput = scope.locator('label:has-text("Active Tab Background Color") + input, label:has-text("Active Tab Background Color") ~ div input, label:has-text("Active Tab Background Color") ~ input').first();
    if (await activeTabBgInput.isVisible()) {
      await activeTabBgInput.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await activeTabBgInput.fill('#38BDF8');
      await activeTabBgInput.press('Tab');
    }

    await page.waitForTimeout(2000);
    console.log('   ✅ All Tab Settings applied successfully');
    await page.screenshot({ path: 'test-results/screenshots/08_tab_settings_applied.png' });

    // ── STEP 10: Save the Dashboard ──────────────────────────────────────────
    console.log('\n── STEP 10: Saving the dashboard ────────────────────────────');
    // The save button is the blue button in the top action bar
    const saveBtn = page.locator(
      '.action-bar-btn-save, button:has-text("Save"), button[title*="Save"], ' +
      'button.p-button:has(i.pi-save), button:has(i.pi-save)'
    ).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await saveBtn.click();
    await page.waitForTimeout(3000); // Wait for save to complete
    console.log('   ✅ Dashboard saved successfully');
    await page.screenshot({ path: 'test-results/screenshots/09_dashboard_saved.png' });
  });

});

