import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const AUTH_FILE = path.join(process.cwd(), '.auth', 'session.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 4 : 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  timeout: 180000,
  globalSetup: './ai/globalSetup.ts',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    ignoreHTTPSErrors: true,
    storageState: AUTH_FILE,
    viewport: { width: 1600, height: 900 },
    launchOptions: {
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    },
  },
  projects: [
    // ── Playwright-bundled Chromium (default, no install needed) ──────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
    },

    // ── System Google Chrome ──────────────────────────────────────────────
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },

    // ── Microsoft Edge ────────────────────────────────────────────────────
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },

    // ── Firefox (requires: npx playwright install firefox) ───────────────
    // Uncomment once Firefox is installed on this machine
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // ── Mobile viewports ──────────────────────────────────────────────────
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});
