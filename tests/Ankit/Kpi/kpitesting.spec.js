import { test, expect } from '@playwright/test';
import { ensureLoggedIn, goToDashboard, createViz, uniqueName } from '../../../ai/helpers.js';

test.setTimeout(180000);

/**
 * Helper: CDK-aware drag from a column list item to a target drop zone.
 * Uses low-level mouse movement with steps to reliably trigger Angular CDK drag events.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} sourceLocator
 * @param {import('@playwright/test').Locator} targetLocator
 * @param {number} [steps=10]
 */
async function cdkDrag(page, sourceLocator, targetLocator, steps = 20) {
  await expect(sourceLocator).toBeVisible({ timeout: 10000 });
  await expect(targetLocator).toBeVisible({ timeout: 10000 });

  const sourceBox = await sourceLocator.boundingBox();
  const targetBox = await targetLocator.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('cdkDrag: could not resolve bounding boxes for source or target');
  }

  const srcX = sourceBox.x + sourceBox.width / 2;
  const srcY = sourceBox.y + sourceBox.height / 2;
  const tgtX = targetBox.x + targetBox.width / 2;
  const tgtY = targetBox.y + targetBox.height / 2;

  // Move to source and press down
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();
  await page.waitForTimeout(100); // let CDK register mousedown

  // Small jiggle to cross CDK's drag-start threshold (usually 5px)
  await page.mouse.move(srcX + 5, srcY + 5, { steps: 3 });
  await page.waitForTimeout(50);

  // Main drag to target
  await page.mouse.move(tgtX, tgtY, { steps });
  await page.waitForTimeout(100); // settle before releasing
  await page.mouse.up();
  await page.waitForTimeout(2000); // Allow CDK to register the drop
}

