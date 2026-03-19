// tests/auth.setup.js
const { test } = require('./common');
const { ProviderLoginPage } = require('../pages/ProviderLoginPage');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '../playwright/.auth/user.json');

test('authenticate as drone provider', async ({ page }) => {
  const loginPage = new ProviderLoginPage(page);
  
  // 1. Navigate and Click Provider Button
  await loginPage.navigate();
  await loginPage.clickProviderButton();

  // 2. Login with credentials from .env
  const email = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  // Basic validation to ensure variables are loaded
  if (!email || !password) {
    throw new Error('TEST_USERNAME or TEST_PASSWORD is missing from .env file');
  }

  await loginPage.login(email, password);

  // 3. Verify we are on the Home page
  await page.waitForURL('**/home', { timeout: 5000 });
  console.log(`[SETUP] Successfully landed on Home page.`);

  // 4. Save the authentication state
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[SETUP] Authentication state saved to: ${AUTH_FILE}`);
});