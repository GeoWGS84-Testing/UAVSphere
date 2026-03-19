// tests/droneCustomer.spec.js
const { test, expect } = require('./common');
const { MapPage } = require('../pages/MapPage');
const { showStep, logInfo } = require('../utils/helpers');

test.describe('Drone Customer Flow', () => {
  let mapPage;

  test.beforeEach(async ({ page }) => {
    mapPage = new MapPage(page);
    await mapPage.navigate();
  });
  
  test('[P1] TC-01: should search location, draw AOI, handle size alert, and submit', async ({ page }) => {
    // Set timeout to 15 minutes to accommodate the 10 min wait + retries
    test.setTimeout(900000);

    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Search
    await mapPage.searchLocation('Indore');

    // Step 3: Draw AOI & Search (Clicks initial search button)
    await mapPage.performAOISearch();

    // Step 4: Wait for Processing (Max 10 mins) and Click "Show Providers"
    await mapPage.clickShowProvidersButton();

    // Step 5: Verify Sidebar
    await mapPage.verifySearchResultsSidebar();

    await showStep(page, 'Test completed successfully');
  });

  test('[P1] TC-02: should open coordinate popup, fill details, and navigate', async ({ page }) => {
    // Standard timeout is fine for this quick test
    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Open Coordinates Popup
    await mapPage.clickCoordinatesIcon();
    await expect(mapPage.coordinatesPopup).toBeVisible();

    // Step 3: Fill Coordinates
    const latitude = '22.7196';
    const longitude = '75.8577';
    await mapPage.fillCoordinates(latitude, longitude);

    // Step 4: Click "Take Me"
    await mapPage.clickTakeMe();

    // Step 5: Validate Location Marker
    const markerFound = await mapPage.verifyLocationMarker();
    expect(markerFound).toBeTruthy();

    await showStep(page, 'Test completed successfully - Navigated to coordinates');
  });

  test('[P1] TC-03: should navigate to current location using mock coordinates', async ({ page }) => {
    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Setup Mock Location
    const mockLatitude = 22.7196;
    const mockLongitude = 75.8577;
    await mapPage.setupMockLocation(mockLatitude, mockLongitude);

    // Step 3: Click Current Location Icon
    await mapPage.clickCurrentLocationIcon();

    // Step 4: Validate Current Location Marker
    const markerFound = await mapPage.verifyCurrentLocationMarker();
    expect(markerFound).toBeTruthy();

    await showStep(page, 'Test completed successfully - Navigated to mock current location');
  });

  test('[P1] TC-04: should click capture icon, roam map, and verify dialog', async ({ page }) => {
    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Click Capture Coordinates Icon
    await mapPage.clickCaptureCoordinatesIcon();

    // Step 3: Roam/Drag the map
    await mapPage.dragMap(200);

    // Step 4: Validate Dialog
    const dialogFound = await mapPage.verifyCapturedCoordinatesDialog();
    expect(dialogFound).toBeTruthy();

    await showStep(page, 'Test completed successfully - Captured coordinates verified');
  });

  test('[P1] TC-05: should upload KML file, search, and verify cards', async ({ page }) => {
    // Set timeout to 15 minutes
    test.setTimeout(900000);

    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Click Upload Icon
    await mapPage.clickUploadKMLIcon();
    await expect(mapPage.kmlPopup).toBeVisible();

    // Step 3: Upload File
    const filePath = 'utils/test-data/india_Village_level_5.kml';
    await mapPage.uploadKMLFile(filePath);

    // Step 4: Wait for AOI to be created and "Search" button to appear
    await showStep(page, 'Waiting for Search Button after KML Upload');
    try {
        await mapPage.searchPilotsBtn.waitFor({ state: 'visible', timeout: 30000 });
        logInfo('Search button appeared after KML upload');
    } catch (e) {
        // Fallback: Sometimes KML might not automatically enable the button without map interaction
        // Clicking the map to ensure focus
        const box = await mapPage.mapContainer.boundingBox();
        if(box) await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
        await mapPage.searchPilotsBtn.waitFor({ state: 'visible', timeout: 5000 });
    }

    // Step 5: Click "Search for drone pilots"
    await mapPage.searchPilotsBtn.click();
    logInfo('Clicked Search for drone pilots button');

    // Step 6: Wait for Processing (Max 10 mins) and Click "Show Providers"
    await mapPage.clickShowProvidersButton();

    // Step 7: Verify Sidebar
    await mapPage.verifySearchResultsSidebar();

    await showStep(page, 'Test completed successfully - KML Upload verified');
  });

  test('[P1] TC-06: should select country, wait for map, and search', async ({ page }) => {
    // Set timeout to 15 minutes
    test.setTimeout(900000);

    // Step 1: Landing Page
    await mapPage.clickDroneCustomer();
    await expect(page).toHaveURL(/.*map.*/);

    // Step 2: Click Country Dropdown Icon
    await mapPage.clickCountryDropdownIcon();
    await expect(mapPage.countryPopup).toBeVisible();

    // Step 3: Select "India"
    await mapPage.selectCountry('India');

    // Step 4: Wait for Search Button
    await showStep(page, 'Waiting for Search Button after Country Selection');
    try {
      await mapPage.searchPilotsBtn.waitFor({ state: 'visible', timeout: 30000 });
      logInfo('Search button appeared after country selection');
    } catch (e) {
      throw new Error('Search button did not appear after selecting country');
    }

    // Step 5: Click Search
    await mapPage.searchPilotsBtn.click();
    logInfo('Clicked Search for drone pilots button');

    // Step 6: Wait for Processing (Max 10 mins) and Click "Show Providers"
    await mapPage.clickShowProvidersButton();

    // Step 7: Verify Sidebar
    await mapPage.verifySearchResultsSidebar();

    await showStep(page, 'Test completed successfully - Country selection verified');
  });

});