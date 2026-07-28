import { test, expect } from '@playwright/test';
import { BASE_URL, shot, ensureLoggedIn, goTo, goToVizFolder, URLS } from '../helpers';

test('Exploratory UI walkthrough of Visualization section', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes — needed for 20 table widgets
  // 1. Navigate into the Automation Testing Dashboard folder
  await ensureLoggedIn(page);
  await goToVizFolder(page);

  await expect(page).toHaveURL(/GridDashboard/i);
  await page.screenshot({ path: 'screenshots/viz-01-listing.png', fullPage: true }).catch(() => { });

  // 2. Click 'Create Viz' button, fill Name, create file, and edit URL wait
  const uniqueVizName = `TestViz_${Date.now()}`;
  await page.getByRole('button', { name: /^create viz$/i }).first().click();
  await page.waitForTimeout(1000);
  const createDialog = page.getByRole('dialog').first();
  await expect(createDialog).toBeVisible({ timeout: 10000 });
  const nameInput = createDialog.getByRole('textbox').first();
  await nameInput.fill(uniqueVizName);
  await createDialog.getByRole('button', { name: /^create file$/i }).first().click();
  await page.waitForURL(/\/viz-edit\//i, { timeout: 120000 });
  await page.screenshot({ path: 'screenshots/viz-02-create.png', fullPage: true }).catch(() => { });

  // 3. Explore top layout controls
  await page.waitForTimeout(2000);
  const widthInput = page.locator('input[placeholder*="width"]').first();
  if (await widthInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await widthInput.click();
    await widthInput.fill('1200');
  }
  const heightInput = page.locator('input[placeholder*="height"]').first();
  if (await heightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heightInput.click();
    await heightInput.fill('800');
  }
  const deviceDropdown = page.locator('.device-selector, [aria-label*="device"]').first();
  if (await deviceDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deviceDropdown.click();
    await page.waitForTimeout(500);
    await deviceDropdown.click();
  }
  await page.screenshot({ path: 'screenshots/viz-03-layout-controls.png', fullPage: true }).catch(() => { });

  // 4. Explore left Widget Sidebar and Add Table Widget
  const sidebarBtn = page.locator('button:has(.fa-layer-group), [title*="Widget Sidebar"], [aria-label*="Widget Sidebar"]').first();
  if (await sidebarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sidebarBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/viz-04-widget-sidebar-open.png', fullPage: true }).catch(() => { });

    // Add Table widget
    console.log('First Table Widget: Adding Table widget to canvas...');
    const tableTile = page.getByTitle('Tables').first();
    if (await tableTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tableTile.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/viz-04-table-added.png', fullPage: true }).catch(() => { });
      console.log('First Table Widget: Table widget added.');

      // Click Edit button to open the Datasets properties panel
      console.log('First Table Widget: Opening dataset properties panel...');
      const editBtn = page.getByRole('button', { name: 'Edit' }).first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screenshots/viz-04-table-properties.png', fullPage: true }).catch(() => { });

        // Select automation_testing dataset using scoped PrimeNG locators
        console.log('First Table Widget: Selecting automation_testing dataset...');
        const dropdownTrigger = page.locator('app-get-data-api').locator('.p-dropdown-trigger, span.p-dropdown-trigger-icon').first();
        if (await dropdownTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
          await dropdownTrigger.click();
          await page.waitForTimeout(1000);

          // Log all available datasets in dropdown before search
          const datasetOptions = await page.locator('.p-dropdown-panel .p-dropdown-item, .p-dropdown-panel [role="option"]').allTextContents().catch(() => []);
          console.log('First Table Widget: Available Datasets in dropdown before searching:', datasetOptions.map(t => t.trim()).filter(Boolean));

          const searchBox = page.locator('.p-dropdown-panel').locator('input').first()
            .or(page.getByRole('textbox', { name: 'Search by name or type' }))
            .first();
          if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchBox.fill('autom');
            await page.waitForTimeout(1000);

            const option = page.locator('.p-dropdown-item, [role="option"]').filter({ hasText: 'automation_testing' }).first();
            if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
              await option.click();
              await page.waitForTimeout(1500);
              console.log('First Table Widget: Dataset selected. Clicking Select All columns...');
              
              // Log all available columns before binding
              const columnList = await page.locator('p-checkbox .p-checkbox-label, li.cdk-drag, .cdk-drag label').allTextContents().catch(() => []);
              console.log('First Table Widget: Available Columns before binding:', columnList.map(t => t.trim()).filter(Boolean));

              // Click Select All columns checkbox
              const selectAllCheckbox = page.locator('p-checkbox').filter({ hasText: 'Select All' }).locator('div.p-checkbox-box')
                .or(page.locator('label').filter({ hasText: 'Select All' }))
                .or(page.getByText('Select All', { exact: true }))
                .first();
              if (await selectAllCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
                await selectAllCheckbox.click();
                await page.waitForTimeout(3000); // Wait for data selection to register
                console.log('First Table Widget: Select All columns clicked.');
              }

              // Click the gear button for the first column ("Country")
              console.log('First Table Widget: Opening column settings for Country...');
              const countryRow = page.locator('li.cdk-drag').first();
              const gearBtn = countryRow.locator('i.fa-gear').first();
              if (await gearBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await gearBtn.click({ force: true });
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'screenshots/viz-04-column-settings-open.png', fullPage: true }).catch(() => { });

                const overlay = page.locator('.p-overlaypanel').first();

                // Local helpers for overlay inputs
                const setOverlayTextInput = async (formControlName: string, val: string) => {
                  const inputEl = overlay.locator(`input[formcontrolname="${formControlName}"]`).first();
                  if (await inputEl.isVisible().catch(() => false)) {
                    await inputEl.click({ force: true });
                    await inputEl.evaluate((el: HTMLInputElement, value: string) => {
                      el.removeAttribute('disabled');
                      el.focus();
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                      setter?.call(el, value);
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                      el.dispatchEvent(new Event('blur', { bubbles: true }));
                    }, val);
                    await page.waitForTimeout(800);
                  }
                };

                const setOverlayNumberInput = async (formControlName: string, val: string) => {
                  const inputEl = overlay.locator(`p-inputnumber[formcontrolname="${formControlName}"] input, input[formcontrolname="${formControlName}"]`).first();
                  if (await inputEl.isVisible().catch(() => false)) {
                    await inputEl.click({ force: true });
                    await inputEl.evaluate((el: HTMLInputElement, value: string) => {
                      el.removeAttribute('disabled');
                      el.focus();
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                      setter?.call(el, value);
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                      el.dispatchEvent(new Event('blur', { bubbles: true }));
                    }, val);
                    await page.waitForTimeout(800);
                  }
                };

                const changeOverlayDropdown = async (formControlName: string, optionText: string) => {
                  const dd = overlay.locator(`p-dropdown[formcontrolname="${formControlName}"]`).first();
                  if (await dd.isVisible().catch(() => false)) {
                    await dd.click({ force: true });
                    await page.waitForTimeout(500);
                    const opt = page.locator('.p-dropdown-panel .p-dropdown-item, .p-dropdown-panel [role="option"]')
                      .filter({ hasText: new RegExp(`^${optionText}$`, 'i') }).first();
                    if (await opt.isVisible().catch(() => false)) {
                      await opt.click({ force: true });
                    } else {
                      await page.keyboard.press('Escape');
                    }
                    await page.waitForTimeout(800);
                  }
                };

                const setOverlayCheckbox = async (formControlName: string, targetState: boolean) => {
                  const cb = overlay.locator(`p-checkbox[formcontrolname="${formControlName}"]`).first();
                  if (await cb.isVisible().catch(() => false)) {
                    const inputEl = cb.locator('input[type="checkbox"]').first();
                    const isChecked = await inputEl.evaluate((el: HTMLInputElement) => el.checked).catch(() => false);
                    if (isChecked !== targetState) {
                      const box = cb.locator('.p-checkbox-box').first();
                      await box.click({ force: true });
                      await page.waitForTimeout(800);
                    }
                  }
                };

                // 1. Configure General properties inside overlay
                await setOverlayTextInput('headerText', 'Country Custom');
                await changeOverlayDropdown('textAlign', 'Center');
                await setOverlayNumberInput('width', '120');

                // 2. Expand and configure Header Settings accordion inside overlay
                const headerSettingsTab = overlay.locator('p-accordiontab').filter({ hasText: 'Header Settings' }).first();
                const headerLink = headerSettingsTab.locator('a.p-accordion-header-link').first();
                if (await headerLink.isVisible().catch(() => false)) {
                  await headerLink.click({ force: true });

                  // Wait for text color to be visible
                  const headerTextColor = headerSettingsTab.locator('input[formcontrolname="headerTextColor"]').first();
                  await headerTextColor.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });

                  await changeOverlayDropdown('headerTextAlign', 'Center');
                  await changeOverlayDropdown('headerVerticalAlign', 'Middle');
                  await setOverlayTextInput('headerTextColor', '#ff0000');
                  await setOverlayTextInput('headerBackgroundColor', '#e2e8f0');
                  await setOverlayNumberInput('headerFontSize', '14');
                  await changeOverlayDropdown('headerFontWeight', 'Bold');
                  await changeOverlayDropdown('headerFontStyle', 'Italic');
                }

                // 3. Expand and configure Format Value accordion inside overlay
                const formatValueTab = overlay.locator('p-accordiontab').filter({ hasText: 'Format Value' }).first();
                const formatLink = formatValueTab.locator('a.p-accordion-header-link').first();
                if (await formatLink.isVisible().catch(() => false)) {
                  await formatLink.click({ force: true });

                  // Wait for decimals to be visible
                  const decimalPlaces = formatValueTab.locator('p-inputnumber[formcontrolname="decimalPlaces"] input').first();
                  await decimalPlaces.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });

                  await setOverlayNumberInput('decimalPlaces', '2');
                  await setOverlayTextInput('beforeSymbol', '$');
                  await setOverlayTextInput('afterSymbol', 'USD');
                  await setOverlayCheckbox('thousandSeparator', true);
                  await setOverlayCheckbox('isPercent', true);
                }

                await page.screenshot({ path: 'screenshots/viz-04-column-settings-configured.png', fullPage: true }).catch(() => { });
                console.log('First Table Widget: Configured column properties (General, Header Settings, Format Value).');

                // Blur any active element inside the overlay to release input focus
                await page.evaluate(() => {
                  const activeEl = document.activeElement as HTMLElement;
                  if (activeEl) activeEl.blur();
                });
                await page.waitForTimeout(500);

                // Close overlay panel by clicking a neutral space on the empty canvas grid (safe coordinates)
                const canvas = page.locator('.canvas-layout-container').first();
                if (await canvas.isVisible().catch(() => false)) {
                  await canvas.click({ force: true, position: { x: 500, y: 500 } });
                  await page.waitForTimeout(1000);
                }

                if (await overlay.isVisible().catch(() => false)) {
                  await page.keyboard.press('Escape');
                  await page.waitForTimeout(1000);
                }

                // Assert that the overlay is closed
                await expect(overlay).not.toBeVisible({ timeout: 5000 });

                // Re-select the table widget to restore properties sidebar
                const widgetHeader = page.locator('.widget-header, app-aiv-viz-widget').first();
                await widgetHeader.click({ force: true });
                await page.waitForTimeout(2000);
              }
            }
          }
        }
        // Open the formatting/style panel using .fa-hammer-brush
        console.log('First Table Widget: Opening global formatting (brush) panel...');
        const brushBtn = page.locator('.fa-hammer-brush').first();
        await expect(brushBtn).toBeVisible({ timeout: 10000 });
        await brushBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/viz-05-formatting-open.png', fullPage: true }).catch(() => { });

        // Assert that the global formatting accordion tab header is visible (confirms brush panel is open)
        const tableSettingsHeader = page.locator('.p-accordion-header, p-accordiontab, [role="tab"]').filter({ hasText: 'Table Settings' }).filter({ has: page.locator('visible=true') }).first();
        await expect(tableSettingsHeader).toBeVisible({ timeout: 10000 });

        // Helpers for interacting with formatting components with sequential timeouts and model dispatching
        const setSwitch = async (tabLocator: any, label: string, targetState: boolean) => {
          const sw = tabLocator.locator('p-inputswitch').filter({ hasText: label }).first();
          if (await sw.isVisible().catch(() => false)) {
            const inputEl = sw.locator('input[type="checkbox"]');
            const isChecked = (await sw.locator('.p-inputswitch-checked').isVisible().catch(() => false)) ||
              (await inputEl.getAttribute('aria-checked').catch(() => 'false')) === 'true';

            if (isChecked !== targetState) {
              await sw.locator('.p-inputswitch-slider').click({ force: true });
              await page.waitForTimeout(800); // Wait after property modification
            }
          }
        };

        const changeDropdown = async (tabLocator: any, labelContains: string, optionText: string) => {
          const dd = tabLocator.locator('p-dropdown').filter({ hasText: new RegExp(labelContains, 'i') }).first();
          if (await dd.isVisible().catch(() => false)) {
            await dd.click({ force: true });
            await page.waitForTimeout(500);
            const opt = page.locator('.p-dropdown-panel .p-dropdown-item, .p-dropdown-panel [role="option"]')
              .filter({ hasText: new RegExp(`^${optionText}$`, 'i') }).first();
            if (await opt.isVisible().catch(() => false)) {
              await opt.click({ force: true });
            } else {
              await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(800); // Wait after property modification
          }
        };

        const setNumberInput = async (inputLocator: any, val: string) => {
          if (await inputLocator.isVisible().catch(() => false)) {
            await inputLocator.click({ force: true });
            await inputLocator.evaluate((el: HTMLInputElement, value: string) => {
              el.removeAttribute('disabled');
              el.focus();
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
              setter?.call(el, value);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }, val);
            await page.waitForTimeout(800); // Wait after property modification
          }
        };

        const setColorInput = async (inputLocator: any, val: string) => {
          if (await inputLocator.isVisible().catch(() => false)) {
            await inputLocator.click({ force: true });
            await inputLocator.evaluate((el: HTMLInputElement, value: string) => {
              el.removeAttribute('disabled');
              el.focus();
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
              setter?.call(el, value);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }, val);
            await page.waitForTimeout(800); // Wait after property modification
          }
        };

        // --- 1. Expand and explore Table Settings ---
        console.log('First Table Widget: Configuring Table Settings...');
        await expect(tableSettingsHeader).toBeVisible({ timeout: 5000 });
        await tableSettingsHeader.click({ force: true });
        await page.waitForTimeout(1500);

        const activeSectionTable = page.locator('.p-accordion-tab-active, .p-toggleable-content').filter({ has: page.locator('visible=true') }).first();
        const rowHeightInput = activeSectionTable.locator('input.p-inputnumber-input').first();
        await expect(rowHeightInput).toBeVisible({ timeout: 5000 });

        // Set switches in Table Settings
        await setSwitch(activeSectionTable, 'Sorting', true);
        await setSwitch(activeSectionTable, 'Multisorting', true);
        await setSwitch(activeSectionTable, 'Resizing', true);
        await setSwitch(activeSectionTable, 'Reordering', true);
        await setSwitch(activeSectionTable, 'Filtering', true);
        await setSwitch(activeSectionTable, 'Hide Scrollbar', false);
        await setSwitch(activeSectionTable, 'Auto Size', false);
        await setSwitch(activeSectionTable, 'Pagination', true);
        await setSwitch(activeSectionTable, 'Text Wrap', true);

        // Select Dropdowns in Table Settings
        await changeDropdown(activeSectionTable, 'Auto Size Strategy', 'Fit Cells');
        await changeDropdown(activeSectionTable, 'Wrap Mode', 'Both');
        await changeDropdown(activeSectionTable, 'Grid Lines', 'Both');

        // Set Row Height spinner input
        await setNumberInput(rowHeightInput, '28');

        await page.screenshot({ path: 'screenshots/viz-06-formatting-table-settings.png', fullPage: true }).catch(() => { });
        console.log('First Table Widget: Table Settings configured.');

        // --- 2. Expand and explore Header Settings ---
        console.log('First Table Widget: Configuring Header Settings...');
        const headerSettingsHeader = page.locator('.p-accordion-header, p-accordiontab, [role="tab"]').filter({ hasText: 'Header Settings' }).filter({ has: page.locator('visible=true') }).first();
        await expect(headerSettingsHeader).toBeVisible({ timeout: 5000 });
        await headerSettingsHeader.click({ force: true });
        await page.waitForTimeout(1500);

        const activeSectionHeader = page.locator('.p-accordion-tab-active, .p-toggleable-content').filter({ has: page.locator('visible=true') }).first();
        const headerHeightInput = activeSectionHeader.locator('input.p-inputnumber-input').first();
        await expect(headerHeightInput).toBeVisible({ timeout: 5000 });

        // Explicitly show header
        await setSwitch(activeSectionHeader, 'Hide Header', false);

        // Set Header Height and Font Size spinner inputs
        const headerFontSizeInput = activeSectionHeader.locator('input.p-inputnumber-input').nth(1);
        await setNumberInput(headerHeightInput, '32');
        await setNumberInput(headerFontSizeInput, '13');

        // Select Dropdowns in Header Settings
        await changeDropdown(activeSectionHeader, 'Font weight', 'Bold');
        await changeDropdown(activeSectionHeader, 'Font Style', 'Italic');

        // Set Color inputs in Header Settings (distinct from default #666666 and #ffffff)
        const colors = activeSectionHeader.locator('input.w-12');
        await setColorInput(colors.nth(0), '#f7fafc'); // Text Color
        await setColorInput(colors.nth(1), '#1e3a5f'); // Background Color

        await page.screenshot({ path: 'screenshots/viz-07-formatting-header-settings.png', fullPage: true }).catch(() => { });
        console.log('First Table Widget: Header Settings configured.');

        // --- 3. Expand and explore Body Settings ---
        console.log('First Table Widget: Configuring Body Settings...');
        const bodySettingsHeader = page.locator('.p-accordion-header, p-accordiontab, [role="tab"]').filter({ hasText: 'Body Settings' }).filter({ has: page.locator('visible=true') }).first();
        await expect(bodySettingsHeader).toBeVisible({ timeout: 5000 });
        await bodySettingsHeader.click({ force: true });
        await page.waitForTimeout(1500);

        const activeSectionBody = page.locator('.p-accordion-tab-active, .p-toggleable-content').filter({ has: page.locator('visible=true') }).first();
        const bodyFontSizeInput = activeSectionBody.locator('input.p-inputnumber-input').first();
        await expect(bodyFontSizeInput).toBeVisible({ timeout: 5000 });

        // Set Body Font Size
        await setNumberInput(bodyFontSizeInput, '11');

        // Set Color inputs in Body Settings
        const bodyColors = activeSectionBody.locator('input.w-12');
        await setColorInput(bodyColors.nth(0), '#fafafa'); // Background Color (default #ffffff)
        await setColorInput(bodyColors.nth(1), '#dddddd'); // Row Border Color (default #e5e5e5)
        await setColorInput(bodyColors.nth(2), '#cccccc'); // Column Border Color (default #e5e5e5)
        await setColorInput(bodyColors.nth(3), '#f1f5f9'); // Even Row Background Color (default #f9f9f9)
        await setColorInput(bodyColors.nth(4), '#0f172a'); // Even Row Font Color (default #333333)
        await setColorInput(bodyColors.nth(5), '#f8fafc'); // Odd Row Background Color (default #ffffff)
        await setColorInput(bodyColors.nth(6), '#1e293b'); // Odd Row Font Color (default #333333)
        await setColorInput(bodyColors.nth(7), '#e2e8f0'); // Pagination Background Color (default transparent)
        await setColorInput(bodyColors.nth(8), '#0f172a'); // Pagination Font Color (default #333333)

        await page.screenshot({ path: 'screenshots/viz-08-formatting-body-settings.png', fullPage: true }).catch(() => { });
        console.log('First Table Widget: Body Settings configured.');

        // Added conditional formatting after default formatting completed
        await page.locator('.p-element.fa-light.fa-diagram-next').click();
        await page.locator('.p-element.p-button.p-button-text.p-button-sm.p-1').first().click();

        await page.getByRole('textbox', { name: 'Enter column name' }).fill('testing1');

        await page.getByText('Select a style type').click();

        await page.locator('div').filter({ hasText: /^Circle$/ }).click();

        // Click 'Show Value' switch inside the dialog
        await page.locator('[role="dialog"] p-inputswitch, mat-dialog-container p-inputswitch').first().click();

        await page.locator('p-dropdown').filter({ hasText: 'Select column' }).getByRole('button').click();
        await page.waitForTimeout(800);

        await page.locator('.p-dropdown-item, p-dropdownitem, [role="option"]').filter({ hasText: /^Country$/ }).first().click({ force: true });
        await page.waitForTimeout(800);

        await page.getByRole('textbox').nth(1).click();
        await page.getByRole('textbox').nth(1).fill('India');
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: 'Blue' }).click();
        await page.waitForTimeout(800);

        // Click on "Show Code"
        await page.getByRole('button', { name: /show code/i }).click();
        await page.waitForTimeout(10000);

        // Write custom SVG rendering function into Monaco editor
        const customSvgCode = `return \`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16">
  <rect width="24" height="5.33" fill="#FF9933"/>
  <rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/>
  <rect y="10.66" width="24" height="5.34" fill="#138808"/>
  <circle cx="12" cy="8" r="1.6" fill="none" stroke="#000080" stroke-width="0.2"/>
  <circle cx="12" cy="8" r="0.15" fill="#000080"/>
  \\\${Array.from({length:24},(_,i)=>{
      const a=i*Math.PI/12;
      return \\\`<line x1="12" y1="8" x2="\\\${12+1.6*Math.cos(a)}" y2="\\\${8+1.6*Math.sin(a)}" stroke="#000080" stroke-width="0.1"/>\\\`;
  }).join("")}
</svg>\`;`;

        const editorTextarea = page.locator('[role="dialog"] .monaco-editor textarea, [role="dialog"] textarea').first();
        await expect(editorTextarea).toBeVisible({ timeout: 10000 });
        await editorTextarea.click({ force: true });
        await page.waitForTimeout(500);

        // Select all existing text and delete it
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('Delete');
        await page.waitForTimeout(500);

        // Insert the custom SVG code
        await page.keyboard.insertText(customSvgCode);
        await page.waitForTimeout(1000);

        // Click "Run Script"
        await page.getByRole('button', { name: /run script/i }).click();
        await page.waitForTimeout(1500);

        // Verify that the India flag (SVG with specific saffron fill color) is rendered in the Script Results
        const flagSvg = page.locator('svg').filter({ has: page.locator('rect[fill="#FF9933"]') }).first();
        await expect(flagSvg, 'India Flag SVG should be visible in Script Results').toBeVisible({ timeout: 5000 });
        await page.screenshot({ path: 'screenshots/viz-08c-india-flag-script-result.png', fullPage: true }).catch(() => { });

        // Click "Create Conditional Column" or "Update Column" to submit
        const submitBtn = page.getByRole('button', { name: /Create Conditional Column|Update Column/i }).first();
        await expect(submitBtn).toBeVisible({ timeout: 5000 });
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // Configure conditional formatting properties
        await page.locator('li:nth-child(2) > .p-element.p-button').click();
        await page.locator('.p-inputswitch.p-component.p-focus > .p-inputswitch-slider').click();
        await page.locator('p-dropdown').filter({ hasText: 'Row' }).getByLabel('dropdown trigger').click();
        await page.getByRole('option', { name: 'Column' }).click();
        await page.locator('p-dropdown').filter({ hasText: 'Select column' }).getByRole('button').click();
        await page.getByRole('option', { name: 'Profit' }).click();
        await page.getByRole('button', { name: 'dropdown trigger' }).nth(2).click();
        await page.getByRole('option', { name: 'Bold', exact: true }).click();
        await page.getByRole('button', { name: 'dropdown trigger' }).nth(3).click();
        await page.getByRole('option', { name: 'Italic' }).click();
        await page.getByRole('button', { name: 'dropdown trigger' }).nth(4).click();
        await page.getByRole('option', { name: 'Country' }).click();
        await page.getByRole('textbox').nth(4).click();
        await page.getByRole('textbox').nth(4).fill('USA');
        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForTimeout(2000);

        // Target the icon, then click its parent button
        const customColumnBuilderBtn = page.locator('button[tooltipposition="left"]:has(i.fa-grid-2-plus)');
        await expect(customColumnBuilderBtn).toBeVisible();
        await customColumnBuilderBtn.click();
        await expect(page.getByText('Custom Column').first()).toBeVisible();
        await page.getByRole('button').first().click();
  await page.getByRole('textbox', { name: 'e.g. Create a column that' }).fill('Show "High" if Revenue is greater than 150000, otherwise show "Low"\n');
  await page.getByRole('button', { name: 'Ask AI' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
          await page.waitForTimeout(5000);

          // Drag the created "Custom" column into the Columns zone
          console.log('First Table Widget: Dragging "Custom" column into Columns...');
          const customColumnSource = page.locator('li.aiv-custom-column').first();
          await expect(customColumnSource).toBeVisible({ timeout: 10000 });

          const columnsTarget = page.locator('.aiv-viz-column-list li.cdk-drag').last();
          await expect(columnsTarget).toBeVisible({ timeout: 10000 });

          const sourceBox = await customColumnSource.boundingBox();
          const targetBox = await columnsTarget.boundingBox();
          if (sourceBox && targetBox) {
            await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
            await page.mouse.up();
          }          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'screenshots/viz-08d-custom-column-dragged.png', fullPage: true }).catch(() => {});
           // Click "Add/Edit Custom Measure" button (which has the fa-calendar-circle-plus icon)
          console.log('First Table Widget: Clicking "Add/Edit Custom Measure" button...');
          const customMeasureBtn = page.locator('button[tooltipposition="left"]:has(i.fa-calendar-circle-plus)').first();
          await expect(customMeasureBtn).toBeVisible({ timeout: 10000 });
          await customMeasureBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'screenshots/viz-08e-custom-measure-dialog-open.png', fullPage: true }).catch(() => {});

          // Click Cancel to close the Measure dialog
          console.log('First Table Widget: Closing Measure dialog...');
          const cancelBtn = page.getByRole('button', { name: 'Cancel' }).first();
          await expect(cancelBtn).toBeVisible({ timeout: 10000 });
          await cancelBtn.click();
          await page.waitForTimeout(2000);
      } 
      

      // Close properties panel
      console.log('First Table Widget: Closing properties panel...');
      const closePanelBtn = page.locator('button:has-text("Close"), button:has-text("Apply"), app-widget-properties .fa-times, .fa-times').first();
      if (await closePanelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closePanelBtn.click({ force: true });
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(2000);
      console.log('First Table Widget: Configuration complete.');

      // ── Property Audit for First Table Widget ──
      console.log('First Table Widget: Performing DOM Property Audit...');
      const auditResults = await page.evaluate(() => {
        const results = [];
        
        // Find all table/grid widgets on the canvas
        const tableWidgets = Array.from(document.querySelectorAll('app-aiv-viz-widget, .widget-container, .widget-transform'));
        if (tableWidgets.length === 0) {
          return [{ property: 'Widgets check', expected: 'At least 1 table widget', actual: '0 widgets found', working: false }];
        }
        
        // Inspect the first table widget
        const widget = tableWidgets[0];
        
        // Find all column headers
        const headers = Array.from(widget.querySelectorAll('th, .p-column-title, .ag-header-cell, [role="columnheader"]'));
        const headerTexts = headers.map(h => h.textContent?.trim() || '');
        
        // 1. Header Text Customization
        const customHeaderExists = headerTexts.some(txt => txt.includes('Country Custom'));
        results.push({
          property: 'headerText (Country Custom)',
          expected: 'Country Custom',
          actual: headerTexts.join(', '),
          working: customHeaderExists
        });
        
        // Find the Country Custom header element to check its styles
        const countryHeader = headers.find(h => {
          const txt = (h.textContent || '').trim();
          return txt.includes('Country Custom') || txt.includes('Country');
        });
        if (countryHeader) {
          const computed = window.getComputedStyle(countryHeader);
          
          // Helper to compare RGB colors
          const compareColors = (computedVal: string, hexVal: string) => {
            const temp = document.createElement('div');
            temp.style.color = hexVal;
            document.body.appendChild(temp);
            const expectedRgb = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            return computedVal === expectedRgb;
          };
          
          // 2. Header Text Color
          results.push({
            property: 'headerTextColor (Country Column)',
            expected: '#ff0000',
            actual: computed.color,
            working: compareColors(computed.color, '#ff0000')
          });
          
          // 3. Header Background Color
          results.push({
            property: 'headerBackgroundColor (Country Column)',
            expected: '#e2e8f0',
            actual: computed.backgroundColor,
            working: compareColors(computed.backgroundColor, '#e2e8f0')
          });
          
          // 4. Header Font Size
          results.push({
            property: 'headerFontSize (Country Column)',
            expected: '14px',
            actual: computed.fontSize,
            working: computed.fontSize === '14px' || computed.fontSize === '14'
          });
          
          // 5. Header Font Weight
          results.push({
            property: 'headerFontWeight (Country Column)',
            expected: 'bold',
            actual: computed.fontWeight,
            working: computed.fontWeight === 'bold' || computed.fontWeight === '700'
          });
          
          // 6. Header Font Style
          results.push({
            property: 'headerFontStyle (Country Column)',
            expected: 'italic',
            actual: computed.fontStyle,
            working: computed.fontStyle === 'italic'
          });
        }
        
        // Check global Table properties: row height, fonts
        const rows = Array.from(widget.querySelectorAll('tr, .ag-row, [role="row"]')).filter(r => !r.querySelector('th'));
        if (rows.length > 0) {
          const firstRow = rows[0];
          const cells = Array.from(firstRow.querySelectorAll('td, .ag-cell, [role="gridcell"]'));
          
          // 7. Row Height
          const rowHeight = firstRow.getBoundingClientRect().height;
          results.push({
            property: 'rowHeight',
            expected: '28px',
            actual: `${rowHeight}px`,
            working: Math.abs(rowHeight - 28) <= 2
          });
          
          if (cells.length > 0) {
            const cellComputed = window.getComputedStyle(cells[0]);
            
            // 8. Body Font Size
            results.push({
              property: 'bodyFontSize',
              expected: '11px',
              actual: cellComputed.fontSize,
              working: cellComputed.fontSize === '11px' || cellComputed.fontSize === '11'
            });
            
            // 9. Body Background Color
            const isBgColorDefault = cellComputed.backgroundColor === 'rgba(0, 0, 0, 0)' || cellComputed.backgroundColor === 'transparent' || cellComputed.backgroundColor === 'rgb(255, 255, 255)';
            results.push({
              property: 'bodyBackgroundColor',
              expected: '#fafafa',
              actual: cellComputed.backgroundColor,
              working: !isBgColorDefault
            });
          }
        }
        
        // Check formatting symbols (dollar symbol, USD suffix, decimal places)
        const allCells = Array.from(widget.querySelectorAll('td, .ag-cell, [role="gridcell"]'));
        const cellTexts = allCells.map(c => c.textContent?.trim() || '');
        const hasFormattedValue = cellTexts.some(txt => txt.includes('$') || txt.includes('USD') || txt.includes('%'));
        results.push({
          property: 'Format Value ($, USD, %, 2 decimals)',
          expected: 'Values containing $, USD or %',
          actual: cellTexts.slice(0, 5).join(', '),
          working: hasFormattedValue
        });
        
        return results;
      });

      console.log('\n' + '═'.repeat(60));
      console.log('📋 First Table Widget Property Audit (DOM computed styles)');
      console.log('═'.repeat(60));
      for (const res of auditResults) {
        const workingStr = res.working ? '✓ WORKING' : '✗ NOT WORKING';
        console.log(`Property: ${res.property}`);
        console.log(`  Expected: ${res.expected}`);
        console.log(`  Actual:   ${res.actual}`);
        console.log(`  Status:   ${workingStr}`);
        console.log('─'.repeat(60));
      }
      console.log('\n');

      // ── Add a second Table widget with Advance Configuration ─────────────
      // Re-open widget sidebar if needed
      if (!await page.getByTitle('Tables').isVisible({ timeout: 1500 }).catch(() => false)) {
        const sidebarBtn2 = page.getByRole('button', { name: 'Sidebar', exact: true })
          .or(page.locator('button').filter({ hasText: /^Sidebar$/ })).first();
        if (await sidebarBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sidebarBtn2.click();
          await page.waitForTimeout(1000);
        }
      }

      const tableTile2 = page.getByTitle('Tables').first();
      if (await tableTile2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tableTile2.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screenshots/viz-10-second-table-added.png', fullPage: true }).catch(() => { });

        // ── Step 1: Click Advance Configuration ──────────────────────────
        const advanceConfigDiv2 = page.locator('div').filter({ hasText: /^Advance Configuration$/ }).first();
        if (await advanceConfigDiv2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await advanceConfigDiv2.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/viz-10b-second-table-advance-config.png', fullPage: true }).catch(() => { });
        }

        // ── Step 2: Click Edit button ─────────────────────────────────────
        const editBtn2 = page.getByRole('button', { name: 'Edit' }).first();
        if (await editBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await editBtn2.click();
          await page.waitForTimeout(1500);

          // ── Step 3: Open dataset dropdown via dropdown trigger button ─────
          const dropdownTrigger2 = page.locator('app-get-data-api')
            .getByRole('button', { name: 'dropdown trigger' });
          if (await dropdownTrigger2.isVisible({ timeout: 5000 }).catch(() => false)) {
            await dropdownTrigger2.click();
            await page.waitForTimeout(1000);

            // ── Step 4: Search for dataset ──────────────────────────────────
            const searchBox2 = page.getByRole('textbox', { name: 'Search by name or type' });
            if (await searchBox2.isVisible({ timeout: 5000 }).catch(() => false)) {
              await searchBox2.fill('autom');
              await page.waitForTimeout(1000);

              // ── Step 5: Select automation_testing dataset ───────────────────
              const option2 = page.getByLabel('automation_testing').getByText('automation_testing.ds');
              if (await option2.isVisible({ timeout: 5000 }).catch(() => false)) {
                await option2.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'screenshots/viz-12-second-table-dataset.png', fullPage: true }).catch(() => { });

                // ── Step 6: Click the Select All checkbox (.p-checkbox-box) ──
                const selectAllCheckbox2 = page.locator('.p-checkbox-box').first();
                if (await selectAllCheckbox2.isVisible({ timeout: 5000 }).catch(() => false)) {
                  await selectAllCheckbox2.click();
                  await page.waitForTimeout(2000);
                  await page.screenshot({ path: 'screenshots/viz-13-second-table-columns.png', fullPage: true }).catch(() => { });
                }
              }
            }
          }
        }
      }

      // ── Clean up after second widget: close panel, deselect, ready for preset loop ──
      {
        const cp2 = page.getByRole('button', { name: 'Close Properties Panel' });
        if (await cp2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cp2.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.locator('app-widget-properties').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(2000);
      }

      // ════════════════════════════════════════════════════════════════════════
      // SHARED HELPERS FOR ALL 20 TABLE WIDGETS
      // ════════════════════════════════════════════════════════════════════════

      /** Escape special regex metacharacters in a literal string. */
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      /** Open the widget sidebar if the Tables tile isn't already visible.
       *  Uses the action-bar settings button: .p-element.action-bar-btn.action-bar-btn-settings */
      const ensureSidebarOpen = async () => {
        // Already open if the Tables tile is visible — nothing to do
        if (await page.getByTitle('Tables').isVisible({ timeout: 1500 }).catch(() => false)) return;
        // Click the sidebar toggle button
        const sidebarBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-settings');
        await expect(sidebarBtn, 'Sidebar settings button must be present').toBeVisible({ timeout: 10000 });
        await sidebarBtn.click();
        await page.waitForTimeout(1000);
        // Confirm Tables tile is now accessible
        await expect(page.getByTitle('Tables'), 'Tables tile must appear after opening sidebar').toBeVisible({ timeout: 10000 });
      };

      /** Close the properties panel and deselect any widget so the canvas is clean. */
      const closePropertiesPanel = async () => {
        const closeBtn = page.getByRole('button', { name: 'Close Properties Panel' });
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape').catch(() => { });
        }
        await page.locator('app-widget-properties').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);
      };

      /** Shared dataset-binding steps: dropdown → search → select → checkbox.
       *  Each helper must click "Edit" button before calling this. */
      const bindDataset = async () => {
        // Step 1: Check if columns already exist and remove them first
        const existingColumns = page.locator('li.cdk-drag').filter({ has: page.locator('i.fa-times, i.fa-close, button .fa-times') });
        const columnCount = await existingColumns.count();
        
        if (columnCount > 0) {
          console.log(`Found ${columnCount} existing columns — removing all before binding dataset`);
          // Click the × button on each column to remove it
          for (let i = columnCount - 1; i >= 0; i--) {
            const removeBtn = existingColumns.nth(i).locator('i.fa-times, i.fa-close, button .fa-times').first();
            await removeBtn.click();
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(800);
        }

        // Step 2: Open dataset dropdown and select automation_testing
        // First close any open dropdown/overlay that might interfere
        const openDropdownPanel = page.locator('.p-dropdown-panel');
        if (await openDropdownPanel.isVisible({ timeout: 500 }).catch(() => false)) {
          await page.keyboard.press('Escape').catch(() => { });
          await page.waitForTimeout(400);
        }

        const ddTrigger = page.locator('app-get-data-api').getByRole('button', { name: 'dropdown trigger' });
        await expect(ddTrigger, 'Dataset dropdown trigger must be visible').toBeVisible({ timeout: 10000 });
        await ddTrigger.click();
        await page.waitForTimeout(800);

        // Log all available datasets in dropdown before search
        const datasetOptions = await page.locator('.p-dropdown-panel .p-dropdown-item, .p-dropdown-panel [role="option"]').allTextContents().catch(() => []);
        console.log('[Dataset Binding] Available Datasets in dropdown before searching:', datasetOptions.map(t => t.trim()).filter(Boolean));

        const searchBox = page.getByRole('textbox', { name: 'Search by name or type' });
        await expect(searchBox, 'Dataset search box must be visible').toBeVisible({ timeout: 10000 });
        await searchBox.fill('autom');
        await page.waitForTimeout(800);

        const dsOption = page.getByLabel('automation_testing').getByText('automation_testing.ds');
        await expect(dsOption, 'automation_testing.ds option must appear in search results').toBeVisible({ timeout: 10000 });
        await dsOption.click();
        await page.waitForTimeout(1500);

        // Log all available columns before binding
        const columnList = await page.locator('p-checkbox .p-checkbox-label, li.cdk-drag, .cdk-drag label').allTextContents().catch(() => []);
        console.log('[Dataset Binding] Available Columns before binding:', columnList.map(t => t.trim()).filter(Boolean));

        // Step 3: Select All columns
        const selectAllBox = page.locator('.p-checkbox-box').first();
        await expect(selectAllBox, 'Select All checkbox must be visible').toBeVisible({ timeout: 10000 });
        await selectAllBox.click();
        await page.waitForTimeout(1500);
      };

      // ════════════════════════════════════════════════════════════════════════
      // ════════════════════════════════════════════════════════════════════════
      // JSON EDITOR HELPER
      // Opens the maximized "Table Conditional Options – JSON" dialog,
      // merges column + root-level properties, clicks ✓ to apply, then closes.
      // ════════════════════════════════════════════════════════════════════════
      const editJsonProperties = async (widgetLabel: string) => {
        // 1. Click the Maximize button (confirmed locator from recorded steps)
        const maximizeBtn = page.locator('.flex.align-items-center.justify-content-end > .p-element').first();
        await expect(maximizeBtn, 'Maximize button must be visible').toBeVisible({ timeout: 10000 });
        await maximizeBtn.click();
        await page.waitForTimeout(1200);

        // 2. Wait for the "Table Conditional Options – JSON" dialog
        const dialog = page.locator('.p-dialog, [role="dialog"]').filter({ hasText: 'JSON' }).first();
        await expect(dialog, 'JSON dialog must open after Maximize').toBeVisible({ timeout: 10000 });

        // 3. Read current JSON via Monaco editor API
        const rawText = await page.evaluate(() => {
          // Monaco exposes editor instances via window.monaco
          const editors = (window as any).monaco?.editor?.getModels?.() || [];
          if (editors.length > 0) return editors[editors.length - 1].getValue();
          // Fallback: read from hidden textarea that Monaco keeps in sync
          const ta = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
          return ta?.value || '{}';
        }).catch(() => '{}');

        let json: any = {};
        try { json = JSON.parse(rawText); } catch { json = {}; }

        // 4. Add/edit column properties on each column in columns[]
        const colProps = {
          // ── Sizing ──────────────────────────────────────────────────────
          width: 120,
          minWidth: 80,
          maxWidth: 300,

          // ── General ─────────────────────────────────────────────────────
          headerText: 'Col',          // overridden per-column below
          textAlign: 'center',
          verticalAlign: 'middle',
          frozen: false,
          hidden: false,
          sortable: true,
          resizable: true,
          reorderable: true,

          // ── Cell styling ─────────────────────────────────────────────────
          color: '#1e293b',           // cell font color
          backgroundColor: '#ffffff', // cell background color
          fontSize: 13,
          fontWeight: 'normal',
          fontStyle: 'normal',
          cellPaddingTop: 4,
          cellPaddingBottom: 4,
          cellPaddingLeft: 8,
          cellPaddingRight: 8,

          // ── Header styling ───────────────────────────────────────────────
          headerTextAlign: 'center',
          headerVerticalAlign: 'middle',
          headerTextColor: '#ff0000',
          headerBackgroundColor: '#e2e8f0',
          headerFontSize: 14,
          headerFontWeight: 'bold',
          headerFontStyle: 'italic',
          headerHeight: 36,

          // ── Format Value ─────────────────────────────────────────────────
          decimalPlaces: 2,
          beforeSymbol: '$',
          afterSymbol: 'USD',
          thousandSeparator: true,
          isPercent: false,
          multiplier: 1,

          // ── Conditional / visual indicators ─────────────────────────────
          showBar: false,
          barColor: '#4f86c6',
          barMaxValue: 100,
          showSparkline: false,
          sparklineColor: '#4f86c6',
          wrapText: false,
          ellipsis: true,
        };

        if (Array.isArray(json.columns) && json.columns.length > 0) {
          json.columns = json.columns.map((col: any, i: number) => ({
            ...col,
            ...colProps,
            headerText: col.label || col.key || col.headerText || `Col ${i + 1}`,
          }));
        } else {
          // No columns array — merge at root
          Object.assign(json, colProps);
        }

        // 5. Edit/add root-level table properties — all properties, working and non-working
        // ── Behaviour ────────────────────────────────────────────────────
        json.sortable          = true;
        json.resizable         = true;
        json.reorderable       = true;
        json.searchable        = true;
        json.filterable        = true;
        json.paginated         = true;
        json.pageSize          = 10;
        json.pageSizeOptions   = [5, 10, 25, 50];
        json.multiSort         = true;
        json.selectionMode     = 'single';

        // ── Appearance ────────────────────────────────────────────────────
        json.compact           = false;
        json.striped           = true;
        json.hover             = true;
        json.bordered          = true;
        json.showGridLines     = true;
        json.rowHeight         = 36;
        json.headerHeight      = 40;

        // ── Colors / theme ────────────────────────────────────────────────
        json.headerBackgroundColor  = '#1e3a5f';
        json.headerTextColor        = '#ffffff';
        json.rowBackgroundColor     = '#ffffff';
        json.altRowBackgroundColor  = '#f1f5f9';
        json.rowTextColor           = '#1e293b';
        json.borderColor            = '#e2e8f0';
        json.hoverBackgroundColor   = '#dbeafe';

        // ── Dimensions ───────────────────────────────────────────────────
        json.width             = '100%';
        json.height            = 400;
        json.scrollHeight      = 350;

        // ── Group config (when present) ───────────────────────────────────
        if (json.groupConfig) {
          json.groupConfig.expandAll      = true;
          json.groupConfig.showGroupCount = true;
        }

        const newJson = JSON.stringify(json, null, 2);

        // 6. Write new JSON into Monaco editor
        await page.evaluate((value: string) => {
          // Preferred: use Monaco model directly
          const models = (window as any).monaco?.editor?.getModels?.() || [];
          if (models.length > 0) {
            models[models.length - 1].setValue(value);
            return;
          }
          // Fallback: focus textarea, select all, paste
          const ta = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
          if (ta) {
            ta.focus();
            document.execCommand('selectAll');
            document.execCommand('insertText', false, value);
          }
        }, newJson);
        await page.waitForTimeout(800);

        // 7. Click the ✓ (checkmark) button to apply
        const applyBtn = dialog.locator('button').filter({ has: page.locator('.fa-check, .p-button-icon.pi-check') })
          .or(dialog.getByRole('button', { name: /apply|confirm|save/i }))
          .or(page.locator('.p-dialog-header button').nth(1))
          .first();
        await expect(applyBtn, '✓ Apply button must be visible in JSON dialog').toBeVisible({ timeout: 5000 });
        await applyBtn.click();
        await page.waitForTimeout(1000);

        // 8. Read back the JSON after apply — full property-level audit
        const appliedText = await page.evaluate(() => {
          const models = (window as any).monaco?.editor?.getModels?.() || [];
          if (models.length > 0) return models[models.length - 1].getValue();
          const ta = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
          return ta?.value || '{}';
        }).catch(() => '{}');

        let appliedJson: any = {};
        try { appliedJson = JSON.parse(appliedText); } catch { /* unparseable */ }

        // ── Root property audit ──────────────────────────────────────────
        const sentRootProps: Record<string, any> = {
          sortable: json.sortable,
          resizable: json.resizable,
          reorderable: json.reorderable,
          searchable: json.searchable,
          filterable: json.filterable,
          paginated: json.paginated,
          pageSize: json.pageSize,
          pageSizeOptions: json.pageSizeOptions,
          multiSort: json.multiSort,
          selectionMode: json.selectionMode,
          compact: json.compact,
          striped: json.striped,
          hover: json.hover,
          bordered: json.bordered,
          showGridLines: json.showGridLines,
          rowHeight: json.rowHeight,
          headerHeight: json.headerHeight,
          headerBackgroundColor: json.headerBackgroundColor,
          headerTextColor: json.headerTextColor,
          rowBackgroundColor: json.rowBackgroundColor,
          altRowBackgroundColor: json.altRowBackgroundColor,
          rowTextColor: json.rowTextColor,
          borderColor: json.borderColor,
          hoverBackgroundColor: json.hoverBackgroundColor,
          width: json.width,
          height: json.height,
          scrollHeight: json.scrollHeight,
        };

        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📋 JSON Property Audit: [${widgetLabel}]`);
        console.log(`${'─'.repeat(60)}`);
        console.log('ROOT PROPERTIES:');
        for (const [key, sentVal] of Object.entries(sentRootProps)) {
          const appliedVal = appliedJson[key];
          const exists     = key in appliedJson;
          const matches    = JSON.stringify(appliedVal) === JSON.stringify(sentVal);
          const status     = !exists ? '✗ DROPPED' : matches ? '✓ OK' : `⚠ CHANGED  sent=${JSON.stringify(sentVal)} got=${JSON.stringify(appliedVal)}`;
          console.log(`  ${key.padEnd(20)} ${status}`);
        }

        // ── Column property audit (first column only — representative) ───
        const sentColProps = colProps as Record<string, any>;
        if (Array.isArray(appliedJson.columns) && appliedJson.columns.length > 0) {
          const firstCol = appliedJson.columns[0];
          console.log(`\nCOLUMN PROPERTIES (column[0]: "${firstCol.key || firstCol.label || '?'}"):`);
          for (const [key, sentVal] of Object.entries(sentColProps)) {
            if (key === 'headerText') continue; // headerText is overridden per-column, skip
            const appliedVal = firstCol[key];
            const exists     = key in firstCol;
            const matches    = JSON.stringify(appliedVal) === JSON.stringify(sentVal);
            const status     = !exists ? '✗ DROPPED' : matches ? '✓ OK' : `⚠ CHANGED  sent=${JSON.stringify(sentVal)} got=${JSON.stringify(appliedVal)}`;
            console.log(`  ${key.padEnd(25)} ${status}`);
          }
          console.log(`\n  Total columns in applied JSON: ${appliedJson.columns.length}`);
        } else {
          console.log('\nCOLUMN PROPERTIES: no columns[] array in applied JSON');
        }
        console.log(`${'─'.repeat(60)}\n`);

        // Write property verification report to screenshot name for traceability
        await page.screenshot({ path: `screenshots/json-${widgetLabel.replace(/[^a-z0-9]+/gi, '_')}-applied.png`, fullPage: true }).catch(() => { });

        // 9. Close the dialog with the ✗ button or Escape
        const closeDialogBtn = dialog.locator('button').filter({ has: page.locator('.fa-times, .p-dialog-header-close-icon, .pi-times') })
          .or(dialog.getByRole('button', { name: /close/i }))
          .first();
        if (await closeDialogBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeDialogBtn.click();
        } else {
          await page.keyboard.press('Escape').catch(() => { });
        }
        await page.waitForTimeout(800);

        // 10. Assert dialog is closed
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      };

      // ════════════════════════════════════════════════════════════════════════
      // HELPER 1 — Default table widget (no type switching)
      // ════════════════════════════════════════════════════════════════════════
      const addDefaultTableWidget = async (idx: number) => {
        await test.step(`Widget ${idx}: Default Table`, async () => {
          console.log(`[Widget ${idx}: Default Table] Starting setup...`);
          await ensureSidebarOpen();
          await page.getByTitle('Tables').click();
          await page.waitForTimeout(1500);

          // Click Edit to open dataset properties panel
          const editBtn = page.getByRole('button', { name: 'Edit' }).first();
          await expect(editBtn, 'Edit button must be visible').toBeVisible({ timeout: 10000 });
          await editBtn.click();
          await page.waitForTimeout(1500);

          console.log(`[Widget ${idx}: Default Table] Binding dataset...`);
          await bindDataset();
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-Default-final.png`, fullPage: true }).catch(() => { });
          await closePropertiesPanel();
          console.log(`[Widget ${idx}: Default Table] Setup complete.`);
        });
      };

      // ════════════════════════════════════════════════════════════════════════
      // HELPER 2 — Advance Configuration widget
      // Flow: Tables tile → house icon → click "Advance Configuration" card → EDIT → bind dataset
      // ════════════════════════════════════════════════════════════════════════
      const addAdvanceConfigTableWidget = async (idx: number) => {
        await test.step(`Widget ${idx}: Advance Configuration`, async () => {
          await ensureSidebarOpen();
          await page.getByTitle('Tables').click();
          await page.waitForTimeout(1500);

          // Open the type picker via house icon
          const houseIcon = page.locator('.fa-house').first();
          await expect(houseIcon, 'House icon must be visible').toBeVisible({ timeout: 10000 });
          await houseIcon.click({ force: true });
          await page.waitForTimeout(1000);

          // Click the Advance Configuration card
          const advCard = page.locator('.widget-type-card').filter({ hasText: 'Advance Configuration' }).first();
          await expect(advCard, '"Advance Configuration" card must be visible').toBeVisible({ timeout: 10000 });
          await advCard.click({ force: true });
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-Advance_Configuration-selected.png`, fullPage: true }).catch(() => { });

          // Click Edit to confirm and open dataset properties panel
          const editBtn = page.getByRole('button', { name: /^EDIT$/i }).first();
          await expect(editBtn, 'EDIT button must be visible after selecting Advance Configuration').toBeVisible({ timeout: 10000 });
          await editBtn.click({ force: true });
          await page.waitForTimeout(1500);

          await bindDataset();
          await editJsonProperties('Advance_Configuration');
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-Advance_Configuration-final.png`, fullPage: true }).catch(() => { });
          await closePropertiesPanel();
        });
      };

      // ════════════════════════════════════════════════════════════════════════
      // HELPER 3 — Named preset: Tables → house → Advance Config → preset card → EDIT → bind
      // ════════════════════════════════════════════════════════════════════════
      const addTablePreset = async (presetName: string, idx: number) => {
        await test.step(`Widget ${idx}: ${presetName}`, async () => {
          const slug = presetName.replace(/[^a-z0-9]+/gi, '_');

          await ensureSidebarOpen();
          await page.getByTitle('Tables').click();
          await page.waitForTimeout(1000);

          // Open type picker via house icon
          const houseIcon = page.locator('.fa-house').first();
          await expect(houseIcon, 'House icon must be visible').toBeVisible({ timeout: 10000 });
          await houseIcon.click({ force: true });
          await page.waitForTimeout(800);

          // Click Advance Configuration to reveal preset sub-cards
          const advCard = page.locator('.widget-type-card').filter({ hasText: 'Advance Configuration' }).first();
          await expect(advCard, '"Advance Configuration" card must be visible').toBeVisible({ timeout: 10000 });
          await advCard.click({ force: true });
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-${slug}-subtypes.png`, fullPage: true }).catch(() => { });

          // Exact-match the preset card — anchored regex prevents partial hits
          // e.g. "With subtotals" must not match "Without subtotals"
          const exactRE = new RegExp(`^${escapeRegExp(presetName)}$`);
          const presetCard = page.locator('.widget-type-card').filter({ hasText: exactRE }).first();
          await expect(presetCard, `Preset card "${presetName}" must be visible`).toBeVisible({ timeout: 10000 });
          await presetCard.click({ force: true });
          await page.waitForTimeout(800);
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-${slug}-selected.png`, fullPage: true }).catch(() => { });

          // Click EDIT to confirm preset selection
          const editBtn = page.getByRole('button', { name: /^EDIT$/i }).first();
          await expect(editBtn, `EDIT button must appear after selecting "${presetName}"`).toBeVisible({ timeout: 10000 });
          await editBtn.click({ force: true });
          await page.waitForTimeout(1000);

          await bindDataset();
          await editJsonProperties(slug);
          await page.screenshot({ path: `screenshots/viz-preset-${idx}-${slug}-final.png`, fullPage: true }).catch(() => { });
          await closePropertiesPanel();
        });
      };

      // ════════════════════════════════════════════════════════════════════════
      // 20 TABLE WIDGETS
      // ════════════════════════════════════════════════════════════════════════

      // Widget 1 — Default
      await addDefaultTableWidget(1);

      // Widget 2 — Advance Configuration (no preset)
      await addAdvanceConfigTableWidget(2);

      // Widgets 3–20 — named presets
      await addTablePreset('Displaying All Columns in Query',        3);
      await addTablePreset('Selecting Specific Columns',             4);
      await addTablePreset('Custom Column Formatting',               5);
      await addTablePreset('Search',                                 6);
      await addTablePreset('Sort',                                   7);
      await addTablePreset('Deltas',                                 8);
      await addTablePreset('Bar Chart Column',                       9);
      await addTablePreset('Total Row',                             10);
      await addTablePreset('Using Built-in Aggregation Functions',  11);
      await addTablePreset('Color Scale',                           12);
      await addTablePreset('Image Column (Flags)',                  13);
      await addTablePreset('Link with Column Label',                14);
      await addTablePreset('Link with Static Label',                15);
      await addTablePreset('Groups - Accordion - Without subtotals', 16);
      await addTablePreset('Groups - Accordion - With subtotals',   17);
      await addTablePreset('All Aggregation Functions Demo',        18);
      await addTablePreset('All Aggregation Functions (Simple)',    19);
      await addTablePreset('All Aggregation Functions (GDP)',       20);

      // ── Assert widgets exist on canvas (selector confirmed from other specs) ──
      const allWidgets = page.locator('[class*="widget-transform"], [class*="widget-container"]');
      const widgetCount = await allWidgets.count();
      console.log(`Canvas widget count: ${widgetCount}`);

      await page.waitForTimeout(2000);

      // Save the visualization
      const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save, .action-bar-btn-save').first();
      await expect(saveBtn).toBeVisible({ timeout: 10000 });
      await saveBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/viz-final-saved.png', fullPage: true }).catch(() => { });
    }
  }
});

