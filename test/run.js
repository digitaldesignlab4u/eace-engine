#!/usr/bin/env node
/**
 * EACE.ai Compliance Tasting Menu — regression harness
 *
 * Loops over every mode x track x sector combination, drives a full quiz
 * session using the launch-card / scope-chip welcome flow (Daily Pulse,
 * Onboarding, Deep Dive, Annual Assessment, Sector), and asserts:
 *   - zero browser console errors
 *   - zero CSP violations (securitypolicyviolation events)
 *   - the result screen renders with a score
 *   - the completion receipt token decodes to the expected field shape,
 *     with Croatian diacritics in the name surviving the round trip
 *
 * Works against either edition:
 *   - Portable Edition (single file): pass a filesystem path, used as file://
 *   - Enterprise/Web Edition (split build): pass an http(s):// base URL
 *     (CSP/same-origin script loading requires a real origin, not file://)
 *
 * Usage:
 *   node test/run.js [path-to-html-or-http-url]
 *   node test/run.js                                   # defaults to the Portable Edition
 *   node test/run.js http://localhost:8934/index.html   # Enterprise/Web Edition
 */
const path = require('path');
const { chromium } = require('playwright');

const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const rawTarget = process.argv[2] || path.join(__dirname, '..', 'eace-compliance-tasting-menu.html');
const BASE_URL = /^https?:\/\//.test(rawTarget) ? rawTarget : 'file://' + path.resolve(rawTarget);

const ROLES = ['all', 'manager', 'compliance', 'technical'];
const SECTORS = [
  'hr', 'finance', 'health', 'education', 'public', 'justice',
  'migration', 'infrastructure', 'telecom', 'ecommerce', 'media', 'gpai'
];

function urlWith(params) {
  const u = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

function buildRuns() {
  const runs = [];
  for (const role of ROLES) {
    runs.push({ name: `pulse / role=${role}`, mode: 'pulse', url: urlWith({ type: 'pulse', role }) });
  }
  runs.push({ name: 'onboarding', mode: 'onboarding', url: urlWith({ type: 'onboarding' }) });
  runs.push({ name: 'deepdive', mode: 'deepdive', url: urlWith({ type: 'deepdive' }) });
  runs.push({ name: 'exam', mode: 'exam', url: urlWith({ type: 'exam' }) });
  for (const sector of SECTORS) {
    runs.push({ name: `sector / sector=${sector}`, mode: 'sector', url: urlWith({ type: 'sector', sector }) });
  }
  return runs;
}

// Mirrors the app's own b64()/buildReceiptToken(): TextEncoder -> btoa on the
// way in, so decoding is atob -> bytes -> TextDecoder (never a naive atob()
// string cast, which would mangle multi-byte UTF-8 like Croatian diacritics).
function decodeReceiptToken(token) {
  if (!token.startsWith('EACE-')) throw new Error('token missing EACE- prefix: ' + token);
  let b64 = token.slice('EACE-'.length);
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = Buffer.from(b64, 'base64');
  const payload = binary.toString('utf8');
  const parts = payload.split('|');
  return {
    magic: parts[0],
    receipt_version: parts[1],
    name: parts[2],
    score: parts[3],
    focus: parts[4],
    date: parts[5],
    mode: parts[6],
    pool_version: parts[7],
    assessment_manifest_id: parts[8],
    partCount: parts.length
  };
}

const TEST_NAME = 'Ana Kovač'; // Croatian diacritics (č) — must survive the b64 round trip

async function runOne(browser, run) {
  const errors = [];
  const cspViolations = [];
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.exposeFunction('__reportCSP', (v) => cspViolations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__reportCSP(e.violatedDirective + ' blocked ' + e.blockedURI + ' (line ' + e.lineNumber + ')');
    });
  });

  try {
    await page.goto(run.url, { waitUntil: 'load' });

    await page.fill('#in-name', TEST_NAME);
    await page.click('#btn-start');

    const nextSelector = run.mode === 'exam' ? '#btn-next-exam' : '#btn-next';

    let guard = 0;
    while (guard++ < 500) {
      const quizVisible = await page.isVisible('#screen-quiz');
      if (!quizVisible) break;

      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      await page.click('#q-options .opt >> nth=0');
      await page.click(nextSelector);
    }

    const resultVisible = await page.isVisible('#screen-result');
    if (!resultVisible) {
      throw new Error('result screen never appeared');
    }

    const scoreText = await page.textContent('#result-score');
    if (!scoreText || !scoreText.trim()) {
      throw new Error('result score not rendered');
    }

    // Exam sessions below the 80% threshold generate no receipt token — skip
    // the receipt check for those (still asserted zero errors/CSP above).
    const tokenVisible = await page.isVisible('#token-section');
    let receiptDetail = 'no receipt (below threshold)';
    if (tokenVisible) {
      const tokenText = (await page.textContent('#token-out')).trim();
      const decoded = decodeReceiptToken(tokenText);
      if (decoded.magic !== 'EACE-TASTING') throw new Error('bad receipt magic: ' + decoded.magic);
      if (!/^v\d+$/.test(decoded.receipt_version)) throw new Error('bad receipt_version: ' + decoded.receipt_version);
      if (decoded.name !== TEST_NAME) throw new Error(`Croatian diacritics did not survive round trip: got "${decoded.name}", expected "${TEST_NAME}"`);
      if (!/^\d+\/\d+$/.test(decoded.score)) throw new Error('bad score field: ' + decoded.score);
      if (decoded.mode !== run.mode) throw new Error(`mode field mismatch: got "${decoded.mode}", expected "${run.mode}"`);
      if (!decoded.pool_version) throw new Error('missing pool_version field');
      if (!decoded.assessment_manifest_id) throw new Error('missing assessment_manifest_id field');
      if (decoded.partCount !== 9) throw new Error('unexpected receipt field count: ' + decoded.partCount);
      receiptDetail = `receipt ${decoded.receipt_version} ok, diacritics ok, manifest=${decoded.assessment_manifest_id}`;
    }

    if (cspViolations.length) {
      throw new Error(`CSP violations: ${cspViolations.join(' | ')}`);
    }
    if (errors.length) {
      throw new Error(`console errors: ${errors.join(' | ')}`);
    }

    return { name: run.name, ok: true, detail: `${scoreText.trim()} — ${receiptDetail}` };
  } catch (e) {
    return { name: run.name, ok: false, detail: e.message };
  } finally {
    await page.close();
  }
}

(async () => {
  const runs = buildRuns();
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const results = [];

  for (const run of runs) {
    const result = await runOne(browser, run);
    results.push(result);
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${result.name} — ${result.detail}`);
  }

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${failed} failed`);
  console.log(`Target: ${BASE_URL}`);

  process.exit(failed > 0 ? 1 : 0);
})();
