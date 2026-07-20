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
  // Wait for the app shell search field or menu button to verify successful login
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
    
    // Only navigate to the target url if it is different from the base landing URL
    const cleanUrl = url.replace(/\/$/, '');
    const cleanBaseUrl = BASE_URL.replace(/\/$/, '');
    if (cleanUrl !== cleanBaseUrl) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    }
  }

  // Wait for the app shell
  await Promise.race([
    page.locator("input[placeholder*='Search']").first().waitFor({ state: 'visible', timeout: 90000 }),
    page.locator('button.smenu_button').waitFor({ state: 'visible', timeout: 90000 }),
  ]);
  await page.waitForTimeout(1500);
}

async function shot(page: Page, name: string) {
  const finalDir = path.join('screenshots', 'testing_w_deepseek', 'embed_generate_with_selected_key');
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(finalDir, name), timeout: 15000 }).catch(() => {});
}

// ── Embed Spec ────────────────────────────────────────────────────────────────

test.describe('AIV Embed - Generate with selected key Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Only goTo is needed as it handles loading the page and logging in if the session is expired
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/');
    await page.waitForTimeout(1000);
  });

  test('embed_generate_with_selected_key', async ({ page }) => {
    test.setTimeout(120000);

    // Wait for spinner to hide
    await page.locator('.e-spinner-pane:visible, .e-spin-show:visible, [class*="spinner"]:visible').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1000);

    // Expand sidebar if closed
    const sidebarToggle = page.locator('button.smenu_button').first();
    const sidebar = page.locator('.sidebardiv').first();
    const isSidebarVisible = await sidebar.isVisible().catch(() => false);
    if (!isSidebarVisible && await sidebarToggle.isVisible()) {
      console.log('👉 Sidebar is closed. Expanding...');
      await sidebarToggle.click();
      await page.waitForTimeout(1000);
    }

    // Click the grid icon (List View) next to Dashboard
    console.log('👉 Locating and clicking the grid/List View icon next to Dashboard...');
    const gridIcon = page.locator('a[title="List View"], a[href*="GridDashboard"]').filter({ visible: true }).first();
    await expect(gridIcon).toBeVisible({ timeout: 15000 });
    await gridIcon.click();
    await page.waitForTimeout(2000);

    // Wait for GridDashboard page to load
    console.log('👉 Waiting for GridDashboard page to load...');
    await expect.poll(() => page.url(), { timeout: 60000 }).toContain('GridDashboard');
    await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});

    // Search for "AutoTest Viz"
    console.log('👉 Searching for "AutoTest Viz"...');
    const searchInput = page.locator("input[placeholder*='Search files and folders']").first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.click();
    await searchInput.clear();
    await searchInput.pressSequentially('AutoTest Viz', { delay: 100 });
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);
    await shot(page, '01-search-autotest-viz.png');

    // Locate the "AutoTest Viz" row
    console.log('👉 Locating the AutoTest Viz row...');
    const vizRow = page.locator('tr, [role="row"], [role="gridcell"], td').filter({ hasText: 'AutoTest Viz' }).first();
    await expect(vizRow).toBeVisible({ timeout: 15000 });

    // Right click on "AutoTest Viz" row to open context menu
    console.log('👉 Right-clicking on AutoTest Viz...');
    await vizRow.click({ button: 'right' });
    await page.waitForTimeout(1500);
    await shot(page, '02-context-menu.png');

    // Click on Embed in the context menu
    console.log('👉 Clicking on Embed option...');
    const embedOption = page.locator('.p-menuitem-text, .p-submenu-list span, .context-menu span, li[role="menuitem"] span').filter({ hasText: /^Embed$/ }).first()
      .or(page.getByText('Embed').first());
    await expect(embedOption).toBeVisible({ timeout: 10000 });
    await embedOption.click();

    // Wait 5 seconds to let all IDs load
    console.log('👉 Waiting 5 seconds for IDs to load in the dialog...');
    await page.waitForTimeout(5000);
    await shot(page, '03-embed-dialog-loaded.png');

    // Click on the checkbox of the first row/ID in the active links table
    console.log('👉 Selecting checkbox for the first ID in the table...');
    const firstCheckbox = page.locator('[role="dialog"] tbody tr .e-checkbox-wrapper').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 15000 });
    await firstCheckbox.click();
    await page.waitForTimeout(1500);
    await shot(page, '04-checkbox-selected.png');

    // Click on Generate with selected key button
    console.log('👉 Clicking Generate with selected key...');
    const genWithKeyBtn = page.locator('button').filter({ hasText: /^Generate with selected key$/ }).first()
      .or(page.getByRole('button', { name: 'Generate with selected key' }).first());
    await expect(genWithKeyBtn).toBeVisible({ timeout: 15000 });
    await genWithKeyBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, '05-generate-clicked.png');

    // Scroll down to show External Embed and take screenshot
    console.log('👉 Scrolling to External Embed section...');
    const textarea = page.locator('xpath=//span[@translate="label_external_embed"]/ancestor::div[1]/following-sibling::textarea').first();
    await textarea.scrollIntoViewIfNeeded({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, '06-external-embed-generated.png');

    console.log('✅ embed_generate_with_selected_key completed successfully!');
  });
});