test('Chart widget sorting, aggregation, formatting and type switching', async ({ page }) => {
  await ensureLoggedIn(page);
  await goToVizFolder(page);
  
  const vizName = `TestChartWidget_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForTimeout(3000);

  // Close any dialog
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Open Widget Sidebar and add Charts widget
  const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
  if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await showBtn.click();
    await page.waitForTimeout(1000);
  }

  const chartsTile = page.getByTitle('Charts').first();
  await expect(chartsTile).toBeVisible({ timeout: 10000 });
  await chartsTile.click();
  await page.waitForTimeout(2000);

  // Click Edit to open properties
  const editBtn = page.getByRole('button', { name: 'Edit' });
  await expect(editBtn).toBeVisible({ timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(2000);

  // Click Home tab (house icon) to change to Bar Chart first
  const houseIcon = page.locator('.fa-house').first();
  await houseIcon.click();
  await page.waitForTimeout(1500);

  // Change to Bar Chart
  const barChartCard = page.locator('.widget-type-card, [class*="card"]').filter({ hasText: 'Bar' }).first();
  await expect(barChartCard).toBeVisible({ timeout: 10000 });
  await barChartCard.click();
  await page.waitForTimeout(1500);

  // Switch back to Datasets tab to bind dataset
  const dbTab = page.locator('.fa-database, i.fa-database, [title="Datasets"]').last();
  await dbTab.click();
  await page.waitForTimeout(1500);

  // Select automation_testing dataset
  const dropdownTrigger = page.locator('app-get-data-api').locator('.p-dropdown-trigger, span.p-dropdown-trigger-icon').first();
  await dropdownTrigger.click();
  await page.waitForTimeout(1000);
  
  const searchBox = page.locator('.p-dropdown-panel').locator('input').first()
    .or(page.getByRole('textbox', { name: 'Search by name or type' }))
    .first();
  await searchBox.fill('autom');
  await page.waitForTimeout(1000);
  
  const option = page.locator('.p-dropdown-item, [role="option"]').filter({ hasText: 'automation_testing' }).first();
  await option.click();
  await page.waitForTimeout(2000);

  // Drag Country -> Category, Revenue -> Value using custom dragAndDrop function
  const countryCol = page.getByRole('listitem').filter({ hasText: 'Country' }).first();
  const categoryZone = page.locator('#categoryList').first();
  const revenueCol = page.getByRole('listitem').filter({ hasText: 'Revenue' }).first();
  const valueZone = page.locator('#valueList').first();

  const dragAndDrop = async (source: any, target: any) => {
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }
  };

  await dragAndDrop(countryCol, categoryZone);
  await page.waitForTimeout(1000);
  await dragAndDrop(revenueCol, valueZone);
  await page.waitForTimeout(1500);

  // 1. Category Sort Settings: arrange ascending and descending
  const categoryGear = categoryZone.locator('.fa-cog, .fa-gear').first();
  await expect(categoryGear).toBeVisible({ timeout: 10000 });
  await categoryGear.click({ force: true });
  await page.waitForTimeout(1000);

  const sortLi = page.locator('.aiv-menu-category li').filter({ hasText: 'Sort' }).first();
  await expect(sortLi).toBeVisible({ timeout: 10000 });
  const sortLink = sortLi.locator('a').first();
  await sortLink.click({ force: true });
  await page.waitForTimeout(1500);

  // Ascending
  const orderDropdown = page.locator('p-dropdown[formcontrolname="order"]').first();
  await orderDropdown.click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('.p-dropdown-panel .p-dropdown-item').filter({ hasText: 'Ascending' }).first().click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('p-dialog button:has-text("Submit"), .p-dialog button:has-text("Submit")').first().click({ force: true });
  await page.waitForTimeout(1000);

  // Descending
  await categoryGear.click({ force: true });
  await page.waitForTimeout(1000);
  await sortLink.click({ force: true });
  await page.waitForTimeout(1500);

  await orderDropdown.click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('.p-dropdown-panel .p-dropdown-item').filter({ hasText: 'Descending' }).first().click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('p-dialog button:has-text("Submit"), .p-dialog button:has-text("Submit")').first().click({ force: true });
  await page.waitForTimeout(1000);

  // 2. Value Axis settings: select aggregation (Sum)
  const valueGear = valueZone.locator('.fa-cog, .fa-gear').first();
  await expect(valueGear).toBeVisible({ timeout: 10000 });
  await valueGear.click({ force: true });
  await page.waitForTimeout(1000);

  const aggItem = page.locator('.aiv-menu-y-axis').getByText('Aggregator').first();
  await expect(aggItem).toBeVisible({ timeout: 10000 });
  await aggItem.hover({ force: true });
  await page.waitForTimeout(1000);

  const sumOption = page.locator('.p-tieredmenu-panel:visible, .p-submenu-list:visible').getByText('Sum').first();
  await expect(sumOption).toBeVisible({ timeout: 10000 });
  await sumOption.click({ force: true });
  await page.waitForTimeout(1500);

  // 3. Click on Formatting (brush icon)
  const brushIcon = page.locator('.fa-hammer-brush, i.fa-hammer-brush, [title="Formatting"]').first();
  await expect(brushIcon).toBeVisible({ timeout: 10000 });
  await brushIcon.click({ force: true });
  await page.waitForTimeout(2000);

  // Scoped helper for properties panel accordion tabs
  const getTab = (headerText: string, parentLocator: any = page) => {
    return parentLocator.locator('.p-accordion-tab').filter({ hasText: headerText }).first();
  };

  const clickAccordion = async (tabLocator: any) => {
    const header = tabLocator.locator('.p-accordion-header').first();
    await header.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await header.click({ force: true });
    await page.waitForTimeout(1000);
  };

  const changeColor = async (locator: any, value: string) => {
    await locator.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await locator.click({ force: true });
    await locator.evaluate((el: HTMLInputElement, val: string) => {
      el.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
    await page.waitForTimeout(500);
  };

  const changeTextInput = async (locator: any, value: string) => {
    await locator.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await locator.click({ force: true });
    await locator.fill(value);
    await locator.dispatchEvent('change');
    await page.waitForTimeout(500);
  };

  const toggleSwitch = async (locator: any) => {
    const slider = locator.locator('.p-inputswitch-slider').first();
    await slider.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await slider.click({ force: true });
    await page.waitForTimeout(500);
  };

  // Configure formatting properties across all 7 categories
  // 1. General Settings
  const generalTab = getTab('General');
  await clickAccordion(generalTab);
  const stackSwitch = generalTab.locator('p-inputswitch').first();
  await toggleSwitch(stackSwitch);

  // 2. Category Axis Settings
  const catTab = getTab('Category Axis');
  await clickAccordion(catTab);
  const catTitleInput = catTab.locator('input.p-inputtext:not([readonly]):not([disabled]):not(.w-12)').first();
  await changeTextInput(catTitleInput, 'Custom Country Title');
  
  const catTitleStyleTab = getTab('Title Style', catTab);
  await clickAccordion(catTitleStyleTab);
  const catTitleColorInput = catTitleStyleTab.locator('input.w-12, input[type="color"]').first();
  if (await catTitleColorInput.isVisible().catch(() => false)) {
    await changeColor(catTitleColorInput, '#ff0000');
  }

  // 3. Value Axis Settings
  const valTab = getTab('Value Axis');
  await clickAccordion(valTab);
  const valTitleInput = valTab.locator('input.p-inputtext:not([readonly]):not([disabled]):not(.w-12)').first();
  await changeTextInput(valTitleInput, 'Custom Revenue Title');
  
  const valTitleStyleTab = getTab('Title Style', valTab);
  await clickAccordion(valTitleStyleTab);
  const valTitleColorInput = valTitleStyleTab.locator('input.w-12, input[type="color"]').first();
  if (await valTitleColorInput.isVisible().catch(() => false)) {
    await changeColor(valTitleColorInput, '#00ff00');
  }

  // 4. Series Settings
  const seriesTab = getTab('Series');
  await clickAccordion(seriesTab);
  const labelTab = getTab('Label', seriesTab);
  await clickAccordion(labelTab);
  const showLabelSwitch = labelTab.locator('p-inputswitch').first();
  await toggleSwitch(showLabelSwitch);

  // 5. Legend Settings
  const legendTab = getTab('Legend');
  await clickAccordion(legendTab);
  const showLegendSwitch = legendTab.locator('p-inputswitch').first();
  await toggleSwitch(showLegendSwitch);

  // 6. Tooltip Settings
  const tooltipTab = getTab('Tooltip');
  await clickAccordion(tooltipTab);
  const showTooltipSwitch = tooltipTab.locator('p-inputswitch').first();
  await toggleSwitch(showTooltipSwitch);

  // 7. Data Zoom Settings
  const zoomTab = getTab('Data Zoom');
  await clickAccordion(zoomTab);
  const dataZoomSwitch = zoomTab.locator('p-inputswitch').first();
  await toggleSwitch(dataZoomSwitch);

  await page.screenshot({ path: 'screenshots/viz-10-chart-formatting-configured.png', fullPage: true }).catch(() => { });

  // 4. Click on Home (house icon) and change it to different chart (Line)
  await houseIcon.click({ force: true });
  await page.waitForTimeout(1500);

  const lineChartCard = page.locator('.widget-type-card, [class*="card"]').filter({ hasText: 'Line' }).first();
  await expect(lineChartCard).toBeVisible({ timeout: 10000 });
  await lineChartCard.click({ force: true });
  await page.waitForTimeout(2000);

  // Close properties panel
  const closeBtn = page.locator('button:has-text("Close"), button:has-text("Apply"), app-widget-properties .fa-times, .fa-times').first();
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click({ force: true });
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(2000);

  // Save the visualization
  const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save, .action-bar-btn-save').first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await saveBtn.click({ force: true });
    await page.waitForTimeout(3000);
  }

  // Cleanup: delete visualization
  await goTo(page, URLS.viz);
  await page.waitForTimeout(2000);
  const vizRow = page.locator('[role="gridcell"], td').filter({ hasText: vizName }).first();
  if (await vizRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await vizRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await vizRow.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      await page.waitForTimeout(1000);
      const deleteItem = page.getByText(/^delete$/i).first();
      if (await deleteItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteItem.click();
        await page.waitForTimeout(1000);
        const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }
});


test('Card widget — data binding, aggregation, all formatting properties', async ({ page }) => {
  await ensureLoggedIn(page);
  await goToVizFolder(page);

  const vizName = `TestCardWidget_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForTimeout(3000);

  // Dismiss any auto-opened dialog
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // ── 1. Open Widget Sidebar and add Card widget ──────────────────────────
  const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
  if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await showBtn.click();
    await page.waitForTimeout(1000);
  }

  const cardTile = page.getByTitle('Card').or(page.getByText('Card', { exact: true })).first();
  await expect(cardTile).toBeVisible({ timeout: 10000 });
  await cardTile.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/card-01-widget-added.png', fullPage: true }).catch(() => {});

  // ── 2. Click Edit to open properties (Datasets tab) ────────────────────
  const editBtn = page.getByRole('button', { name: 'Edit' });
  await expect(editBtn).toBeVisible({ timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/card-02-edit-panel.png', fullPage: true }).catch(() => {});

  // ── 3. Select automation_testing dataset ────────────────────────────────
  // Card uses a 'dropdown trigger' button (confirmed from 15-viz-widgets.spec.ts)
  const cardDsTrigger = page.locator('app-get-data-api').getByRole('button', { name: 'dropdown trigger' });
  const stdDsTrigger  = page.locator('app-get-data-api')
    .locator('.p-dropdown-trigger, span.p-dropdown-trigger-icon').first();

  if (await cardDsTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cardDsTrigger.click();
  } else {
    await stdDsTrigger.click();
  }
  await page.waitForTimeout(1000);

  const dsSearch = page.locator('.p-dropdown-panel').locator('input').first()
    .or(page.getByRole('textbox', { name: 'Search by name or type' })).first();
  await expect(dsSearch).toBeVisible({ timeout: 5000 });
  await dsSearch.fill('autom');
  await page.waitForTimeout(1000);

  const dsOption = page.locator('.p-dropdown-item, [role="option"]')
    .filter({ hasText: 'automation_testing' }).first();
  await expect(dsOption).toBeVisible({ timeout: 5000 });
  await dsOption.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/card-03-dataset-selected.png', fullPage: true }).catch(() => {});

  // ── 4. Drag Revenue → first drop-placeholder (value zone) ───────────────
  const dragAndDrop = async (source: any, target: any) => {
    const srcVisible = await source.isVisible({ timeout: 5000 }).catch(() => false);
    const tgtVisible = await target.isVisible({ timeout: 5000 }).catch(() => false);
    if (!srcVisible || !tgtVisible) return;
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) return;
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();
  };

  // .drop-placeholder is the confirmed class for Card drop zones (from error trace)
  const allDropZones  = page.locator('.drop-placeholder');
  const revenueCol    = page.getByRole('listitem').filter({ hasText: 'Revenue' }).first();
  const countryCol    = page.getByRole('listitem').filter({ hasText: 'Country' }).first();

  await dragAndDrop(revenueCol, allDropZones.first());
  await page.waitForTimeout(1500);

  // Drag Country to second drop zone if available (label / subtitle slot)
  if (await allDropZones.nth(1).isVisible({ timeout: 3000 }).catch(() => false)) {
    await dragAndDrop(countryCol, allDropZones.nth(1));
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: 'screenshots/card-04-fields-bound.png', fullPage: true }).catch(() => {});

  // ── 5. Aggregation — find gear button next to Revenue via DOM walk ──────────
  // Rather than guessing class names, use evaluate() to find the exact button
  // that sits alongside the "Revenue" text node, then click it by coordinates.

  await page.waitForTimeout(1000);

  // Use JS to find all buttons/icons that are siblings of a "Revenue" text node
  const gearBox = await page.evaluate(() => {
    // Find every element whose trimmed textContent is exactly "Revenue"
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.children.length > 0) continue; // leaf nodes only
      if ((el.textContent ?? '').trim() !== 'Revenue') continue;

      // Walk up to find the row container (up to 5 levels)
      let row: Element | null = el.parentElement;
      for (let i = 0; i < 5 && row; i++) {
        // Look for a button or icon element inside this row
        const btn = row.querySelector(
          'button, [class*="gear"], [class*="cog"], [class*="setting"], ' +
          'i[class*="fa"], span[class*="fa"]'
        );
        if (btn) {
          const r = btn.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
        row = row.parentElement;
      }
    }
    return null;
  });

  if (gearBox) {
    await page.mouse.click(gearBox.x, gearBox.y);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/card-05a-agg-menu-open.png', fullPage: true }).catch(() => {});

    // Select Average from the flat list
    const averageItem = page.getByText('Average', { exact: true }).first();
    if (await averageItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await averageItem.click({ force: true });
      await page.waitForTimeout(1500);
    } else {
      await page.keyboard.press('Escape');
    }
  }
  await page.screenshot({ path: 'screenshots/card-05-aggregation-average.png', fullPage: true }).catch(() => {});

  // ── 6. Click the widget on the canvas to re-select it ───────────────────
  // After interacting with the Datasets panel (aggregation), always click the
  // placed Card widget on the canvas to bring focus back and restore the
  // properties tab bar (which contains the brush/formatting icon).
  const canvasWidget = page.locator(
    'app-aiv-viz-widget, [class*="widget-transform"], [class*="widget-container"]'
  ).first();
  await expect(canvasWidget).toBeVisible({ timeout: 10000 });
  await canvasWidget.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/card-06-widget-selected.png', fullPage: true }).catch(() => {});

  // ── 7. Open Formatting panel (brush icon) ───────────────────────────────
  // Now that the widget is selected on canvas, the tab bar is fully visible.
  // The brush/formatting icon is in the properties panel tab bar.
  const brushIcon = page.locator('.fa-hammer-brush, i.fa-hammer-brush, [title="Formatting"]').first();

  // If still not visible, re-open properties via the widget's Edit button
  if (!await brushIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
    const editBtn2 = page.getByRole('button', { name: 'Edit' });
    if (await editBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn2.click({ force: true });
      await page.waitForTimeout(1500);
    }
  }

  await expect(brushIcon).toBeVisible({ timeout: 15000 });
  await brushIcon.click({ force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/card-07-formatting-open.png', fullPage: true }).catch(() => {});

  // ── Shared formatting helpers ────────────────────────────────────────────

  // Set a native input value + dispatch Angular-compatible events
  const setInputVal = async (inputEl: any, val: string) => {
    if (!await inputEl.isVisible().catch(() => false)) return;
    await inputEl.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(150);
    await inputEl.click({ force: true });
    await inputEl.evaluate((el: HTMLInputElement, v: string) => {
      el.removeAttribute('disabled');
      el.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, v);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur',   { bubbles: true }));
    }, val);
    await page.waitForTimeout(500);
  };

  // Click a p-dropdown inside a container, then pick option by text
  const pickDropdown = async (container: any, optionText: string) => {
    const dd = container.locator('p-dropdown').first();
    if (!await dd.isVisible().catch(() => false)) return;
    await dd.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await dd.click({ force: true });
    await page.waitForTimeout(400);
    const opt = page.locator('.p-dropdown-panel .p-dropdown-item, .p-dropdown-panel [role="option"]')
      .filter({ hasText: new RegExp(`^${optionText}$`, 'i') }).first();
    if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await opt.click({ force: true });
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  };

  // Toggle a p-inputswitch to a target state (true = on, false = off)
  const setSwitch = async (switchEl: any, targetOn: boolean) => {
    if (!await switchEl.isVisible().catch(() => false)) return;
    await switchEl.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    const isOn = await switchEl.locator('.p-inputswitch-checked').isVisible().catch(() => false)
      || (await switchEl.locator('input[type="checkbox"]').getAttribute('aria-checked').catch(() => 'false')) === 'true';
    if (isOn !== targetOn) {
      await switchEl.locator('.p-inputswitch-slider').click({ force: true });
      await page.waitForTimeout(600);
    }
  };

  // ── 7. Enumerate ALL accordion tabs and configure every property ─────────
  // Rather than hard-coding tab names (which differ from our guesses), iterate
  // every .p-accordion-tab in the formatting panel and interact with all inputs.

  const accordionTabs = page.locator('.p-accordion-tab');
  const tabCount = await accordionTabs.count();
  console.log(`Card formatting panel has ${tabCount} accordion tabs`);

  for (let tabIdx = 0; tabIdx < tabCount; tabIdx++) {
    const tab = accordionTabs.nth(tabIdx);

    // Get the header text for logging / screenshot naming
    const headerText = await tab.locator('.p-accordion-header-text, .p-accordion-header a span')
      .first().innerText().catch(() => `tab-${tabIdx}`);
    const slug = headerText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Expand the tab
    const headerLink = tab.locator('.p-accordion-header a, .p-accordion-header-link').first();
    if (!await headerLink.isVisible().catch(() => false)) continue;
    await headerLink.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await headerLink.click({ force: true });
    await page.waitForTimeout(1000);

    // Wait for content to expand
    const content = tab.locator('.p-toggleable-content, .p-accordion-content').first();
    await content.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (!await content.isVisible().catch(() => false)) continue;

    console.log(`  ▶ Configuring: "${headerText.trim()}"`);

    // ── a. All p-inputswitch toggles (turn them ON) ──────────────────────
    const switches = content.locator('p-inputswitch');
    const swCount  = await switches.count();
    for (let si = 0; si < swCount; si++) {
      await setSwitch(switches.nth(si), true);
    }

    // ── b. All p-inputnumber spinners ────────────────────────────────────
    const spinners = content.locator('p-inputnumber input, input.p-inputnumber-input');
    const spinCount = await spinners.count();
    // Use meaningful values based on position
    const spinValues = ['16', '600', '12', '8', '2', '1'];
    for (let ni = 0; ni < spinCount; ni++) {
      await setInputVal(spinners.nth(ni), spinValues[ni] ?? '12');
    }

    // ── c. All plain text inputs (non-color, non-spinner) ────────────────
    const textInputs = content.locator(
      'input.p-inputtext:not([readonly]):not([disabled]):not(.w-12):not(.p-inputnumber-input)'
    );
    const textCount = await textInputs.count();
    const textValues: Record<number, string> = {
      0: 'Card Title',
      1: 'Subtitle Text',
      2: '$',      // prefix symbol
      3: ' USD',   // suffix symbol
    };
    for (let ti = 0; ti < textCount; ti++) {
      await setInputVal(textInputs.nth(ti), textValues[ti] ?? 'text');
    }

    // ── d. All color inputs (.w-12 pattern) ─────────────────────────────
    const colorInputs = content.locator('input.w-12');
    const colorCount  = await colorInputs.count();
    // Distinct palette so every color slot gets a different value
    const palette = [
      '#1e3a5f', '#f8fafc', '#0f172a', '#3b82f6',
      '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6',
      '#ffffff', '#e2e8f0', '#334155', '#64748b',
    ];
    for (let ci = 0; ci < colorCount; ci++) {
      await setInputVal(colorInputs.nth(ci), palette[ci % palette.length]);
    }

    // ── e. All p-dropdown selects (pick first available option) ──────────
    const dropdowns = content.locator('p-dropdown');
    const ddCount   = await dropdowns.count();
    // Map of common label→option pairings for Card widget dropdowns
    const ddChoices: Record<number, string> = {
      0: 'Bold',        // Font Weight
      1: 'Italic',      // Font Style
      2: 'Center',      // Text Align
      3: 'Horizontal',  // Layout
      4: 'Sum',         // Aggregation (if exposed here)
    };
    for (let di = 0; di < ddCount; di++) {
      await pickDropdown(dropdowns.nth(di).locator('..'), ddChoices[di] ?? 'Bold');
    }

    await page.screenshot({
      path: `screenshots/card-08-tab-${String(tabIdx).padStart(2, '0')}-${slug}.png`,
      fullPage: true,
    }).catch(() => {});
  }

  await page.screenshot({ path: 'screenshots/card-08-all-formatting-done.png', fullPage: true }).catch(() => {});

  // ── 8. Switch card type via Home (house icon) ────────────────────────────
  const houseIcon = page.locator('.fa-house').first();
  if (await houseIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
    await houseIcon.click({ force: true });
    await page.waitForTimeout(1500);

    // Verify Default is selected
    const defaultCard = page.locator('.widget-type-card').filter({ hasText: 'Default' }).first();
    if (await defaultCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(defaultCard).toHaveClass(/selected/);
    }

    // Switch to Advance Configuration
    const advanceCard = page.locator('.widget-type-card').filter({ hasText: 'Advance Configuration' }).first();
    if (await advanceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await advanceCard.hover();
      await page.waitForTimeout(300);
      await advanceCard.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/card-09-advance-config.png', fullPage: true }).catch(() => {});
    }
  }

  // ── 9. Close panel and save ──────────────────────────────────────────────
  const closeBtn = page.locator(
    'button:has-text("Close"), button:has-text("Apply"), app-widget-properties .fa-times, .fa-times'
  ).first();
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click({ force: true });
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(3000);

  const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save, .action-bar-btn-save').first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await saveBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/card-10-saved.png', fullPage: true }).catch(() => {});
  }

  // ── 10. Cleanup — delete visualization ──────────────────────────────────
  await goTo(page, URLS.viz);
  await page.waitForTimeout(2000);
  const vizRow = page.locator('[role="gridcell"], td').filter({ hasText: vizName }).first();
  if (await vizRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await vizRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await vizRow.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      await page.waitForTimeout(1000);
      const deleteItem = page.getByText(/^delete$/i).first();
      if (await deleteItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteItem.click();
        await page.waitForTimeout(1000);
        const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }
});

