const { robustClick, highlight, showStep, fastWait, logInfo } = require('../utils/helpers');

class ProviderPayloadPage {
  constructor(page) {
    this.page = page;

    this.detailsTextarea = page.locator('textarea[name="postContent"]');
    this.goToStep4Btn = page.getByRole('button', { name: /Go to Step 4/i });
  }

  async fillPayloadDetails() {
    await showStep(this.page, 'Step 3: Filling Payload Details');

    const detailsText = `We operate a fleet of DJI Matrice 300 RTK drones equipped with Zenmuse H20T (Thermal), L1 LiDAR, and P1 payloads.`;

    await this.detailsTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.detailsTextarea);
    await this.detailsTextarea.fill(detailsText);
    logInfo('Filled drone payload details');

    await fastWait(this.page, 500);
    
    // Click Button and wait for navigation
    await highlight(this.page, this.goToStep4Btn);
    await Promise.all([
      this.page.waitForURL('**/list', { timeout: 10000 }),
      robustClick(this.page, this.goToStep4Btn)
    ]);
    logInfo('Navigated to Step 4 (Company Profile)');
  }
}

module.exports = { ProviderPayloadPage };