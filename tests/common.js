// tests/common.js
import { test as base } from '@playwright/test'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
const {
  setContext, clearContext, clearDiagnostics, getArtifacts, clearArtifacts,
  showFailureMessage, extractErrorReason, formatArtifactFilename, logInfo, captureScreenshot
} = require('../utils/helpers');

const VIDEO_DIR = path.join(process.cwd(), 'test-results');

async function findPlaywrightTestFolder(testTitle) {
  try {
    if (!fs.existsSync(VIDEO_DIR)) return null;
    const entries = await fsPromises.readdir(VIDEO_DIR, { withFileTypes: true });
    const cleanTitle = testTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);
    
    const matchingFolders = entries
      .filter(e => e.isDirectory())
      .map(e => ({
        name: e.name,
        path: path.join(VIDEO_DIR, e.name),
        time: fs.statSync(path.join(VIDEO_DIR, e.name)).mtime.getTime()
      }))
      .filter(f => f.name.toLowerCase().includes(cleanTitle.substring(0, 20)))
      .sort((a, b) => b.time - a.time);

    return matchingFolders.length > 0 ? matchingFolders[0].path : null;
  } catch (err) {
    console.warn('findPlaywrightTestFolder error:', err.message);
    return null;
  }
}

async function renamePlaywrightArtifacts(testFolder, testFile, testTitle, reason) {
  const renamedFiles = [];
  try {
    if (!testFolder || !fs.existsSync(testFolder)) return renamedFiles;
    
    const entries = await fsPromises.readdir(testFolder);
    for (const entry of entries) {
      const entryPath = path.join(testFolder, entry);
      const stat = await fsPromises.stat(entryPath);
      if (stat.isDirectory()) continue;

      if (entry === 'video.webm') {
        const newFilename = formatArtifactFilename(testFile, testTitle, reason, 'webm');
        const newPath = path.join(testFolder, newFilename);
        await fsPromises.rename(entryPath, newPath);
        renamedFiles.push(newPath);
      }
    }
  } catch (err) {
    console.warn('renamePlaywrightArtifacts error:', err.message);
  }
  return renamedFiles;
}

exports.test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Setup before test
    setContext({
      testcase: testInfo.title,
      testFile: testInfo.file
    });
    clearArtifacts();
    clearDiagnostics();

    await use(page);

    // After test completes - handle artifacts
    const testFailed = testInfo.status === 'failed' || testInfo.status === 'timedOut';
    const testPassed = testInfo.status === 'passed';
    const warningArtifacts = getArtifacts(); // Screenshots captured during test via helpers
    const hasWarnings = warningArtifacts.length > 0;

    // 1. HANDLE FAILURES
    if (testFailed) {
      const error = testInfo.error;
      const reason = extractErrorReason(error);
      const errorMessage = error?.message || 'Test failed';

      // Show message on screen (Helper already did this if error happened during step, but double check for pure assertion failures)
      // We call it here to ensure it's visible for the Playwright auto-screenshot
      await showFailureMessage(page, errorMessage, 'FAILURE', 3000);

      // Rename video
      const pwFolder = await findPlaywrightTestFolder(testInfo.title);
      if (pwFolder) {
        await renamePlaywrightArtifacts(pwFolder, testInfo.file, testInfo.title, reason);
      }

      logInfo('Test failed, artifacts renamed', { reason, folder: pwFolder });
    } 
    // 2. HANDLE WARNINGS (Passed but with warnings)
    else if (hasWarnings && testPassed) {
      const warningMsg = `Test passed with ${warningArtifacts.length} warning(s)`;
      
      // Show warning message on screen
      await showFailureMessage(page, warningMsg, 'WARNING', 3000);
      
      // Manually capture screenshot because Playwright only auto-captures on failure
      const screenshotPath = await captureScreenshot(page, testInfo.title, 'WARNING', testInfo.file);
      if (screenshotPath) {
         // Attach to testInfo so it shows in reporter
         await testInfo.attach('warning-screenshot', { path: screenshotPath, contentType: 'image/png' });
      }

      // Rename video
      const pwFolder = await findPlaywrightTestFolder(testInfo.title);
      if (pwFolder) {
        await renamePlaywrightArtifacts(pwFolder, testInfo.file, testInfo.title, 'WARNING');
      }
    }

    clearContext();
  }
});

exports.expect = base.expect;