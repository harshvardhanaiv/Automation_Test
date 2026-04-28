/**
 * globalSetup.ts
 *
 * Runs once before the entire test suite.
 * Logs into the AIV application and saves the session (cookies + localStorage)
 * to .auth/session.json so individual tests can reuse it without logging in again.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL  = 'https://aiv.test.oneaiv.com:8086/aiv/';
const USERNAME  = 'Admin';
const PASSWORD  = 'Ganesh04';
const AUTH_FILE = path.join(process.cwd(), '.auth', 'session.json');

export default async function globalSetup(_config: FullConfig) {
    // Ensure .auth directory exists
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    console.log('\n🔐 Global setup: logging in once to save session...');

    // Run headless:false so the full browser stack initialises (avoids SSL/CORS
    // issues that sometimes block headless Chromium on self-signed certs).
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();

    // ── Navigate to login page ────────────────────────────────────────────
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Support both login form variants:
    //   - placeholder="Your email"  (newer builds)
    //   - name="username"           (older builds)
    const usernameInput = page
        .locator("input[placeholder='Your email'], input[name='username']")
        .first();
    await usernameInput.waitFor({ state: 'visible', timeout: 30000 });

    await usernameInput.fill(USERNAME);
    await page.locator("input[placeholder='Password'], input[name='password']").first().fill(PASSWORD);
    await page.locator("button:has-text('Login')").click();

    // ── Wait for the app shell to appear ──────────────────────────────────
    // Give the Angular app up to 3 minutes — slow servers need this.
    // We wait for either the search box OR the hamburger menu button,
    // whichever appears first.
    await Promise.race([
        page.waitForSelector(
            "input[placeholder='Search files and folders']",
            { timeout: 180000 }
        ),
        page.waitForSelector(
            "button.smenu_button, mat-toolbar button",
            { timeout: 180000 }
        ),
    ]);

    // Extra settle time for Angular to finish routing
    await page.waitForTimeout(2000);

    // ── Save session state ────────────────────────────────────────────────
    await context.storageState({ path: AUTH_FILE });
    await browser.close();

    console.log(`✅ Session saved to ${AUTH_FILE}\n`);
}
