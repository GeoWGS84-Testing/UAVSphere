// pages/ProviderLoginPage.js
const { robustClick, waitAndFill, highlight, showStep, fastWait, logInfo } = require('../utils/helpers');

class ProviderLoginPage {
  constructor(page) {
    this.page = page;

    // Landing page
    this.droneProviderBtn = page.getByRole('button', { name: /are you a drone provider\?/i });

    // Login Form
    this.usernameInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginBtn = page.getByRole('button', { name: 'Login' });
  }

  async navigate() {
    await this.page.goto('https://portal.uavsphere.com/', { waitUntil: 'networkidle' });
  }

  async clickProviderButton() {
    await showStep(this.page, 'Clicking "Are you a drone provider?" button');
    await robustClick(this.page, this.droneProviderBtn);
    // Wait for navigation to login page
    await this.page.waitForURL('**/account/login**', { timeout: 10000 });
    logInfo('Navigated to Provider Login Page');
  }

  async login(username, password) {
    await showStep(this.page, 'Performing Login');

    // Fill Username
    await this.usernameInput.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.usernameInput);
    await this.usernameInput.fill(username);
    logInfo('Filled Username');

    // Fill Password
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.passwordInput);
    await this.passwordInput.fill(password);
    logInfo('Filled Password');

    // Click Login
    await highlight(this.page, this.loginBtn);
    
    // Wait for navigation to /home
    await Promise.all([
      this.page.waitForURL('**/home', { timeout: 15000 }),
      this.loginBtn.click()
    ]);
    
    logInfo('Login successful, navigated to Home page');
  }
}

module.exports = { ProviderLoginPage };