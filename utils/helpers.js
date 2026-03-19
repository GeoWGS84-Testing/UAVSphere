// utils/helpers.js
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { expect } = require('@playwright/test');

// Constants
const PAUSE_MULTIPLIER = Number(process.env.PAUSE_MULTIPLIER || 0.55);
const VISUAL_MIN_PAUSE = 25;
const DIAG_DIR = 'diagnostics';
const VIDEO_DIR = path.join(process.cwd(), 'test-results');
const SOFT_ASSERT = (process.env.SOFT_ASSERT || 'false').toLowerCase() === 'true';
const DEFAULT_WAIT = Number(process.env.DEFAULT_WAIT || 15000);

// State
let CURRENT_TEST_FILE = '';
let CURRENT_TESTCASE = '';
let CURRENT_FLOW = '';
const INFOS = [];
const WARNINGS = [];
const ERRORS = [];
const ARTIFACTS = [];

let lastErrorCount = 0;
let lastWarningCount = 0;

// Ensure directories exist
(function ensureDirExists() {
  [DIAG_DIR, VIDEO_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
})();

/* ===============================
   Context & Logging
================================ */
function setContext({ testcase, flow, testFile } = {}) {
  if (testcase !== undefined) CURRENT_TESTCASE = testcase;
  if (flow !== undefined) CURRENT_FLOW = flow;
  if (testFile !== undefined) CURRENT_TEST_FILE = testFile;
  logInfo(`Context set`, { testcase: CURRENT_TESTCASE, flow: CURRENT_FLOW, testFile: CURRENT_TEST_FILE });
}

function clearContext() {
  CURRENT_TESTCASE = '';
  CURRENT_FLOW = '';
  CURRENT_TEST_FILE = '';
}

function getArtifacts() { return [...ARTIFACTS]; }
function clearArtifacts() { ARTIFACTS.length = 0; }

function _timestamp() { return new Date().toISOString(); }

function logInfo(message, meta = {}) {
  const entry = { ts: _timestamp(), level: 'info', message, meta };
  INFOS.push(entry);
  console.log(`[INFO] ${entry.ts} - ${message}`, meta);
}

function addWarning(message, meta = {}) {
  const entry = { ts: _timestamp(), level: 'warn', message, meta };
  WARNINGS.push(entry);
  console.warn(`[WARN] ${entry.ts} - ${message}`, meta);
}

function addError(message, meta = {}) {
  const entry = { ts: _timestamp(), level: 'error', message, meta };
  ERRORS.push(entry);
  console.error(`[ERROR] ${entry.ts} - ${message}`, meta);
}

function getTestFileName() {
  return CURRENT_TEST_FILE;
}

/* ===============================
   Priority & Diagnostics
================================ */
function shouldRunPriority(priority) {
  const allowed = process.env.RUN_PRIORITIES;
  if (!allowed) return true;
  const list = allowed.split(',').map(p => p.trim().toUpperCase());
  return list.includes(priority.toUpperCase());
}

function getDiagnostics() {
  return {
    infos: [...INFOS],
    warnings: [...WARNINGS],
    errors: [...ERRORS],
    testcase: CURRENT_TESTCASE,
    flow: CURRENT_FLOW,
    testFile: CURRENT_TEST_FILE
  };
}

function clearDiagnostics() {
  INFOS.length = 0;
  WARNINGS.length = 0;
  ERRORS.length = 0;
  lastErrorCount = 0;
  lastWarningCount = 0;
}

/* ===============================
   Artifact Naming
================================ */
function cleanForFilename(str) {
  if (!str) return '';
  return str
    .replace(/[\[\]]/g, '')
    .replace(/[:\/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

function formatArtifactFilename(testFile, testTitle, reason, ext) {
  const baseFileName = testFile ? path.basename(testFile, path.extname(testFile)) : 'test';
  const cleanTitle = cleanForFilename(testTitle);
  const cleanReason = cleanForFilename(reason) || 'FAILED';
  return `${baseFileName}_${cleanTitle}_${cleanReason}.${ext}`;
}

function extractErrorReason(error) {
  if (!error) return 'FAILED';
  const msg = error.message || String(error);
  if (msg.includes('TimeoutError') || msg.toLowerCase().includes('timeout')) return 'TIMEOUT';
  if (msg.includes('AssertionError')) return 'ASSERTION_FAIL';
  if (msg.includes('not visible') || msg.includes('not found')) return 'ELEMENT_NOT_FOUND';
  return 'FAILED';
}

/* ===============================
   Interaction Helpers
================================ */
async function waitForVisible(locator, timeout = DEFAULT_WAIT) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch (err) {
    addWarning('waitForVisible timed out', { locator: locator?.toString?.() || String(locator), timeout, error: err.message, testcase: CURRENT_TESTCASE });
    return false;
  }
}

async function robustClick(page, locator, opts = {}) {
  const { timeout = DEFAULT_WAIT, highlightBorder, retry = 1 } = opts;
  try {
    const visible = await waitForVisible(locator, timeout);
    if (!visible) throw new Error('Element not visible to click');

    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
    } catch (e) { /* ignore */ }

    try {
      await highlight(page, locator, { borderColor: highlightBorder, pause: 200 });
    } catch (e) { /* ignore */ }

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        await locator.click({ timeout: 5000, force: false });
        logInfo('robustClick succeeded', { attempt, testcase: CURRENT_TESTCASE });
        return true;
      } catch (err) {
        addWarning('robustClick attempt failed', { attempt, error: err.message });
        if (attempt === retry) {
          try {
            await locator.click({ force: true });
            logInfo('robustClick succeeded with force: true', { testcase: CURRENT_TESTCASE });
            return true;
          } catch (finalErr) {
            throw finalErr;
          }
        }
        await new Promise(r => setTimeout(r, 250));
      }
    }
  } catch (err) {
    addError('robustClick failed', { error: err.message, testcase: CURRENT_TESTCASE });
    throw err;
  }
}

