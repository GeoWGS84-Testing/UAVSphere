// pages/ProviderTermsPage.js
const { robustClick, highlight, showStep, fastWait, logInfo } = require('../utils/helpers');

class ProviderTermsPage {
  constructor(page) {
    this.page = page;

    this.termsCheckbox = page.locator('#termsCheckbox');
    this.finishBtn = page.getByRole('button', { name: /Finish Your Registration/i });
  }

  async acceptTermsAndFinish() {
    await showStep(this.page, 'Step 5: Accepting Terms');

    await this.termsCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.termsCheckbox);
    await this.termsCheckbox.check();
    logInfo('Checked Terms and Conditions');

    await fastWait(this.page, 300);
    
    await highlight(this.page, this.finishBtn);
    await Promise.all([
      this.page.waitForURL('**/home', { timeout: 10000 }),
      robustClick(this.page, this.finishBtn)
    ]);
    logInfo('Registration Completed. Navigated to Home.');
  }
}

module.exports = { ProviderTermsPage };