test('Widget Basket — open, search custom, add widget', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes — this test does many steps
  await ensureLoggedIn(page);
  await goToVizFolder(page);

  const vizName = `TestWidgetBasket_${Date.now()}`;
  await page.getByRole('button', { name: 'Create Viz' }).click();
  await page.getByRole('textbox').fill(vizName);
  await page.getByRole('button', { name: 'Create File' }).click();
  await page.waitForURL(/viz-edit/, { timeout: 120000 });
  await page.waitForTimeout(3000);

  // Dismiss any auto-opened dialog
  const dlg = page.locator('[role="dialog"]').first();
  if (await dlg.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // ── 1. Open Widget Sidebar ───────────────────────────────────────────────
  const showBtn = page.getByRole('button', { name: 'Show Widget Sidebar' });
  if (await showBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await showBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'screenshots/basket-01-sidebar-open.png', fullPage: true }).catch(() => {});

  // ── 2. Click Widget Basket tile ──────────────────────────────────────────
  // Visible in the sidebar as "Widget Basket" tile (confirmed from screenshot)
  const basketTile = page.getByTitle('Widget Basket')
    .or(page.getByText('Widget Basket', { exact: true })).first();
  await expect(basketTile).toBeVisible({ timeout: 10000 });
  await basketTile.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/basket-02-panel-open.png', fullPage: true }).catch(() => {});

  // ── 3. Search for "custom" inside the Widget Basket panel ───────────────
  // The basket panel has a search input to filter available widgets
  const basketSearch = page.locator(
    '.widget-basket input, .basket-search input, ' +
    '[placeholder*="search" i], [placeholder*="Search" i], ' +
    'input[type="search"], input[type="text"]'
  ).filter({ visible: true }).first();

  await expect(basketSearch).toBeVisible({ timeout: 10000 });
  await basketSearch.click({ force: true });
  await basketSearch.fill('custom');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/basket-03-search-custom.png', fullPage: true }).catch(() => {});

  // ── 4. Click the + icon on the first result row to add widget to canvas ───
  // From the screenshot: each result row has action icons [📷] [+] [🗑]
  // The + button has tooltip "Add widget to canvas".
  // It is the inline + button inside the list row — NOT a page-level add button.

  // The first result row is the first list item in the basket results
  const firstRow = page.locator(
    '.p-listbox-item, li[class*="widget"], li[class*="basket"], ' +
    '[class*="basket-item"], [class*="widget-item"], [class*="list-item"]'
  ).first();

  // If the row isn't found by class, fall back to any row containing "CustomVisualization"
  const fallbackRow = page.locator('li, tr, div[role="listitem"], div[class*="row"]')
    .filter({ hasText: /CustomVisualization|custom/i }).first();

  const resultRow = await firstRow.isVisible({ timeout: 5000 }).catch(() => false)
    ? firstRow : fallbackRow;

  // Hover the row to ensure the + button is visible (tooltip shown on hover in screenshot)
  if (await resultRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await resultRow.hover({ force: true });
    await page.waitForTimeout(600);
  }

  // + button: scoped to the result row, title "Add widget to canvas"
  // From screenshot: it's a small button with a + icon to the right of the screenshot/image icon
  const addToCanvasBtn = resultRow.locator(
    '[title="Add widget to canvas"], [title*="Add widget"], ' +
    'button.p-button-icon-only i.fa-plus, button i.fa-plus, ' +
    'button .fa-plus, .fa-plus'
  ).first();

  // Fallback: page-level — any visible + button with "Add widget to canvas" title
  const addToCanvasFallback = page.locator(
    '[title="Add widget to canvas"], button[title*="Add widget"]'
  ).first();

  const btnToClick = await addToCanvasBtn.isVisible({ timeout: 3000 }).catch(() => false)
    ? addToCanvasBtn : addToCanvasFallback;

  await expect(btnToClick).toBeVisible({ timeout: 10000 });
  await btnToClick.click({ force: true });
  await page.waitForTimeout(2000);

  // ── 5. Wait for widget to load on canvas ─────────────────────────────────
  const canvasWidget = page.locator(
    'app-aiv-viz-widget, [class*="widget-transform"], [class*="widget-container"], .widget'
  ).first();
  await expect(canvasWidget).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/basket-04-widget-loaded.png', fullPage: true }).catch(() => {});

  // ── 5b. Click the ⋯ (3 dots) on the widget and select "Add to Widget Basket"
  // From screenshot: hovering the widget reveals an action bar with a ⋯ menu button.
  // Clicking it opens a context menu with "Add to Widget Basket" as an option.

  // Hover the widget to reveal its action bar
  await canvasWidget.hover({ force: true });
  await page.waitForTimeout(600);

  // The 3-dot menu button — shown in screenshot as the rightmost button in the widget action bar
  const threeDotsBtn = page.locator(
    '.aiv-widget-wicons-bar button[title*="More"], ' +
    '.aiv-widget-wicons-bar button[title*="more"], ' +
    '.aiv-widget-wicons-bar .fa-ellipsis, ' +
    '.aiv-widget-wicons-bar .fa-ellipsis-v, ' +
    'button[title*="More actions"], button[title*="Options"]'
  ).first();

  // Fallback: the ⋯ button is the last button in the widget icon bar
  const iconBarLastBtn = page.locator('.aiv-widget-wicons-bar button').last();

  const dotsBtn = await threeDotsBtn.isVisible({ timeout: 3000 }).catch(() => false)
    ? threeDotsBtn : iconBarLastBtn;

  await expect(dotsBtn).toBeVisible({ timeout: 10000 });
  await dotsBtn.click({ force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/basket-04b-dots-menu-open.png', fullPage: true }).catch(() => {});

  // Click "Add to Widget Basket" in the context menu
  const addToBasketItem = page.getByText('Add to Widget Basket', { exact: true }).first()
    .or(page.locator('.p-menu li, .p-contextmenu li, [role="menuitem"]')
      .filter({ hasText: 'Add to Widget Basket' }).first());

  await expect(addToBasketItem).toBeVisible({ timeout: 10000 });
  await addToBasketItem.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/basket-04c-add-to-basket-clicked.png', fullPage: true }).catch(() => {});

  // A folder picker dialog/panel appears — select the folder we created
  // The folder name starts with "TestFolder_"
  const createdFolderOption = page.locator(
    '.p-dialog, .p-overlaypanel, [role="dialog"], .folder-picker'
  ).locator('*').filter({ hasText: /TestFolder_/i }).first();

  if (await createdFolderOption.isVisible({ timeout: 5000 }).catch(() => false)) {
    await createdFolderOption.click({ force: true });
    await page.waitForTimeout(1000);
    // Confirm the selection
    const confirmBtn = page.getByRole('button', { name: /OK|Save|Confirm|Add/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(1500);
    }
  }
  await page.screenshot({ path: 'screenshots/basket-04d-added-to-folder.png', fullPage: true }).catch(() => {});

  // ── 6. Ensure Widget Basket panel is still open, then click Folder View ──
  const basketPanelHeader = page.locator('.widget-basket, [class*="basket"], .p-sidebar')
    .filter({ hasText: /Widget Basket|List View|Folder View/i }).first();

  if (!await basketPanelHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
    const basketTileReopen = page.getByTitle('Widget Basket')
      .or(page.getByText('Widget Basket', { exact: true })).first();
    if (await basketTileReopen.isVisible({ timeout: 3000 }).catch(() => false)) {
      await basketTileReopen.click({ force: true });
      await page.waitForTimeout(1500);
    }
  }

  // Now click Folder View toggle button (in the basket panel header)
  const folderViewBtn = page.getByRole('button', { name: 'Folder View' })
    .or(page.locator('button').filter({ hasText: /^Folder View$/i }))
    .or(page.getByText('Folder View', { exact: true }))
    .or(page.locator('[title="Folder View"], button[aria-label="Folder View"]'))
    .first();

  await expect(folderViewBtn).toBeVisible({ timeout: 10000 });
  await folderViewBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/basket-05-folder-view.png', fullPage: true }).catch(() => {});

  // ── 7. Click the Create Folder card and immediately type the folder name ──
  // From screenshot: clicking the card activates an inline input that is already
  // focused — just type directly without waiting for a separate input locator.
  const createFolderCard = page.locator('.create-folder-card').first();

  await expect(createFolderCard).toBeVisible({ timeout: 10000 });
  await createFolderCard.click({ force: true });
  await page.waitForTimeout(500);

  // Card is now in edit mode with the input focused — type the folder name directly
  const folderName = `TestFolder_${Date.now()}`;
  await page.keyboard.type(folderName, { delay: 50 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/basket-06-folder-name-typed.png', fullPage: true }).catch(() => {});

  // Confirm with Enter
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/basket-07-folder-created.png', fullPage: true }).catch(() => {});

  // ── 9. Save and cleanup ──────────────────────────────────────────────────
  const saveBtn = page.locator('.p-element.action-bar-btn.action-bar-btn-save, .action-bar-btn-save').first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await saveBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/basket-08-saved.png', fullPage: true }).catch(() => {});
  }

  await goTo(page, URLS.viz);
  await page.waitForTimeout(2000);
  const vizRow = page.locator('[role="gridcell"], td').filter({ hasText: vizName }).first();
  if (await vizRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await vizRow.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await vizRow.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      await page.waitForTimeout(1000);
      const deleteItem = page.getByText(/^delete$/i).first();
      if (await deleteItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteItem.click();
        await page.waitForTimeout(1000);
        const confirmBtn = page.getByRole('button', { name: /delete|yes|confirm/i }).last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }
});
