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
  const finalDir = path.join('screenshots', 'testing_w_deepseek', 'embed');
  try {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(finalDir, name), timeout: 15000 }).catch(() => {});
}

// ── Embed Spec ────────────────────────────────────────────────────────────────

test.describe('AIV Embed - Part 1 Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Only goTo is needed as it handles loading the page and logging in if the session is expired
    await goTo(page, 'https://aiv.test.oneaiv.com:8086/aiv/');
    await page.waitForTimeout(1000);
  });

  test('embed_part1', async ({ page }) => {
    // Increase test timeout to 4 minutes to allow the 1-minute wait for viz load
    test.setTimeout(240000);

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

    // Capture initial home page screenshot
    await shot(page, '01-home-sidebar.png');

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
    await shot(page, '02-dashboard-list.png');

    // Search for "AutoTest"
    console.log('👉 Searching for "AutoTest"...');
    const searchInput = page.locator("input[placeholder*='Search files and folders']").first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.click();
    await searchInput.clear();
    await searchInput.pressSequentially('AutoTest', { delay: 100 });
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);
    await shot(page, '03-search-autotest.png');

    // Locate the "AutoTest Viz" row
    console.log('👉 Locating the AutoTest Viz row...');
    const vizRow = page.locator('tr, [role="row"], [role="gridcell"], td').filter({ hasText: 'AutoTest Viz' }).first();
    await expect(vizRow).toBeVisible({ timeout: 15000 });

    // Right click on "AutoTest Viz" row to open context menu
    console.log('👉 Right-clicking on AutoTest Viz...');
    await vizRow.click({ button: 'right' });
    await page.waitForTimeout(1500);
    await shot(page, '04-context-menu.png');

    // Click on Embed in the context menu
    console.log('👉 Clicking on Embed option...');
    const embedOption = page.locator('.p-menuitem-text, .p-submenu-list span, .context-menu span, li[role="menuitem"] span').filter({ hasText: /^Embed$/ }).first()
      .or(page.getByText('Embed').first());
    await expect(embedOption).toBeVisible({ timeout: 10000 });
    await embedOption.click();
    await page.waitForTimeout(2500);

    // Capture the final Embed screen screenshot
    console.log('👉 Capturing final Embed screen...');
    await shot(page, '05-embed-screen.png');

    console.log('✅ Embed Part 1 completed successfully!');

    // ── Part 2 ───────────────────────────────────────────────────────────────────

    // Click the Generate button
    console.log('👉 Clicking the Generate button...');
    const generateBtn = page.locator('button').filter({ hasText: /^Generate$/ }).first()
      .or(page.locator('p-dialog button').filter({ hasText: /^Generate$/ }).first());
    await expect(generateBtn).toBeVisible({ timeout: 15000 });
    await generateBtn.click();
    await page.waitForTimeout(4000);
    await shot(page, '06-generate-clicked.png');

    // Find External Embed textarea and copy button, scroll into view
    console.log('👉 Locating External Embed textarea and scroll into view...');
    const textarea = page.locator('xpath=//span[@translate="label_external_embed"]/ancestor::div[1]/following-sibling::textarea').first();
    await textarea.scrollIntoViewIfNeeded({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await shot(page, '07-external-embed-visible.png');

    // Click the copy button
    console.log('👉 Clicking copy button next to External Embed...');
    const copyBtn = page.locator('xpath=//span[@translate="label_external_embed"]/ancestor::div[1]//p-button[@icon="fa-light fa-copy fa-fw"]//button').first();
    await expect(copyBtn).toBeVisible({ timeout: 15000 });
    await copyBtn.click();
    await page.waitForTimeout(1000);

    // Get the exact URL from the textarea
    const embedUrl = await textarea.inputValue();
    console.log(`👉 Embed URL to open: ${embedUrl}`);

    // Open a new tab (new page in the same context) and paste/load the link
    console.log('👉 Opening a new tab to load the embed URL...');
    const newPage = await page.context().newPage();
    
    // Set the viewport size to match standard
    await newPage.setViewportSize({ width: 1600, height: 900 }).catch(() => {});
    
    await newPage.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(2000);
    await shot(newPage, '08-new-tab-pasted.png');

    // Wait 1 minute (60 seconds) for the viz to open completely
    console.log('👉 Waiting 1 minute (60 seconds) for the viz to open completely...');
    await newPage.waitForTimeout(60000);
    await shot(newPage, '09-embed-viz-loaded.png');

    // Close the new page/tab
    await newPage.close();

    console.log('✅ Embed Part 2 completed successfully!');
  });
});
