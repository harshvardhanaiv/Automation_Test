import { test, expect, Page } from '@playwright/test';

const BASE_URL      = 'https://aiv.test.oneaiv.com:8086/aiv/';
const API_TOKEN_URL = 'https://aiv.test.oneaiv.com:8086/aiv/ApiTokens';
const USERNAME      = 'Admin';
const PASSWORD      = 'Ganesh04';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector("input[placeholder='Your email']", { timeout: 15000 });
  await page.fill("input[placeholder='Your email']", USERNAME);
  await page.fill("input[placeholder='Password']", PASSWORD);
  await page.click("button:has-text('Login')");
  await page.waitForSelector(
    "input[placeholder='Search files and folders']",
    { timeout: 90000 }
  );
}

async function ensureLoggedIn(page: Page) {
  const onLoginPage = await page
    .locator("input[placeholder='Your email']")
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onLoginPage) await doLogin(page);
}

async function goTo(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const isOnLoginPage = await page
    .locator("input[placeholder='Your email']")
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isOnLoginPage) {
    await doLogin(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await expect(
    page.getByPlaceholder('Search files and folders')
  ).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(1500);
}

async function safeScreenshot(page: Page, screenshotPath: string) {
  await page.screenshot({ path: screenshotPath, timeout: 10000 }).catch(() => {});
}

// ═════════════════════════════════════════════════════════════════════════════
//  API TOKEN
// ═════════════════════════════════════════════════════════════════════════════

test.describe.serial('API Token', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('Create API Token and Revoke it', async ({ page }) => {
    await goTo(page, API_TOKEN_URL);
    await safeScreenshot(page, 'screenshots/api-token-01-before-create.png');

    // ── Step 1: note how many Revoke buttons exist before creating ───────────
    // "Revoke" is rendered as a PrimeNG <button> with a <span class="p-button-label"> inside
    const revokeButtons = page.getByRole('button', { name: 'Revoke' });
    const countBefore = await revokeButtons.count();

    // ── Step 2: fill in the token name (id="Name1") and click "Create API token" ──
    const createBtn = page.getByRole('button', { name: 'Create API token' });
    await createBtn.waitFor({ state: 'visible', timeout: 15000 });

    const tokenNameInput = page.locator('#Name1');
    await tokenNameInput.waitFor({ state: 'visible', timeout: 15000 });
    const tokenName = 'auto_token_' + Date.now();
    await tokenNameInput.fill(tokenName);

    await safeScreenshot(page, 'screenshots/api-token-02-name-filled.png');

    await createBtn.click();
    await page.waitForTimeout(2000);
    await safeScreenshot(page, 'screenshots/api-token-03-created.png');

    // ── Step 3: verify a new Revoke button appeared ───────────────────────────
    await expect(revokeButtons).toHaveCount(countBefore + 1, { timeout: 15000 });

    // ── Step 4: revoke the newest token (last Revoke button in the table) ─────
    const lastRevoke = revokeButtons.last();
    await lastRevoke.waitFor({ state: 'visible', timeout: 10000 });
    await lastRevoke.click();
    await page.waitForTimeout(2000);
    await safeScreenshot(page, 'screenshots/api-token-04-revoked.png');

    // ── Step 5: verify the count is back to what it was ──────────────────────
    await expect(revokeButtons).toHaveCount(countBefore, { timeout: 15000 });
  });

});
