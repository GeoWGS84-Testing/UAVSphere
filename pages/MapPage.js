// pages/MapPage.js
const fs = require('fs');
const path = require('path');
const { robustClick, waitAndFill, highlight, showStep, fastWait, logInfo, addWarning } = require('../utils/helpers');
const { expect } = require('@playwright/test');

class MapPage {
  constructor(page) {
    this.page = page;

    // Landing page elements
    this.droneCustomerBtn = page.getByRole('button', { name: /are you a drone customer\?/i });
    
    // Map page elements
    this.searchInput = page.locator('.pac-target-input');
    this.searchContainer = page.locator('.pac-container');
    this.firstSuggestion = page.locator('.pac-item').first();
    this.mapContainer = page.locator('.map-container');
    
    // Sidebar Icons
    this.coordinatesIcon = page.locator('img[alt="Coordinates Icon"]');
    this.currentLocationIcon = page.locator('img[alt="Current Location Icon"]');
    this.captureCoordinatesIcon = page.locator('img[alt="Capture Coordinates Icon"]');
    this.uploadKMLIcon = page.locator('img[alt="Upload KML"]');
    this.countryDropdownIcon = page.locator('img[alt="CountryDropdown Icon"]');

    // Popup Elements
    this.coordinatesPopup = page.locator('.popup-content');
    
    // Coordinate Inputs
    this.latInput = page.locator('#latitude');
    this.longInput = page.locator('#longitude');
    this.takeMeBtn = page.getByRole('button', { name: /take me/i });

    // KML Upload Popup
    this.kmlPopup = page.locator('.popup-content:has-text("Upload KML File")');
    this.kmlFileInput = page.locator('input[type="file"][accept=".kml"]');

    // Country Select Popup
    this.countryPopup = page.locator('.popup-content:has-text("Select a Country")');
    this.countrySelect = this.countryPopup.locator('select');

    // Drawing Tools
    this.drawRectangleBtn = page.getByRole('menuitemradio', { name: /draw a rectangle/i });
    
    // Alert Modal
    this.alertModal = page.locator('.modal-content');
    this.alertCloseBtn = this.alertModal.locator('.modal-footer button.btn-secondary');

    // Action Buttons
    this.drawAOIButton = page.getByRole('button', { name: /please draw your area of interest/i });
    this.searchPilotsBtn = page.getByRole('button', { name: /Search for drone pilots/i });
    
    // Provider Step 2 Button
    this.goToStep2Btn = page.getByRole('button', { name: /Go to Step-2/i });
    
    // Results / Info Cards
    this.resultCard = page.locator('.gm-style-iw-c').first();
    
    // Capture Dialog
    this.captureDialog = page.locator('.gm-style-iw-c');
    
    // Marker Validation
    this.locationMarker = page.locator('img[src="https://maps.gstatic.com/mapfiles/transparent.png"][style*="width: 50px"][style*="height: 50px"]');
    this.currentLocationMarker = page.locator('img[src="https://maps.gstatic.com/mapfiles/transparent.png"][style*="width: 50px"][style*="height: 69px"]');

    // Drone Customer Flow Elements
    this.searchPilotsMainBtn = page.getByRole('button', { name: /Search for drone pilots and companies/i });
    this.showProvidersBtn = page.getByRole('button', { name: /Show.*Providers/i });
  }

  async navigate() {
    await this.page.goto('https://portal.uavsphere.com/', { waitUntil: 'networkidle' });
  }

  async clickDroneCustomer() {
    await showStep(this.page, 'Step 1: Landing Page Interaction');
    await robustClick(this.page, this.droneCustomerBtn);
    await this.page.waitForLoadState('networkidle');
  }

  async searchLocation(location) {
    await showStep(this.page, 'Step 2: Search for Indore');
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await waitAndFill(this.page, this.searchInput, location);
    
    logInfo('Waiting for search suggestions to appear...');
    try {
      await this.searchContainer.waitFor({ state: 'visible', timeout: 10000 });
      await this.firstSuggestion.waitFor({ state: 'visible', timeout: 5000 });
      await highlight(this.page, this.firstSuggestion);
      await robustClick(this.page, this.firstSuggestion);
      await fastWait(this.page, 3000); 
      logInfo('Search result selected successfully');
    } catch (e) {
      addWarning('Search suggestions did not appear, attempting Enter key fallback');
      await this.page.keyboard.press('Enter');
      await fastWait(this.page, 3000);
    }
  }

