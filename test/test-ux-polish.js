#!/usr/bin/env node
/**
 * Structural + visual regression for the quiz-screen UX polish pass:
 * question eyebrow/instruction, A/B/C answer markers, progress dots,
 * consolidated 3-block rail, Save Progress cluster copy.
 *
 * Usage: node test/test-ux-polish.js
 */
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.join(__dirname, '..', 'eace-compliance-tasting-menu-all-in-one.html');
const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const cspViolations = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.exposeFunction('__reportCSP', (v) => cspViolations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__reportCSP(e.violatedDirective + ' ' + e.blockedURI);
    });
  });

  // --- Pulse (5 questions): dots visible, eyebrow/instruction present, markers A/B/C ---
  await page.goto('file://' + FILE, { waitUntil: 'load' });
  await page.click('.mode-card[data-mode="pulse"]');
  await page.waitForSelector('#step-name', { state: 'visible' });
  await page.fill('#in-name', 'UX Test');
  await page.click('#btn-start');
  await page.waitForSelector('#q-options .opt', { state: 'visible' });

  const eyebrowText = await page.textContent('#q-eyebrow');
  record('Question eyebrow populated (legal area)', !!eyebrowText && eyebrowText.trim().length > 0, eyebrowText);

  const instructionVisible = await page.isVisible('.q-instruction');
  record('Instruction microcopy visible', instructionVisible);

  const markTexts = await page.$$eval('#q-options .opt-mark', (els) => els.map((e) => e.textContent));
  record('Answer markers are A, B, C...', JSON.stringify(markTexts) === JSON.stringify(markTexts.map((_, i) => String.fromCharCode(65 + i))), markTexts.join(','));

  const dotsVisible = await page.isVisible('#progress-dots');
  const dotCount = await page.$$eval('#progress-dots .dot', (els) => els.length);
  const currentDots = await page.$$eval('#progress-dots .dot.current', (els) => els.length);
  record('Progress dots visible for a 5-question pulse session', dotsVisible);
  record('Progress dots count matches session length (5)', dotCount === 5, 'got ' + dotCount);
  record('Exactly one "current" dot', currentDots === 1, 'got ' + currentDots);

  const railBlockCount = await page.$$eval('#rail .rail-block', (els) => els.length);
  record('Rail consolidated to 3 blocks', railBlockCount === 3, 'got ' + railBlockCount);

  const saveHintText = await page.textContent('.save-progress-hint');
  record('Save Progress hint microcopy present', saveHintText.includes('Downloaded locally'), saveHintText);

  const checkLabelText = await page.textContent('.save-progress-check');
  record('Save Progress checkbox label shortened', checkLabelText.trim() === 'Include name', JSON.stringify(checkLabelText.trim()));

  // Answer, verify correct/wrong marks recolor without losing the letter.
  await page.click('#q-options .opt >> nth=0');
  const firstOptClass = await page.getAttribute('#q-options .opt >> nth=0', 'class');
  const firstMarkText = await page.textContent('#q-options .opt-mark >> nth=0');
  record('Selected option still shows its letter after answering', firstMarkText === 'A', firstMarkText);
  record('Selected option got a state class (correct/wrong)', /correct|wrong/.test(firstOptClass), firstOptClass);

  await page.screenshot({ path: '/tmp/claude-0/-home-user-eace-engine/cb88b39f-7296-5b87-ab82-5abc6e7e70cd/scratchpad/quiz-pulse-1440.png', fullPage: false });

  // --- Exam (30 questions): dots hidden ---
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page2.goto('file://' + FILE + '?type=exam', { waitUntil: 'load' });
  await page2.waitForSelector('#in-name', { state: 'visible' });
  await page2.fill('#in-name', 'Exam UX Test');
  await page2.click('#btn-start');
  await page2.waitForSelector('#q-options .opt', { state: 'visible' });
  const examDotsVisible = await page2.isVisible('#progress-dots');
  record('Progress dots hidden for a 30-question exam session', !examDotsVisible);
  await page2.close();

  // --- Mobile viewport sanity (390px): no overflow with new hero/markers/dots ---
  const page3 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page3.goto('file://' + FILE, { waitUntil: 'load' });
  await page3.click('.mode-card[data-mode="pulse"]');
  await page3.waitForSelector('#step-name', { state: 'visible' });
  await page3.fill('#in-name', 'Mobile UX Test');
  await page3.click('#btn-start');
  await page3.waitForSelector('#q-options .opt', { state: 'visible' });
  const overflow390 = await page3.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  record('No horizontal overflow at 390px with new elements', !overflow390);
  await page3.screenshot({ path: '/tmp/claude-0/-home-user-eace-engine/cb88b39f-7296-5b87-ab82-5abc6e7e70cd/scratchpad/quiz-pulse-390.png', fullPage: false });
  await page3.close();

  record('Zero console/page errors', errors.length === 0, errors.join(' | '));
  record('Zero CSP violations', cspViolations.length === 0, cspViolations.join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${results.length - passed} failed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
