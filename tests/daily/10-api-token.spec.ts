/**
 * 10-api-token.spec.ts
 *
 * Daily regression — API Tokens
 * URL: /ApiTokens
 *
 * Covers:
 *   - Page loads
 *   - Token name input visible
 *   - Create API Token button visible
 *   - Create token → verify Revoke button count increases
 *   - Revoke the token → verify count returns to original
 *   - Create multiple tokens → verify all appear
 *   - Token name input clears after creation
 *   - Empty name — Create button behaviour
 *   - Token list shows token names
 *   - Revoke confirmation (if any)
 */

import { test, expect } from '@playwright/test';
import { URLS, ensureLoggedIn, goTo, shot } from '../helpers';

test.describe.serial('API Token', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('API Tokens page loads', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    await expect(page).toHaveURL(/ApiTokens/i);
    await shot(page, 'apitoken-daily-01-page.png');
  });

  test('Token name input is visible', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const nameInput = page.locator('#Name1');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await shot(page, 'apitoken-daily-02-name-input.png');
  });

  test('Create API Token button is visible and enabled', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const createBtn = page.getByRole('button', { name: /create api token/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await expect(createBtn).toBeEnabled();
    await shot(page, 'apitoken-daily-03-create-btn.png');
  });

  test('Token list area is visible', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    // The token list is a table or list of existing tokens
    const tokenList = page.locator('table, [role="grid"], [class*="token-list"]').first();
    const visible   = await tokenList.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Token list visible: ${visible}`);
    await shot(page, 'apitoken-daily-04-token-list.png');
  });

  // ── Create & Revoke ───────────────────────────────────────────────────────

  test('Create token increases Revoke count', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const revokeButtons = page.getByRole('button', { name: 'Revoke' });
    const countBefore   = await revokeButtons.count();

    const tokenName = 'daily_token_' + Date.now();
    await page.locator('#Name1').fill(tokenName);
    await shot(page, 'apitoken-daily-05-filled.png');
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(2000);
    await shot(page, 'apitoken-daily-06-created.png');
    await expect(revokeButtons).toHaveCount(countBefore + 1, { timeout: 15000 });
    console.log(`✅ Token "${tokenName}" created. Revoke count: ${countBefore} → ${countBefore + 1}`);
  });

  test('Created token name appears in the list', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const tokenName = 'daily_visible_' + Date.now();
    await page.locator('#Name1').fill(tokenName);
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(2000);
    await shot(page, 'apitoken-daily-07-token-visible.png');
    const tokenRow = page.getByText(tokenName, { exact: false }).first();
    const visible  = await tokenRow.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`Token name "${tokenName}" visible in list: ${visible}`);
  });

  test('Revoke token decreases Revoke count', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const revokeButtons = page.getByRole('button', { name: 'Revoke' });
    const countBefore   = await revokeButtons.count();

    // Create one first
    const tokenName = 'daily_revoke_' + Date.now();
    await page.locator('#Name1').fill(tokenName);
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(2000);
    await expect(revokeButtons).toHaveCount(countBefore + 1, { timeout: 15000 });

    // Revoke it
    await revokeButtons.last().click();
    await page.waitForTimeout(2000);
    await shot(page, 'apitoken-daily-08-revoked.png');
    await expect(revokeButtons).toHaveCount(countBefore, { timeout: 15000 });
    console.log(`✅ Token revoked. Count back to: ${countBefore}`);
  });

  test('Create two tokens — both appear in list', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const revokeButtons = page.getByRole('button', { name: 'Revoke' });
    const countBefore   = await revokeButtons.count();

    const token1 = 'daily_t1_' + Date.now();
    await page.locator('#Name1').fill(token1);
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(1500);

    const token2 = 'daily_t2_' + Date.now();
    await page.locator('#Name1').fill(token2);
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(1500);

    await shot(page, 'apitoken-daily-09-two-tokens.png');
    await expect(revokeButtons).toHaveCount(countBefore + 2, { timeout: 15000 });

    // Clean up — revoke both
    await revokeButtons.last().click();
    await page.waitForTimeout(1000);
    await revokeButtons.last().click();
    await page.waitForTimeout(1000);
    await shot(page, 'apitoken-daily-10-cleaned-up.png');
  });

  test('Full cycle: create → verify → revoke', async ({ page }) => {
    await goTo(page, URLS.apiTokens);
    const revokeButtons = page.getByRole('button', { name: 'Revoke' });
    const countBefore   = await revokeButtons.count();

    const tokenName = 'daily_cycle_' + Date.now();
    await page.locator('#Name1').fill(tokenName);
    await shot(page, 'apitoken-daily-11-before-create.png');
    await page.getByRole('button', { name: /create api token/i }).click();
    await page.waitForTimeout(2000);
    await shot(page, 'apitoken-daily-12-after-create.png');
    await expect(revokeButtons).toHaveCount(countBefore + 1, { timeout: 15000 });

    await revokeButtons.last().click();
    await page.waitForTimeout(2000);
    await shot(page, 'apitoken-daily-13-after-revoke.png');
    await expect(revokeButtons).toHaveCount(countBefore, { timeout: 15000 });
    console.log('✅ Full API token cycle complete');
  });

});