  // ==========================================
  // TEST CASE 6: COUNTRY SELECTION
  // ==========================================

  async clickCountryDropdownIcon() {
    await showStep(this.page, 'Clicking Country Dropdown Icon');
    await this.countryDropdownIcon.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.countryDropdownIcon);
    await robustClick(this.page, this.countryDropdownIcon);
    
    await this.countryPopup.waitFor({ state: 'visible', timeout: 5000 });
    logInfo('Country select popup appeared');
  }

  async selectCountry(countryName) {
    await showStep(this.page, `Selecting Country: ${countryName}`);
    await highlight(this.page, this.countryPopup);
    await this.countrySelect.selectOption({ label: countryName });
    logInfo('Country selected', { country: countryName });
    await fastWait(this.page, 3000);
  }

  // ==========================================
  // TEST CASE 2: COORDINATES
  // ==========================================
  async clickCoordinatesIcon() {
    await showStep(this.page, 'Clicking Coordinates Icon');
    await this.coordinatesIcon.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.coordinatesIcon);
    await robustClick(this.page, this.coordinatesIcon);
    await this.coordinatesPopup.waitFor({ state: 'visible', timeout: 5000 });
    logInfo('Coordinates popup appeared');
  }

  async fillCoordinates(latitude, longitude) {
    await showStep(this.page, 'Filling Coordinates');
    await highlight(this.page, this.coordinatesPopup);
    await this.latInput.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.latInput);
    await this.latInput.fill(latitude);
    logInfo('Filled Latitude', { value: latitude });
    await this.longInput.waitFor({ state: 'visible', timeout: 5000 });
    await highlight(this.page, this.longInput);
    await this.longInput.fill(longitude);
    logInfo('Filled Longitude', { value: longitude });
  }

  async clickTakeMe() {
    await showStep(this.page, 'Clicking "Take Me" button');
    await highlight(this.page, this.takeMeBtn);
    await robustClick(this.page, this.takeMeBtn);
    await fastWait(this.page, 3000);
  }

  async verifyLocationMarker() {
    await showStep(this.page, 'Validating Location Marker');
    try {
      await this.locationMarker.waitFor({ state: 'visible', timeout: 10000 });
      await highlight(this.page, this.locationMarker);
      logInfo('Location marker verified successfully');
      return true;
    } catch (e) {
      addWarning('Location marker not found');
      return false;
    }
  }

  // ==========================================
  // TEST CASE 3: CURRENT LOCATION
  // ==========================================
  async setupMockLocation(latitude, longitude) {
    await showStep(this.page, 'Setting Mock Location');
    const context = this.page.context();
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude, longitude });
    logInfo('Mock location set', { latitude, longitude });
  }

  async clickCurrentLocationIcon() {
    await showStep(this.page, 'Clicking Current Location Icon');
    await this.currentLocationIcon.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.currentLocationIcon);
    await robustClick(this.page, this.currentLocationIcon);
    await fastWait(this.page, 3000);
  }

  async verifyCurrentLocationMarker() {
    await showStep(this.page, 'Validating Current Location Marker');
    try {
      await this.currentLocationMarker.waitFor({ state: 'visible', timeout: 15000 });
      await highlight(this.page, this.currentLocationMarker);
      logInfo('Current Location marker verified successfully');
      return true;
    } catch (e) {
      addWarning('Current Location marker not found');
      return false;
    }
  }

  // ==========================================
  // TEST CASE 4: CAPTURE COORDINATES
  // ==========================================
  async clickCaptureCoordinatesIcon() {
    await showStep(this.page, 'Clicking Capture Coordinates Icon');
    await this.captureCoordinatesIcon.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.captureCoordinatesIcon);
    await robustClick(this.page, this.captureCoordinatesIcon);
    logInfo('Capture Coordinates icon clicked');
    await fastWait(this.page, 500);
  }

  async dragMap(distance = 200) {
    await showStep(this.page, 'Dragging Map to Capture Coordinates');
    const box = await this.mapContainer.boundingBox();
    if (!box) throw new Error('Map container not found');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(200);
    await this.page.mouse.move(centerX + distance, centerY, { steps: 20 });
    await this.page.waitForTimeout(200);
    await this.page.mouse.move(centerX + distance, centerY + distance, { steps: 20 });
    await this.page.waitForTimeout(200);
    await this.page.mouse.up();
    logInfo('Map dragged successfully');
    await fastWait(this.page, 2000);
  }

  async verifyCapturedCoordinatesDialog() {
    await showStep(this.page, 'Validating Captured Coordinates Dialog');
    try {
      const dialog = this.captureDialog.first();
      await dialog.waitFor({ state: 'visible', timeout: 10000 });
      await highlight(this.page, dialog);
      const text = await dialog.textContent();
      if (text.includes('Latitude:') && text.includes('Longitude:')) {
        logInfo('Captured coordinates dialog verified', { text: text.substring(0, 100) });
        return true;
      } else {
        addWarning('Dialog appeared but missing coordinate text');
        return false;
      }
    } catch (e) {
      addWarning('Captured coordinates dialog did not appear');
      return false;
    }
  }

  // ==========================================
  // TEST CASE 5: KML UPLOAD
  // ==========================================
  async clickUploadKMLIcon() {
    await showStep(this.page, 'Clicking Upload KML Icon');
    await this.uploadKMLIcon.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.uploadKMLIcon);
    await robustClick(this.page, this.uploadKMLIcon);
    await this.kmlPopup.waitFor({ state: 'visible', timeout: 5000 });
    logInfo('KML Upload popup appeared');
  }

  async uploadKMLFile(relativePath) {
    await showStep(this.page, 'Uploading KML File');
    const fullPath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) throw new Error(`File not found at: ${fullPath}`);
    await highlight(this.page, this.kmlPopup);
    await this.kmlFileInput.setInputFiles(fullPath);
    logInfo('KML File uploaded via input', { path: fullPath });
    await fastWait(this.page, 3000);
  }

  // ==========================================
  // TEST CASE 1: DRAWING & SEARCH
  // ==========================================
  async selectDrawRectangle() {
    await this.drawRectangleBtn.waitFor({ state: 'visible', timeout: 5000 });
    const isChecked = await this.drawRectangleBtn.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      logInfo('Activating Draw Rectangle tool');
      await highlight(this.page, this.drawRectangleBtn);
      await robustClick(this.page, this.drawRectangleBtn);
    } else {
      logInfo('Draw Rectangle tool already active');
    }
    await fastWait(this.page, 300);
  }

  async performAOISearch() {
    const maxRetries = 10; 
    let attempt = 0;
    let coords = { startX: 0.3, startY: 0.3, width: 0.4, height: 0.4 };

    while (attempt < maxRetries) {
      attempt++;
      await showStep(this.page, `Drawing Attempt ${attempt}/${maxRetries}`);
      logInfo(`Starting draw attempt ${attempt}`);

      await this.selectDrawRectangle();
      await this.drawRectangle(coords.startX, coords.startY, coords.width, coords.height);

      const alertHandled = await this.handleExceededAreaAlert();
      if (alertHandled) {
        coords.width = Math.min(0.2, coords.width);
        coords.height = Math.min(0.2, coords.height);
        continue;
      }

      try {
        await this.searchPilotsBtn.waitFor({ state: 'visible', timeout: 5000 });
        await showStep(this.page, 'Valid AOI Drawn (Button Found)');
        await highlight(this.page, this.searchPilotsBtn);
        await robustClick(this.page, this.searchPilotsBtn);
        logInfo('Clicked Search for drone pilots button');
        return true;
      } catch (e) {
        logInfo(`Search button not found after attempt ${attempt}. Retrying...`);
        if (attempt < maxRetries) {
           await this.zoomIn();
           coords.width = Math.max(0.1, coords.width - 0.05);
           coords.height = Math.max(0.1, coords.height - 0.05);
        }
      }
    }
    throw new Error('Failed to draw valid AOI after maximum retries');
  }

  async drawRectangle(startX, startY, width, height) {
    const box = await this.mapContainer.boundingBox();
    if (!box) throw new Error('Map container not found');

    const x = box.x + box.width * startX;
    const y = box.y + box.height * startY;
    const endX = x + box.width * width;
    const endY = y + box.height * height;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.waitForTimeout(200);
    await this.page.mouse.move(endX, endY, { steps: 25 });
    await this.page.waitForTimeout(200);
    await this.page.mouse.up();
    await fastWait(this.page, 1000);
  }

  async handleExceededAreaAlert() {
    try {
      const alertVisible = await this.alertModal.isVisible({ timeout: 2000 });
      if (alertVisible) {
        await showStep(this.page, 'Handling "Area Exceeded" Alert');
        await highlight(this.page, this.alertCloseBtn);
        await robustClick(this.page, this.alertCloseBtn);
        await this.alertModal.waitFor({ state: 'hidden', timeout: 5000 });
        await fastWait(this.page, 500);
        await this.zoomIn();
        return true;
      }
    } catch (e) {}
    return false;
  }

  async zoomIn() {
    const box = await this.mapContainer.boundingBox();
    if (box) {
      await this.page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
      await fastWait(this.page, 1000);
    }
  }

  async verifyResultsCard() {
    await showStep(this.page, 'Verifying Results Card');
    try {
      await expect(this.resultCard).toBeVisible({ timeout: 180000 });
      await highlight(this.page, this.resultCard);
      logInfo('Results card appeared');
      return true;
    } catch (e) {
      addWarning('Results card did not appear within 3 minutes');
      return false;
    }
  }

  async searchProviderLocation(location) {
    await showStep(this.page, `Provider: Searching location: ${location}`);
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.click();
    await fastWait(this.page, 500);
    await waitAndFill(this.page, this.searchInput, location);
    logInfo('Provider: Waiting for search suggestions...');
    try {
      await this.searchContainer.waitFor({ state: 'visible', timeout: 10000 });
      await this.firstSuggestion.waitFor({ state: 'visible', timeout: 5000 });
      await highlight(this.page, this.firstSuggestion);
      await Promise.all([
        this.page.waitForLoadState('load', { timeout: 10000 }).catch(() => {}),
        robustClick(this.page, this.firstSuggestion)
      ]);
      logInfo('Provider: Location selected successfully');
    } catch (e) {
      addWarning('Provider: Search suggestions failed, using Enter fallback');
      await this.page.keyboard.press('Enter');
      await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
    }
    await this.drawRectangleBtn.waitFor({ state: 'visible', timeout: 15000 });
    logInfo('Provider: Drawing tool is visible. Map ready.');
    await fastWait(this.page, 1000);
  }
  
  async performProviderAOI() {
    const maxRetries = 10; 
    let attempt = 0;
    let coords = { startX: 0.3, startY: 0.3, width: 0.4, height: 0.4 };

    while (attempt < maxRetries) {
      attempt++;
      await showStep(this.page, `Provider AOI Attempt ${attempt}/${maxRetries}`);
      logInfo(`Starting provider draw attempt ${attempt}`);

      await this.selectDrawRectangle();
      await this.drawProviderRectangle(coords.startX, coords.startY, coords.width, coords.height);

      const alertHandled = await this.handleExceededAreaAlert();
      if (alertHandled) {
        coords.width = Math.min(0.2, coords.width);
        coords.height = Math.min(0.2, coords.height);
        continue;
      }

      try {
        await this.goToStep2Btn.waitFor({ state: 'visible', timeout: 5000 });
        await showStep(this.page, 'Valid Provider AOI Drawn (Step-2 Button Found)');
        await highlight(this.page, this.goToStep2Btn);
        await robustClick(this.page, this.goToStep2Btn);
        logInfo('Clicked "Go to Step-2" button');
        await fastWait(this.page, 2000);
        return true;
      } catch (e) {
        logInfo(`Step-2 button not found after attempt ${attempt}. Retrying...`);
        if (attempt < maxRetries) {
           await this.zoomIn();
           coords.width = Math.max(0.1, coords.width - 0.05);
           coords.height = Math.max(0.1, coords.height - 0.05);
        }
      }
    }
    throw new Error('Failed to draw valid Provider AOI after maximum retries');
  }

  async drawProviderRectangle(startX, startY, width, height) {
    let box;
    try {
      if (await this.mapContainer.isVisible()) {
        box = await this.mapContainer.boundingBox();
      }
    } catch (e) {}

    if (!box) {
      logInfo('Provider: Using Viewport fallback for drawing coordinates.');
      const viewport = this.page.viewportSize();
      box = { x: 0, y: 0, width: viewport.width, height: viewport.height };
    }

    if (!box) throw new Error('Cannot determine drawing area.');
    const x = box.x + box.width * startX;
    const y = box.y + box.height * startY;
    const endX = x + box.width * width;
    const endY = y + box.height * height;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.waitForTimeout(200);
    await this.page.mouse.move(endX, endY, { steps: 25 });
    await this.page.waitForTimeout(200);
    await this.page.mouse.up();
    await fastWait(this.page, 1000);
  }

  // ==========================================
  // NEW: DRONE CUSTOMER FLOW METHODS
  // ==========================================

  /**
   * Clicks the main search button on the map.
   */
  async clickSearchPilotsMainButton() {
    await showStep(this.page, 'Clicking "Search for drone pilots" button');
    await this.searchPilotsMainBtn.waitFor({ state: 'visible', timeout: 10000 });
    await highlight(this.page, this.searchPilotsMainBtn);
    await robustClick(this.page, this.searchPilotsMainBtn);
    logInfo('Clicked "Search for drone pilots" button.');
    await fastWait(this.page, 1000);
  }

  /**
   * Waits for the "Show X Providers" button and clicks it.
   * Timeout set to 10 minutes as per requirement.
   */
  async clickShowProvidersButton() {
    await showStep(this.page, 'Waiting for Providers Button (Max 10 mins)');
    
    // Wait for the button to appear. 
    // The button text includes "Show" and "Providers"
    await this.showProvidersBtn.waitFor({ state: 'visible', timeout: 600000 }); // 10 mins
    
    await highlight(this.page, this.showProvidersBtn);
    await robustClick(this.page, this.showProvidersBtn);
    logInfo('Clicked "Show Providers" button.');
    
    // Wait for the sidebar animation to finish
    await fastWait(this.page, 2000);
  }

  /**
   * Verifies that the search results sidebar is visible.
   * Checks for the header containing "Found X Providers".
   * Highlights the first card to demonstrate interaction.
   */
  async verifySearchResultsSidebar() {
    await showStep(this.page, 'Verifying Search Results Sidebar');
    
    // Locator for the header: <h5>Found 60 Providers</h5>
    const sidebarHeader = this.page.locator('h5:has-text("Found")');
    
    await expect(sidebarHeader).toBeVisible({ timeout: 10000 });
    logInfo('Search results sidebar verified.');

    // Highlight the first card to show it's visible
    // The cards have a border style.
    const firstCard = this.page.locator('div[style*="border: 1px solid"]').first();
    if (await firstCard.isVisible()) {
        await highlight(this.page, firstCard);
        logInfo('Highlighted first provider card.');
    }
  }

  /**
   * Verifies if a partner appears in the sidebar list with correct details.
   */
  async verifyPartnerInList(companyName, location, partnerNo) {
    await showStep(this.page, `Verifying Partner in List: ${companyName}`);

    // Locate the card container specifically by its border style.
    const partnerCard = this.page.locator('div[style*="border: 1px solid"]').filter({ hasText: companyName }).first();

    // Verify the card is visible
    await expect(partnerCard).toBeVisible({ timeout: 10000 });
    logInfo(`Partner card for "${companyName}" found.`);

    // Verify Location
    const locationElement = partnerCard.getByText(location).first();
    await expect(locationElement).toBeVisible({ timeout: 5000 });
    logInfo(`Location verified: ${location}`);

    // Verify Partner Number
    if (partnerNo) {
      const partnerNoElement = partnerCard.getByText(partnerNo).first();
      await expect(partnerNoElement).toBeVisible({ timeout: 5000 });
      logInfo(`Partner Number verified: ${partnerNo}`);
    }

    // Highlight the final found card
    await highlight(this.page, partnerCard);
    logInfo(`Partner details for "${companyName}" verified successfully.`);
  }
}

module.exports = { MapPage };