async function waitAndFill(page, locator, value, opts = {}) {
  const { timeout = DEFAULT_WAIT, highlightBorder } = opts;
  try {
    const visible = await waitForVisible(locator, timeout);
    if (!visible) throw new Error('Element not visible to fill');
    try {
      await highlight(page, locator, { borderColor: highlightBorder, pause: 200 });
    } catch (e) { /* ignore */ }
    await locator.fill(value, { timeout: 5000 });
    logInfo('Filled input', { value: typeof value === 'string' ? `${value.slice(0, 20)}${value.length > 20 ? '...' : ''}` : typeof value, testcase: CURRENT_TESTCASE });
    return true;
  } catch (err) {
    addError('waitAndFill failed', { error: err.message, testcase: CURRENT_TESTCASE });
    throw err;
  }
}

/* ===============================
   Visual Helpers
================================ */
async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fastWait(page, ms = 300) {
  const t = Math.max(VISUAL_MIN_PAUSE, Math.round(ms * PAUSE_MULTIPLIER));
  return page.waitForTimeout(t);
}

function _getRandomRGBA(alpha = 1) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function highlight(page, locator, options = {}) {
  const { pause = 800, forceOutlineOnly = false } = options;
  const bgColor = options.color || _getRandomRGBA(0.3);
  const effectiveBorder = options.borderColor || _getRandomRGBA(1);

  try {
    const handle = await locator.elementHandle();
    if (!handle) return;
    await page.evaluate(({ el, border, bg, forceOutlineOnly }) => {
      el.style.outline = `3px solid ${border}`;
      el.style.outlineOffset = '3px';
      if (bg) el.style.backgroundColor = bg;
      if (!forceOutlineOnly) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
      }
    }, { el: handle, border: effectiveBorder, bg: bgColor, forceOutlineOnly });
    await page.waitForTimeout(pause);
  } catch (err) { /* ignore */ }
}

