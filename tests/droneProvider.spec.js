// tests/droneProvider.spec.js
const { test, expect } = require('./common');
const { showStep, logInfo } = require('../utils/helpers');
const { ProviderRegistrationPage } = require('../pages/ProviderRegistrationPage');
const { MapPage } = require('../pages/MapPage');
const { ProviderServicesPage } = require('../pages/ProviderServicesPage');
const { ProviderPayloadPage } = require('../pages/ProviderPayloadPage');
const { ProviderProfilePage } = require('../pages/ProviderProfilePage');
const { ProviderTermsPage } = require('../pages/ProviderTermsPage');
const { ProviderDashboardPage } = require('../pages/ProviderDashboardPage');

let savedTestData = {};

test.describe('Drone Provider Flow', () => {
  
  test('[P1] TC-01: should complete full Provider Registration', async ({ page }) => {
    // Set timeout to 15 minutes for this long flow
    test.setTimeout(900000);

    // Initialize Page Objects
    const registrationPage = new ProviderRegistrationPage(page);
    const mapPage = new MapPage(page);
    const servicesPage = new ProviderServicesPage(page);
    const payloadPage = new ProviderPayloadPage(page);
    const profilePage = new ProviderProfilePage(page);
    const termsPage = new ProviderTermsPage(page);
    const dashboardPage = new ProviderDashboardPage(page);

    // ==========================================
    // PART 1: REGISTRATION FLOW
    // ==========================================

    // --- Step 1: Location ---
    await page.goto('/home');
    await showStep(page, 'Step 1: Verify Home Page Access');
    await expect(page).toHaveURL(/.*\/home/);

    await registrationPage.checkDashboardState();
    await registrationPage.clickStep1();
    await expect(page).toHaveURL(/.*\/maps/); 

    await mapPage.searchProviderLocation('Vijay nagar');
    await mapPage.performProviderAOI(); 

    // --- Step 2: Services ---
    await servicesPage.selectServices(); 

    // --- Step 3: Payload Details ---
    await payloadPage.fillPayloadDetails(); 

    // --- Step 4: Company Profile ---
    // savedTestData now contains the company name
    savedTestData = await profilePage.fillCompanyProfile(); 

    // --- Step 5: Terms & Conditions ---
    await termsPage.acceptTermsAndFinish(); 

    // ==========================================
    // PART 2: POST-REGISTRATION VERIFICATION
    // ==========================================

    // 1. Verify we are on the dashboard
    await dashboardPage.verifyDashboardState();

    // 2. Verify all 5 steps are marked as Completed
    await dashboardPage.verifyAllStepsCompleted();

    // 3. Click Logout
    await dashboardPage.clickLogout();
    
    // Verify we are on the landing page
    await expect(page).toHaveURL('https://portal.uavsphere.com/');

    // ==========================================
    // PART 3: CUSTOMER SEARCH FLOW
    // ==========================================

    // 4. Click "Are you a drone customer?"
    await mapPage.clickDroneCustomer();
    
    // Verify navigation to map
    await expect(page).toHaveURL(/.*\/map/);

    // 5. Click Country Dropdown Icon
    await mapPage.clickCountryDropdownIcon();

    // 6. Select India
    await mapPage.selectCountry('India');

    // 7. Click the Search Button on the map
    await mapPage.clickSearchPilotsMainButton();

    // 8. Wait for "Show Providers" button (Max 10 mins) and click
    await mapPage.clickShowProvidersButton();

    // 9. Verify the partner appears in the list
    // We construct the expected location string based on saved data
    const expectedLocation = `${savedTestData.city}, ${savedTestData.state}, ${savedTestData.country}, ${savedTestData.country}`;
    
    await mapPage.verifyPartnerInList(
      savedTestData.company, 
      expectedLocation
    );

    logInfo('Test Data Saved', savedTestData);
    await showStep(page, 'Test completed successfully - Provider Registered and Verified as Customer');
  });

});