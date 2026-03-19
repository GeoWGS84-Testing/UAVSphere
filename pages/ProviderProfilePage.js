const fs = require('fs');
const path = require('path');
const { robustClick, highlight, showStep, fastWait, logInfo } = require('../utils/helpers');

class ProviderProfilePage {
  constructor(page) {
    this.page = page;

    // Edit Button (Visible if profile already exists)
    this.editDetailsBtn = page.getByRole('button', { name: /Edit User Details/i });

    // Form Inputs
    this.logoInput = page.locator('input[name="company_logo"]');
    this.companyInput = page.locator('input[name="company"]');
    this.websiteInput = page.locator('input[name="companywebsite"]');
    this.detailsInput = page.locator('textarea[name="companydetails"]');
    this.firstNameInput = page.locator('input[name="firstname"]');
    this.lastNameInput = page.locator('input[name="lastname"]');
    this.phoneInput = page.locator('input[name="phonenumber"]');
    this.addressInput = page.locator('input[name="address"]');
    this.cityInput = page.locator('input[id="react-select-2-input"]'); 
    this.stateInput = page.locator('input[name="state"]');
    this.zipInput = page.locator('input[name="ZIPCode"]');
    this.countrySelect = page.locator('select[name="country"]');

    // Action Button
    this.goToStep5Btn = page.getByRole('button', { name: /Go to Step 5/i });
  }

  async fillCompanyProfile() {
    await showStep(this.page, 'Step 4: Filling Company Profile');

    // 1. Wait for the page container to ensure the profile page has loaded
    await this.page.locator('.user-profile-container').waitFor({ state: 'visible', timeout: 10000 });

    // 2. Handle "Edit" state if profile exists
    // Use waitFor to ensure we give the button time to appear if the profile exists
    try {
      await this.editDetailsBtn.waitFor({ state: 'visible', timeout: 5000 });
      
      // If we reach here, the button is visible. Click it.
      await highlight(this.page, this.editDetailsBtn);
      await robustClick(this.page, this.editDetailsBtn);
      logInfo('Clicked "Edit User Details" to update profile.');
      
      // Wait for form to re-render/enable
      await fastWait(this.page, 1000);
    } catch (e) {
      // Button didn't show up in 5s, assume it's a new profile (already in edit mode)
      logInfo('Edit button not visible. Assuming new profile entry.');
    }

    // 3. Wait for the form fields to be ready
    await this.logoInput.waitFor({ state: 'visible', timeout: 60000 });
    logInfo('Company Profile form loaded.');

    // 4. Upload Logo
    const logoPath = path.join(process.cwd(), 'utils/test-data/test_image.jpg');
    if (!fs.existsSync(logoPath)) throw new Error(`Logo file not found: ${logoPath}`);
    
    await this.logoInput.setInputFiles(logoPath);
    logInfo('Uploaded company logo');

    // 5. Generate Unique Data
    const timestamp = Date.now();
    const companyName = `Indore Drones ${timestamp}`;
    const website = `www.indoredrones${timestamp}.com`;
    
    // 6. Fill Inputs
    await this.companyInput.fill(companyName);
    await highlight(this.page, this.companyInput);
    
    await this.websiteInput.fill(website);
    await this.detailsInput.fill('Leading drone service provider in Indore specializing in agricultural surveys and industrial inspections.');
    await this.firstNameInput.fill('Kapil');
    await this.lastNameInput.fill('Testing');
    await this.phoneInput.fill('9876543210');
    await this.addressInput.fill('123, Vijay Nagar, Sector A');
    
    // 7. Handle React Select for City
    await this.cityInput.click();
    await this.cityInput.fill('Indore');
    await fastWait(this.page, 500);
    await this.page.keyboard.press('Enter');
    logInfo('Selected City: Indore');

    await this.stateInput.fill('Madhya Pradesh');
    await this.zipInput.fill('452010');
    await this.countrySelect.selectOption({ label: 'India' });

    logInfo('Filled all company profile fields');

    const profileData = {
        company: companyName,
        website: website,
        city: 'Indore',
        state: 'Madhya Pradesh',
        country: 'India'
    };

    // 8. Click Button
    await fastWait(this.page, 500);
    await highlight(this.page, this.goToStep5Btn);
    
    await Promise.all([
      this.page.waitForURL('**/termsofuse', { timeout: 60000 }),
      robustClick(this.page, this.goToStep5Btn)
    ]);
    logInfo('Navigated to Step 5 (Terms)');

    return profileData;
  }
}

module.exports = { ProviderProfilePage };