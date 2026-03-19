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
    // 1. List Reporter: Prints to terminal
    ['list'], 
    
    // 2. HTML Reporter
    ['html', { open: 'never' }],
    
    // 3. JSON Reporter
    ['json', { outputFile: 'test-results/results.json' }],
    
    // 4. Custom Email Reporter: MUST be wrapped in brackets to be a "tuple"
    ['./reporters/email-reporter.cjs'] 
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
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'provider-chromium',
      testMatch: /droneProvider.spec.js/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'customer-chromium',
      testMatch: /droneCustomer.spec.js/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
