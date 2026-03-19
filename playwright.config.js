// playwright.config.js
require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'playwright/.auth/user.json');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // Set to false to ensure setup runs first
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Force 1 worker to ensure setup completes before tests
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'https://portal.uavsphere.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 10000,
    viewport: { width: 1440, height: 900 }, 
    timeout: 800000, 
  },

  projects: [
    // 1. Setup Project: Authenticates the Provider and saves state
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },

    // 2. Provider Project: Uses the saved authentication state
    {
      name: 'provider-chromium',
      testMatch: /droneProvider.spec.js/, // Only runs provider tests
      use: { 
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE, // <--- ONLY Provider tests use this
      },
      dependencies: ['setup'], // Depends on setup
      launchOptions: { args: ['--start-maximized'] }

    },

    // 3. Customer Project: Starts fresh (No auth state)
    {
      name: 'customer-chromium',
      testMatch: /droneCustomer.spec.js/, // Only runs customer tests
      use: { 
        ...devices['Desktop Chrome'],
        // No storageState here! Starts with a clean browser.
      },
      // No dependency on 'setup'
      launchOptions: { args: ['--start-maximized'] }

    },
  ],
});