async function showStep(page, text) {
  logInfo(`${text}`, { testcase: CURRENT_TESTCASE });

  const currentErrorCount = ERRORS.length;
  const currentWarningCount = WARNINGS.length;
  const hasNewErrors = currentErrorCount > lastErrorCount;
  const hasNewWarnings = currentWarningCount > lastWarningCount;

  lastErrorCount = currentErrorCount;
  lastWarningCount = currentWarningCount;

  if (hasNewErrors || hasNewWarnings) {
    try {
      if (!page.isClosed()) {
        const msgType = hasNewErrors ? 'ERROR' : 'WARNING';
        const msgText = hasNewErrors
          ? (ERRORS[ERRORS.length - 1]?.message || 'Error occurred')
          : (WARNINGS[WARNINGS.length - 1]?.message || 'Warning occurred');

        await showTestFailure(page, msgText, msgType);
        await fastWait(page, 2000);
      }
    } catch (e) { console.warn('Failed immediate capture:', e.message); }
  }

  try {
    if (!page.isClosed()) {
      await page.evaluate(({ stepText, testCase }) => {
        let spacer = document.getElementById('pw-layout-spacer');
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.id = 'pw-layout-spacer';
          spacer.style.width = '100%'; spacer.style.pointerEvents = 'none';
          document.body.prepend(spacer);
        }
        let bar = document.getElementById('pw-banner-container');
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'pw-banner-container';
          Object.assign(bar.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', zIndex: '99999',
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '6px 12px', boxSizing: 'border-box', pointerEvents: 'none',
            fontFamily: 'Segoe UI, sans-serif',
            background: 'linear-gradient(90deg, rgba(115,102,255,0.85), rgba(58,199,147,0.85))',
            borderBottom: '2px solid rgba(255,255,255,0.12)'
          });
          const tc = document.createElement('div');
          tc.id = 'pw-testcase-header';
          Object.assign(tc.style, { padding: '6px 12px', fontSize: '14px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' });
          const step = document.createElement('div');
          step.id = 'pw-step-banner';
          Object.assign(step.style, { padding: '6px 10px', fontSize: '13px', fontWeight: '600', color: 'rgba(10,10,30,0.95)', background: 'rgba(255,255,255,0.9)', borderRadius: '6px', minWidth: '160px', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
          bar.appendChild(tc); bar.appendChild(step);
          document.body.appendChild(bar);
        }
        const tcEl = document.getElementById('pw-testcase-header');
        const stepEl = document.getElementById('pw-step-banner');
        if (testCase) { tcEl.textContent = `TEST CASE : ${testCase}`; tcEl.style.display = 'block' } else { tcEl.style.display = 'none' }
        stepEl.textContent = stepText;
        spacer.style.height = `${bar.offsetHeight}px`;
      }, { stepText: text, testCase: CURRENT_TESTCASE });
    }
  } catch (err) { /* ignore */ }
  await fastWait(page, 300);
}

async function showTestFailure(page, message, type = 'FAILURE') {
  const colors = {
    'FAILURE': { bg: '#dc3545', icon: '❌' },
    'ERROR': { bg: '#dc3545', icon: '⚠️' },
    'WARNING': { bg: '#ffc107', icon: '⚠️' }
  };
  const color = colors[type] || colors['FAILURE'];
  const displayMsg = message.length > 150 ? message.substring(0, 150) + '...' : message;

  console.error(`\n[${type}] ${displayMsg}\n`);

  try {
    if (!page.isClosed()) {
      await page.evaluate(({ msg, bgColor, icon }) => {
        const existing = document.getElementById('pw-failure-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'pw-failure-banner';
        banner.style.cssText = `
          position: fixed; top: 50px; left: 50%; transform: translateX(-50%);
          z-index: 9999999; max-width: 600px; width: 90%;
          background: ${bgColor}; color: white;
          padding: 12px 20px; border-radius: 8px;
          font-family: 'Segoe UI', sans-serif; font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex; align-items: center; gap: 10px;
        `;

        const iconEl = document.createElement('span');
        iconEl.textContent = icon;
        iconEl.style.fontSize = '20px';

        const textEl = document.createElement('span');
        textEl.textContent = msg;
        textEl.style.flex = '1';

        banner.appendChild(iconEl);
        banner.appendChild(textEl);
        document.body.appendChild(banner);
      }, { msg: displayMsg, bgColor: color.bg, icon: color.icon });

      await fastWait(page, 3000);
    }
  } catch (err) {
    console.warn('Could not show failure banner:', err.message);
  }
}

async function captureScreenshot(page, testTitle, reason, testFile = null) {
  try {
    const dir = VIDEO_DIR;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const actualTestFile = testFile || CURRENT_TEST_FILE || 'test.spec.js';
    const filename = formatArtifactFilename(actualTestFile, testTitle, reason, 'png');
    const filePath = path.join(dir, filename);

    await page.screenshot({ path: filePath, fullPage: true });
    logInfo('Screenshot captured', { path: filePath, filename });
    return filePath;
  } catch (err) {
    console.warn('captureScreenshot failed', err.message);
    return null;
  }
}

module.exports = {
  setContext, clearContext, logInfo, addWarning, addError,
  getDiagnostics, clearDiagnostics, getArtifacts, clearArtifacts,
  shouldRunPriority, sleep, fastWait, highlight, showStep, showTestFailure,
  robustClick, waitAndFill, waitForVisible, captureScreenshot,
  getTestFileName, extractErrorReason, formatArtifactFilename,
  DIAG_DIR, VIDEO_DIR
};