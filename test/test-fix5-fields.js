#!/usr/bin/env node
/**
 * Regression check for the completion_status/benchmark_* fields added to
 * the Evidence object (evidence.js schema v2) — drives real exam and pulse
 * sessions in a real browser and decodes the resulting evidence token,
 * rather than unit-testing buildLocalEvidence() in isolation, so a wiring
 * mistake in dispatchEvidenceCompletion() (all-in-one file, print-renderer
 * section) would show up here too.
 *
 * Usage: node test/test-fix5-fields.js
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

function decodeEvidenceToken(tokenText) {
  const b64 = tokenText.replace('EACE-EVID-', '');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

async function runExamSession(page) {
  await page.goto('file://' + FILE + '?type=exam', { waitUntil: 'load' });
  await page.waitForSelector('#in-evidence', { state: 'visible' });
  await page.check('#in-evidence');
  await page.fill('#in-name', 'Exam Runner');
  await page.click('#btn-start');

  let guard = 0;
  while (guard++ < 40) {
    if (!(await page.isVisible('#screen-quiz'))) break;
    await page.waitForSelector('#q-options .opt', { state: 'visible' });
    await page.click('#q-options .opt >> nth=0');
    await page.click('#btn-next-exam');
  }
  await page.waitForSelector('#evidence-result', { state: 'visible' });
  return decodeEvidenceToken(await page.textContent('#evidence-token'));
}

async function runPulseSession(page) {
  await page.goto('file://' + FILE, { waitUntil: 'load' });
  await page.click('.mode-card[data-mode="pulse"]');
  await page.waitForSelector('#step-name', { state: 'visible' });
  await page.check('#in-evidence');
  await page.fill('#in-name', 'Pulse Runner');
  await page.click('#btn-start');

  let guard = 0;
  while (guard++ < 20) {
    if (!(await page.isVisible('#screen-quiz'))) break;
    await page.waitForSelector('#q-options .opt', { state: 'visible' });
    await page.click('#q-options .opt >> nth=0');
    await page.click('#btn-next');
  }
  await page.waitForSelector('#evidence-result', { state: 'visible' });
  return decodeEvidenceToken(await page.textContent('#evidence-token'));
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  try {
    // Exam mode's actual pass/fail depends on shuffled question draw, which this
    // test doesn't control — so instead of asserting a fixed outcome, it asserts
    // the field is INTERNALLY CONSISTENT with whatever score the run produced.
    // Two independent draws exercise the wiring twice, not to sample both
    // pass/fail (either could recur), just to rule out a one-off fluke.
    for (let i = 0; i < 2; i++) {
      const decoded = await runExamSession(page);
      const expectedMet = decoded.score / decoded.total >= 0.8;
      const detail = `score=${decoded.score}/${decoded.total} benchmark_met=${decoded.benchmark_met}`;
      record(`Exam run ${i}: completion_status is "completed"`, decoded.completion_status === 'completed', detail);
      record(`Exam run ${i}: benchmark_type is EACE_INTERNAL`, decoded.benchmark_type === 'EACE_INTERNAL', detail);
      record(`Exam run ${i}: benchmark_threshold is 80`, decoded.benchmark_threshold === 80, detail);
      record(`Exam run ${i}: benchmark_met matches score/total >= 0.8`, decoded.benchmark_met === expectedMet, detail);
    }

    const pulse = await runPulseSession(page);
    record('Pulse: completion_status is "completed"', pulse.completion_status === 'completed');
    record('Pulse: benchmark_type is null (non-exam mode)', pulse.benchmark_type === null);
    record('Pulse: benchmark_threshold is null (non-exam mode)', pulse.benchmark_threshold === null);
    record('Pulse: benchmark_met is null (non-exam mode)', pulse.benchmark_met === null);

    record('Zero console/page errors across whole run', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${results.length - passed} failed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