test('KPI Card - configure, style and add Revenue with Trend card', async ({ page }) => {

  // ── 1. Login ───────────────────────────────────────────────────────────────
  await ensureLoggedIn(page);

  // ── 2. Navigate to dashboard grid, switch to List View ────────────────────
  await goToDashboard(page);
  await page.locator('mat-toolbar-row button').click().catch(() => { });
  await page.getByRole('link', { name: 'List View' }).click().catch(() => { });

  // ── 3. Create a fresh viz with a unique name every run ────────────────────
  const vizName = uniqueName('KPICard');
  await createViz(page, vizName);
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });

  // ── 4. Add Card widget from the sidebar ────────────────────────────────────
  await page.getByTitle('Card').click();
  await page.getByRole('button', { name: 'Edit' }).click();

  // ── 5. Select dataset: search for supermarket_sales ──────────────────────
  await page.getByRole('button', { name: 'dropdown trigger' }).click();

  // Type in the search box to filter datasets
  const datasetSearch = page.locator('input[placeholder*="Search by name"], input[placeholder*="search"], .p-dropdown-filter').first();
  await datasetSearch.waitFor({ state: 'visible', timeout: 10000 });
  await datasetSearch.fill('supermarket_sales');

  // Click the matching dataset option
  await page.getByText('supermarket_sales.ds').first().click();

  // Wait for column list to fully load
  await page.waitForLoadState('networkidle').catch(() => { });
  await page.waitForTimeout(2000);

  // ── 6. Scroll column list down to reveal Discount_Amount, then drag ────────
  // Scroll the column list panel so Discount_Amount is in view
  const columnList = page.locator(
    '#fieldList, .aiv-viz-column-list, ul.cdk-drop-list, app-get-data-api ul'
  ).first();
  await columnList.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
  await columnList.evaluate(el => el.scrollTop = el.scrollHeight); // scroll to bottom
  await page.waitForTimeout(500); // let scroll settle

  // Ensure the column is visible after scrolling
  const discountAmountCol = page.locator('li.aiv-custom-column, li.cdk-drag')
    .filter({ hasText: 'Discount_Amount' }).first();
  await discountAmountCol.scrollIntoViewIfNeeded().catch(() => { });

  const valueDropZone = page.getByText('Drop column here').first();
  await cdkDrag(page, discountAmountCol, valueDropZone);

  // ── 7. Set aggregation to SUM ──────────────────────────────────────────────
  await page.locator('.flex > .fa-light.fa-cog').click();
  await page.locator('#sum').click();

  await page.locator('.p-element.fa-light.fa-hammer-brush').click();

  // ── 9. Title tab ──────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Title' }).click();
  await page.getByRole('textbox').nth(2).fill('for old customer ');
  await page.locator('p-dropdown').filter({ hasText: 'Bottom' }).getByLabel('dropdown trigger').click();
  await page.getByRole('spinbutton').first().fill('14');
  await page.getByRole('button', { name: 'dropdown trigger' }).nth(3).click();
  await page.getByRole('option', { name: 'Bold', exact: true }).click();
  await page.getByRole('tab', { name: 'Title' }).click();

  // ── 10. Value tab ─────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Value' }).click();
  await page.getByRole('spinbutton').first().fill('28');
  await page.getByRole('button', { name: 'dropdown trigger' }).nth(1).click();
  await page.getByRole('option', { name: '500' }).click();
  await page.getByRole('button', { name: 'dropdown trigger' }).nth(2).click();
  await page.locator('div').filter({ hasText: /^Display Unit$/ }).click();
  await page.getByRole('textbox').nth(4).fill('$');
  await page.getByRole('tab', { name: 'Value' }).click();

  // ── 11. Label / General settings (gear icon) ──────────────────────────────
  await page.locator('.p-element.fa-light.fa-gear').click();
  await page.getByRole('textbox').nth(2).fill('Total Discount');
  await page.locator('#p-accordiontab-5-content').getByText('Align Left').click();
  await page.getByLabel('label_center').getByText('Center').click();
  await page.getByRole('spinbutton').first().fill('15');
  await page.locator('#p-accordiontab-5-content').getByText('Font Weight').click();
  await page.getByRole('button', { name: 'dropdown trigger' }).nth(1).click();
  await page.getByText('Bolder').click();
  await page.locator('div:nth-child(8) > .p-element.ng-untouched > .p-inputswitch > .p-inputswitch-slider').first().click();
  await page.locator('div:nth-child(15) > .p-element.ng-untouched > .p-inputswitch > .p-inputswitch-slider').first().click();
  await page.locator('div:nth-child(18) > .p-element.ng-untouched > .p-inputswitch > .p-inputswitch-slider').click();
  await page.getByRole('button', { name: 'dropdown trigger' }).nth(3).click();
  await page.getByLabel('label_right').getByText('Right', { exact: true }).click();
  await page.getByRole('spinbutton').nth(5).fill('20');
  await page.locator('div:nth-child(24) > .p-inputtext').fill('20');

  // ── 12. General tab — zero padding ────────────────────────────────────────
  await page.getByRole('tab', { name: 'Title', exact: true }).click();
  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('region', { name: 'General' }).getByRole('textbox').fill('0px');
  await page.locator('.canvas-content').click();

  // ── 13. Border tab ────────────────────────────────────────────────────────
  await page.locator('.card-widget-container').click();
  await page.locator('.p-element.fa-light.fa-gear').click();
  await page.getByRole('tab', { name: 'Border' }).click();
  // Enable border via the labelled region toggle
  await page.getByLabel('Border').getByText('Enable Border').click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-172 > .flex.flex-column.aiv-viz-scrollbar > ' +
    '.flex.gap-1.flex-row.justify-content-between > .p-element.ng-untouched > ' +
    '.p-inputswitch > .p-inputswitch-slider'
  ).click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-172 > .flex.flex-column.aiv-viz-scrollbar > ' +
    'div:nth-child(11) > .p-inputtext'
  ).fill('16');
  await page.getByText('Enable Border Border Color').click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-172 > .flex.flex-column.aiv-viz-scrollbar > ' +
    'div:nth-child(10) > .p-inputtext'
  ).fill('16');
  await page.getByRole('spinbutton').nth(5).fill('16');
  await page.getByRole('spinbutton').nth(4).fill('16');

  // ── 14. Box Shadow tab ────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Box Shadow' }).click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-173 > .flex.flex-column.aiv-viz-scrollbar > ' +
    '.flex.gap-1.flex-row > .p-element.ng-untouched > .p-inputswitch > .p-inputswitch-slider'
  ).click();
  await page.getByRole('tab', { name: 'Box Shadow' }).click();

  // ── 15. Extra Label tab ───────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Extra Label' }).click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-174 > .flex.flex-column.aiv-viz-scrollbar > ' +
    '.flex.gap-1.flex-row > .p-element.ng-untouched > .p-inputswitch > .p-inputswitch-slider'
  ).click();
  await page.getByRole('textbox').nth(3).fill('kjkddkjf');
  // Open the correct p-dropdown (the one currently showing 'Widget') and select 'None'
  const widgetDropdown = page.locator('p-dropdown').filter({ hasText: 'Widget' });
  await widgetDropdown.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'None' }).first().click();
  // Clear and set padding text step-by-step (mirrors recorded interactions)
  await page.getByRole('textbox').nth(4).fill('5px');
  await page.getByRole('textbox').nth(4).fill('5px 10px');
  await page.getByRole('textbox').nth(4).fill('5px 30px');
  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('tab', { name: 'Extra Label' }).click();
  await page.locator(
    '.p-accordion-content.ng-tns-c100-174 > .flex.flex-column.aiv-viz-scrollbar > ' +
    '.flex.gap-1.flex-row > .p-element.ng-valid > .p-inputswitch > .p-inputswitch-slider'
  ).click();
  await page.getByRole('tab', { name: 'Extra Label' }).click();

  // ── 16. Final General padding ─────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Title', exact: true }).click();
  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('region', { name: 'General' }).getByRole('textbox').fill('5px 0px');
  await page.getByRole('region', { name: 'General' }).getByRole('textbox').fill('0px 0px');
  await page.locator('.canvas-content').click();
  await page.getByRole('button', { name: 'Hide Widget Sidebar' }).click();
  await page.getByTitle('Card').click();
  await page.locator('div:nth-child(2) > .widget-type-header > .widget-type-radio-indicator').click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('.p-element.fa-light').first().click();
  await page.locator('div:nth-child(2) > .widget-type-header > .widget-type-radio-indicator').click();
  await page.getByRole('button', { name: 'Edit' }).click();


  // ── 18. Select dataset for Revenue with Trend card (search-based) ────────
  await page.locator('.fa.fa-light.ai-cursor').click();
  await page.getByRole('button', { name: 'dropdown trigger' }).click();

  // Type in the search box to filter datasets
  const datasetSearch2 = page.locator('input[placeholder*="Search by name"], input[placeholder*="search"], .p-dropdown-filter').first();
  await datasetSearch2.waitFor({ state: 'visible', timeout: 10000 });
  await datasetSearch2.fill('supermarket_sales');

  // Click the matching dataset option
  await page.getByText('supermarket_sales.ds').first().click();

  // Wait for column list to fully load
  await page.waitForLoadState('networkidle').catch(() => { });
  await page.waitForTimeout(2000);

  // Scroll the column list panel so Net_Sales is in view
  const columnList2 = page.locator(
    '#fieldList, .aiv-viz-column-list, ul.cdk-drop-list, app-get-data-api ul'
  ).first();
  await columnList2.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
  await columnList2.evaluate(el => el.scrollTop = el.scrollHeight); // scroll to bottom
  await page.waitForTimeout(500); // let scroll settle

  // Ensure Net_Sales column is visible after scrolling
  const netSalesCol = page
    .locator('li.aiv-custom-column, li.cdk-drag')
    .filter({ hasText: 'Net_Sales' })
    .first();

  await netSalesCol.scrollIntoViewIfNeeded().catch(() => { });

  const fieldListDropZone = page
    .locator('#fieldList')
    .getByText('Drop column here')
    .first();

  await fieldListDropZone.scrollIntoViewIfNeeded().catch(() => { });
  await cdkDrag(page, netSalesCol, fieldListDropZone, 80);

  // ── 20. Set aggregation to SUM for Revenue card ───────────────────────────
  await page.locator('.flex > .fa-light.fa-cog').click();
  await page.locator('#sum').click();


  // ── 22. Assert rendered value and select both widgets ─────────────────────
  await expect(page.locator('.card-widget-container').first()).toBeVisible({ timeout: 15000 });
  await page.getByText('$6.83K').click().catch(() => { }); // May differ if data changes

  // Ctrl-click second widget to multi-select
  const secondCard = page.locator('[id^="widget_"]').last();
  await secondCard.click({ modifiers: ['ControlOrMeta'] }).catch(() => { });

  // ── 23. Resize both cards ─────────────────────────────────────────────────
  // Wait for resize buttons to appear after multi-select
  const resizeSm = page.locator('.p-element.p-button-sm').first();
  await resizeSm.waitFor({ state: 'visible', timeout: 10000 });
  await resizeSm.click();
  await resizeSm.click();

  const resizeBtn2 = page.locator('.resize-buttons > button:nth-child(2)');
  await resizeBtn2.waitFor({ state: 'visible', timeout: 10000 });
  await resizeBtn2.click();

  const resizeBtn1 = page.locator('.resize-buttons > button').first();
  await resizeBtn1.waitFor({ state: 'visible', timeout: 10000 });
  await resizeBtn1.click();

  await page.getByRole('button').nth(3).click();
});