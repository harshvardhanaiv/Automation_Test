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

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector("input[name='username']", { timeout: 30000 });
    await page.fill("input[name='username']", USERNAME);
    await page.fill("input[name='password']", PASSWORD);
    await page.click("button:has-text('Login')");
    await page.waitForSelector(
        "input[placeholder='Search files and folders in All sections']",
        { timeout: 60000 }
    );

    // Save session state
    await context.storageState({ path: AUTH_FILE });
    await browser.close();

    console.log(`✅ Session saved to ${AUTH_FILE}\n`);
}
