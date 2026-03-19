// pages/ProviderRegistrationPage.js
const { robustClick, highlight, showStep, fastWait, logInfo, addWarning } = require('../utils/helpers');

class ProviderRegistrationPage {
  constructor(page) {
    this.page = page;

    // Registration Dashboard Elements
    // Use flexible text matching (substring) to handle slight variations
    this.incompleteMessage = page.locator('.incomplete-message').getByText('complete your registration', { exact: false });
    this.reviewMessage = page.locator('.review-message').getByText('under review', { exact: false });
    
    this.step1Container = page.locator('.step-container', { hasText: 'Step 1' });
    
    // Map Search Input
    this.searchInput = page.locator('.pac-target-input');
  }

  async checkDashboardState() {
    await showStep(this.page, 'Checking Dashboard State');

    // 1. Wait for the general dashboard container to ensure page is loaded
    // We wait for Step 1 container to be visible as an anchor
    try {
      await this.step1Container.waitFor({ state: 'visible', timeout: 15000 });
    } catch (e) {
      throw new Error('Dashboard failed to load: Step 1 container not found.');
    }

    // 2. Check for Incomplete Message (Fresh Account)
    // Increasing timeout to 10s to account for rendering delays
    const isIncomplete = await this.incompleteMessage.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isIncomplete) {
      await highlight(this.page, this.incompleteMessage);
      logInfo('Incomplete registration detected. Proceeding with setup.');
      return;
    }

    // 3. Check for Review Message (Already Registered)
    const isReview = await this.reviewMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isReview) {
      await highlight(this.page, this.reviewMessage);
      logInfo('Account is already "Under Review". Proceeding to update data.');
      return;
    }

    // 4. Fallback Debug
    // If neither specific message is found, try to see if Step 1 says "Completed"
    const step1Text = await this.step1Container.textContent();
    if (step1Text.includes('Completed')) {
        logInfo('Step 1 detected as Completed. Proceeding in update mode.');
        return;
    }

    // If really unknown
    throw new Error(`UNKNOWN_STATE: Neither "Incomplete Registration" nor "Under Review" messages found. Step 1 Text: ${step1Text}`);
  }

  async clickStep1() {
    await showStep(this.page, 'Clicking Step 1: Select Location');
    
    await highlight(this.page, this.step1Container);
    await robustClick(this.page, this.step1Container);
    
    // Wait for navigation to maps
    await this.page.waitForURL('**/maps', { timeout: 10000 });
    logInfo('Navigated to Maps page');

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for the search input to be visible
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    logInfo('Map search input is visible. Map UI is ready.');
    await fastWait(this.page, 1000);
  }
}

module.exports = { ProviderRegistrationPage };