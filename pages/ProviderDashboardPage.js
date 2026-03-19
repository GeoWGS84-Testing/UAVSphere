// pages/ProviderDashboardPage.js
const { highlight, showStep, logInfo } = require('../utils/helpers');
const { expect } = require('@playwright/test');

class ProviderDashboardPage {
  constructor(page) {
    this.page = page;

    // Welcome Message
    this.welcomeMessage = page.locator('h1.welcome-message');
    
    // Step Containers
    this.stepContainer = page.locator('.step-container');
    
    // Logout Button
    this.logoutBtn = page.getByRole('button', { name: 'Logout' });
  }

  /**
   * Verifies the landing state after registration.
   * Checks URL and Welcome Message.
   */
  async verifyDashboardState() {
    await showStep(this.page, 'Verifying Dashboard State');

    // 1. Verify URL
    await expect(this.page).toHaveURL(/.*\/home/, { timeout: 15000 });

    // 2. Verify Welcome Message is visible
    await expect(this.welcomeMessage).toBeVisible({ timeout: 10000 });
    await highlight(this.page, this.welcomeMessage);
    logInfo('Welcome message verified.');
  }

  /**
   * Verifies that all 5 registration steps are marked as "Completed".
   */
  async verifyAllStepsCompleted() {
    await showStep(this.page, 'Verifying all steps are Completed');

    // Wait for steps to load
    await this.stepContainer.first().waitFor({ state: 'visible', timeout: 10000 });

    // Count the number of completed steps
    // The class is "step-container completed"
    const completedSteps = await this.page.locator('.step-container.completed').count();
    
    // Assert count is 5
    expect(completedSteps).toBe(5);
    logInfo(`All 5 steps verified as Completed.`);
  }

  /**
   * Clicks the Logout button and waits for navigation.
   */
  async clickLogout() {
    await showStep(this.page, 'Clicking Logout Button');
    
    await expect(this.logoutBtn).toBeVisible({ timeout: 5000 });
    await highlight(this.page, this.logoutBtn);
    
    // Click and wait for navigation to landing page
    await Promise.all([
      this.page.waitForURL('https://portal.uavsphere.com/', { timeout: 10000 }),
      this.logoutBtn.click()
    ]);
    
    logInfo('Logged out successfully. Returned to Landing Page.');
  }
}

module.exports = { ProviderDashboardPage };