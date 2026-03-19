// pages/ProviderServicesPage.js
const { robustClick, highlight, showStep, fastWait, logInfo } = require('../utils/helpers');

class ProviderServicesPage {
  constructor(page) {
    this.page = page;

    // Checkboxes for Drone Types
    this.imageryRgbCheckbox = page.locator('input[value="Imagery-RGB"]');
    this.lidarCheckbox = page.locator('input[value="LiDAR"]');

    // Checkboxes for Services
    this.droneImageryCheckbox = page.locator('input[value="Drone imagery collection"]');
    this.lidarDataCheckbox = page.locator('input[value="LiDAR data collection"]');
    this.thermalDataCheckbox = page.locator('input[value="Thermal data collection"]');

    // Action Button
    this.goToStep3Btn = page.getByRole('button', { name: /Go to Step-3/i });
  }

  async selectServices() {
    await showStep(this.page, 'Step 2: Selecting Services');

    // Select Drone Types
    await this.imageryRgbCheckbox.check();
    await highlight(this.page, this.imageryRgbCheckbox);
    await this.lidarCheckbox.check();
    await highlight(this.page, this.lidarCheckbox);
    logInfo('Selected Drone Types: Imagery-RGB, LiDAR');

    // Select Services
    await this.droneImageryCheckbox.check();
    await highlight(this.page, this.droneImageryCheckbox);
    await this.lidarDataCheckbox.check();
    await highlight(this.page, this.lidarDataCheckbox);
    await this.thermalDataCheckbox.check();
    await highlight(this.page, this.thermalDataCheckbox);
    logInfo('Selected Services: Drone imagery, LiDAR data, Thermal data');

    // Click Button
    await fastWait(this.page, 500);
    await highlight(this.page, this.goToStep3Btn);
    // Wait for navigation
    await Promise.all([
      this.page.waitForURL('**/dronepayload', { timeout: 10000 }),
      robustClick(this.page, this.goToStep3Btn)
    ]);
    logInfo('Navigated to Step 3 (Drone Payload)');
  }
}

module.exports = { ProviderServicesPage };