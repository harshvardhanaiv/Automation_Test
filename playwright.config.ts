import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const AUTH_FILE = path.join(process.cwd(), '.auth', 'session.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 180000,
  globalSetup: './ai/globalSetup.ts', // login once, save session
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    ignoreHTTPSErrors: true,
    storageState: AUTH_FILE, // reuse saved session for every test
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
