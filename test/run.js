#!/usr/bin/env node
/**
 * EACE.ai Compliance Tasting Menu — regression harness
 *
 * Loops over every mode x track x sector combination, drives a full quiz
 * session (Begin -> answer every question -> result screen), and asserts
 * zero browser console errors. Prints a pass/fail summary and exits
 * non-zero if anything fails.
 *
 * Usage: node test/run.js [path-to-html]
 */
const path = require('path');
const { chromium } = require('playwright');

const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TARGET = path.resolve(process.argv[2] || path.join(__dirname, '..', 'eace-compliance-tasting-menu.html'));
const FILE_URL = 'file://' + TARGET;

const ROLES = ['all', 'manager', 'compliance', 'technical'];
const SECTORS = [
  'hr', 'finance', 'health', 'education', 'public', 'justice',
  'migration', 'infrastructure', 'telecom', 'ecommerce', 'media', 'gpai'
];

function buildRuns() {
  const runs = [];
  for (const role of ROLES) {
    runs.push({ name: `pulse / role=${role}`, url: `${FILE_URL}?type=pulse&role=${role}` });
  }
  runs.push({ name: 'onboarding', url: `${FILE_URL}?type=onboarding` });
  runs.push({ name: 'deepdive', url: `${FILE_URL}?type=deepdive` });
  runs.push({ name: 'exam', url: `${FILE_URL}?type=exam` });
  for (const sector of SECTORS) {
    runs.push({ name: `sector / sector=${sector}`, url: `${FILE_URL}?type=sector&sector=${sector}` });
  }
  return runs;
}

async function runOne(browser, run) {
  const errors = [];
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));

  try {
    await page.goto(run.url, { waitUntil: 'load' });
    await page.click('#btn-start');

    let guard = 0;
    while (guard++ < 500) {
      const quizVisible = await page.isVisible('#screen-quiz');
      if (!quizVisible) break;

      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      await page.click('#q-options .opt >> nth=0');
      await page.click('#btn-next');
    }

    const resultVisible = await page.isVisible('#screen-result');
    if (!resultVisible) {
      throw new Error('result screen never appeared');
    }

    const scoreText = await page.textContent('#result-score');
    if (!scoreText || !scoreText.trim()) {
      throw new Error('result score not rendered');
    }

    if (errors.length) {
      throw new Error(`console errors: ${errors.join(' | ')}`);
    }

    return { name: run.name, ok: true, detail: scoreText.trim() };
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
  console.log(`Target: ${TARGET}`);

  process.exit(failed > 0 ? 1 : 0);
})();
