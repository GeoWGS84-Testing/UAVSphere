// playwright.config.js
require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'playwright/.auth/user.json');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, 
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, 
  reporter: [
    // 1. ADD THIS: Prints test progress to the terminal
    ['list'], 
    
    // 2. Existing reporters
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    './reporters/email-reporter.cjs'
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
    // 1. Setup Project
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },

    // 2. Provider Project
    {
      name: 'provider-chromium',
      testMatch: /droneProvider.spec.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },

    // 3. Customer Project
    {
      name: 'customer-chromium',
      testMatch: /droneCustomer.spec.js/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
