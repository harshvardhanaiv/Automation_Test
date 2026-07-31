import { expect } from '@playwright/test';

/**
 * Generates a unique name appending a timestamp.
 * @param {string} baseName 
 * @returns {string}
 */
export function uniqueName(baseName) {
  return `${baseName}_${Date.now()}`;
}

/**
 * Ensures the page is logged in.
 * @param {import('@playwright/test').Page} page 
 */
export async function ensureLoggedIn(page) {
  const url = page.url();
  const isLoginPageVisible = await page.getByRole('textbox', { name: 'Your email' }).isVisible().catch(() => false);
  
  if (url === 'about:blank' || !url.includes('/aiv/') || isLoginPageVisible) {
    await page.goto('https://aiv.test.oneaiv.com:8086/aiv/');
    
    // Fill credentials
    await page.getByRole('textbox', { name: 'Your email' }).fill('ankit');
    await page.getByRole('textbox', { name: 'Password' }).fill('password');
    
    // Click Login and wait for loading
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 60000 }),
      page.getByRole('button', { name: 'Login' }).click({ timeout: 60000 })
    ]);
  }

  // Wait until the loader disappears (if present)
  const loader = page.locator('.aiv-viz-loader-wrap');
  if (await loader.count()) {
    await loader.first().waitFor({
      state: 'hidden',
      timeout: 60000
    }).catch(() => {
      console.log('Loader did not disappear, continuing...');
    });
  }
}

/**
 * Navigates to the visualization dashboard directory.
 * @param {import('@playwright/test').Page} page 
 */
export async function goToDashboard(page) {
  await page.goto('https://aiv.test.oneaiv.com:8086/aiv/Visualization/GridDashboard', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
}

/**
 * Handles creation of a visualization dashboard.
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
export async function createViz(page, name) {
  const createBtn = page.getByRole('button', { name: /Create Viz/i }).first();
  await createBtn.click({ timeout: 15000 });

  const createDialog = page.getByRole('dialog').first();
  const nameInput = createDialog.getByRole('textbox').first();
  await nameInput.waitFor({ state: 'visible', timeout: 15000 });
  await nameInput.fill(name);

  const createFileBtn = createDialog.getByRole('button', { name: /Create File/i }).first();
  await createFileBtn.click({ timeout: 15000 });

  // Wait for the URL redirection to /viz-edit/
  await page.waitForURL(/\/viz-edit\//, { timeout: 120000 });
}

/**
 * Reorders items within an Angular CDK drag-and-drop list by visible text.
 * Uses low-level mouse events with intermediate steps — required for Angular CDK
 * to register the drag gesture correctly.
 * @param {import('@playwright/test').Page} page
 * @param {string} sourceText - Visible text of the item to drag
 * @param {string} targetText - Visible text of the item to drop onto
 * @param {string} [listSelector='li.cdk-drag'] - CSS selector for draggable items
 */
export async function reorderCdkColumn(page, sourceText, targetText, listSelector = 'li.cdk-drag') {
  const source = page.locator(listSelector).filter({ hasText: sourceText }).first();
  const target = page.locator(listSelector).filter({ hasText: targetText }).first();

  await source.waitFor({ state: 'visible', timeout: 10000 });
  await target.waitFor({ state: 'visible', timeout: 10000 });

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (sourceBox && targetBox) {
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    );
    await page.mouse.down();
    // steps: 10 is critical — CDK needs gradual movement to detect the gesture
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 }
    );
    await page.mouse.up();
    await page.waitForTimeout(500); // Let CDK settle the new order
  } else {
    throw new Error(
      `Could not get bounding boxes for drag: "${sourceText}" → "${targetText}"`
    );
  }
}

/**
 * Drags a source locator onto a target locator using CDK-aware low-level mouse
 * events. Automatically falls back to Playwright's built-in dragTo on error.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} source
 * @param {import('@playwright/test').Locator} target
 * @param {{ steps?: number, waitAfter?: number }} [options]
 */
export async function dragColumnTo(page, source, target, options = {}) {
  const { steps = 15, waitAfter = 500 } = options;

  await source.waitFor({ state: 'visible', timeout: 10000 });
  await target.waitFor({ state: 'visible', timeout: 10000 });

  try {
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) throw new Error('Missing bounding box');

    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps }
    );
    await page.mouse.up();
    await page.waitForTimeout(waitAfter);
  } catch {
    // Fallback to Playwright built-in dragTo
    await source.dragTo(target, { force: true });
    await page.waitForTimeout(waitAfter);
  }
}
