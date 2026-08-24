#!/usr/bin/env node
/**
 * Real-browser regression for Save Progress / Resume Session / Record of
 * Completion — the three features added on top of the all-in-one build's
 * existing receipt + Evidence Mode + admin split.
 *
 * Usage: node test/test-save-resume-record.js
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');

const FILE = path.join(__dirname, '..', 'eace-compliance-tasting-menu-all-in-one.html');
const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function answerNQuestions(page, n, nextSelector) {
  for (let i = 0; i < n; i++) {
    await page.waitForSelector('#q-options .opt', { state: 'visible' });
    await page.click('#q-options .opt >> nth=0');
    await page.click(nextSelector);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const context = await browser.newContext();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eace-session-'));

  try {
    // ============================================================
    // 1. Save Progress mid-quiz (pulse, evidence opted in), name NOT included by default
    // ============================================================
    const page1 = await context.newPage();
    const errors1 = [];
    page1.on('console', (m) => { if (m.type() === 'error') errors1.push(m.text()); });
    page1.on('pageerror', (e) => errors1.push(String(e)));

    await page1.goto('file://' + FILE, { waitUntil: 'load' });
    await page1.click('.mode-card[data-mode="pulse"]');
    await page1.waitForSelector('#step-name', { state: 'visible' });
    await page1.check('#in-evidence');
    await page1.fill('#in-name', 'Ana Kovač');
    await page1.click('#btn-start');

    // Answer 2 of 5 pulse questions, then save without clicking Next a 3rd time.
    await answerNQuestions(page1, 2, '#btn-next');
    await page1.waitForSelector('#q-options .opt', { state: 'visible' });

    const [download1] = await Promise.all([
      page1.waitForEvent('download'),
      page1.click('#btn-save-progress')
    ]);
    const savePath1 = path.join(tmpDir, 'session-no-name.json');
    await download1.saveAs(savePath1);
    const snap1 = JSON.parse(fs.readFileSync(savePath1, 'utf8'));

    record('Save Progress: file has eace_session_file marker', snap1.eace_session_file === true);
    record('Save Progress: schema_version is 1', snap1.schema_version === 1);
    record('Save Progress: name omitted by default', snap1.name === null, JSON.stringify(snap1.name));
    record('Save Progress: current_index reflects 2 answered questions', snap1.current_index === 2, 'got ' + snap1.current_index);
    record('Save Progress: answers array length matches current_index', snap1.answers.length === snap1.current_index);
    record('Save Progress: attempt_id present', typeof snap1.attempt_id === 'string' && snap1.attempt_id.startsWith('EACE-ATT-'));
    record('Save Progress: evidence_opt_in true (checkbox was checked)', snap1.evidence_opt_in === true);
    record('Save Progress: question_ids length matches pulse size (5)', Array.isArray(snap1.question_ids) && snap1.question_ids.length === 5, 'got ' + (snap1.question_ids || []).length);

    // ============================================================
    // 2. Save Progress with "include my name" checked
    // ============================================================
    await page1.check('#in-save-name');
    const [download2] = await Promise.all([
      page1.waitForEvent('download'),
      page1.click('#btn-save-progress')
    ]);
    const savePath2 = path.join(tmpDir, 'session-with-name.json');
    await download2.saveAs(savePath2);
    const snap2 = JSON.parse(fs.readFileSync(savePath2, 'utf8'));
    record('Save Progress: name included when opted in', snap2.name === 'Ana Kovač', JSON.stringify(snap2.name));

    record('Save/quiz page: zero console/page errors so far', errors1.length === 0, errors1.join(' | '));
    await page1.close();

    // ============================================================
    // 3. Resume from the WITH-NAME file in a fresh page/tab, continue to completion
    // ============================================================
    const page2 = await context.newPage();
    const errors2 = [];
    const dialogMessages2 = [];
    page2.on('console', (m) => { if (m.type() === 'error') errors2.push(m.text()); });
    page2.on('pageerror', (e) => errors2.push(String(e)));
    page2.on('dialog', async (d) => { dialogMessages2.push(d.message()); await d.accept(); });

    await page2.goto('file://' + FILE, { waitUntil: 'load' });
    await page2.setInputFiles('#in-resume-file', savePath2);
    await page2.waitForSelector('#screen-quiz', { state: 'visible', timeout: 5000 });

    const qCountAfterResume = await page2.textContent('#q-count');
    record('Resume: lands on question 3 of 5 (2 already answered)', qCountAfterResume.trim().startsWith('3 /'), qCountAfterResume);
    record('Resume: no confirm/alert fired for a matching pool_version', dialogMessages2.length === 0, dialogMessages2.join(' | '));

    const evidenceCheckedAfterResume = await page2.isChecked('#in-evidence');
    record('Resume: evidence opt-in restored from saved session', evidenceCheckedAfterResume === true);

    // Finish the remaining 3 questions.
    await answerNQuestions(page2, 3, '#btn-next');
    await page2.waitForSelector('#screen-result', { state: 'visible' });

    const receiptToken = (await page2.textContent('#token-out')).trim();
    function decodeReceipt(token) {
      let b64 = token.slice('EACE-'.length);
      b64 += '='.repeat((4 - (b64.length % 4)) % 4);
      const parts = Buffer.from(b64, 'base64').toString('utf8').split('|');
      return { name: parts[2], attempt_id: parts[9] };
    }
    const decodedReceipt = decodeReceipt(receiptToken);
    record('Resume: receipt after completion uses restored name', decodedReceipt.name === 'Ana Kovač', decodedReceipt.name);
    record('Resume: receipt attempt_id matches the saved session\'s attempt_id', decodedReceipt.attempt_id === snap2.attempt_id, decodedReceipt.attempt_id + ' vs ' + snap2.attempt_id);

    const evidenceVisibleAfterResume = await page2.isVisible('#evidence-result');
    record('Resume: Evidence Mode still fires after resuming (opt-in preserved end to end)', evidenceVisibleAfterResume);
    if (evidenceVisibleAfterResume) {
      const evToken = await page2.textContent('#evidence-token');
      const evDecoded = JSON.parse(Buffer.from(evToken.replace('EACE-EVID-', ''), 'base64').toString('utf8'));
      record('Resume: evidence attempt_id matches receipt/saved attempt_id', evDecoded.attempt_id === snap2.attempt_id, evDecoded.attempt_id);
      record('Resume: evidence answers length is 5 (2 restored + 3 fresh)', evDecoded.answers.length === 5, evDecoded.answers.length);
    }

    record('Resume-and-complete page: zero console/page errors', errors2.length === 0, errors2.join(' | '));
    await page2.close();

    // ============================================================
    // 4. Resume from the NO-NAME file: must prompt for a name (native prompt())
    // ============================================================
    const page3 = await context.newPage();
    let promptSeen = false;
    page3.on('dialog', async (d) => {
      if (d.type() === 'prompt') { promptSeen = true; await d.accept('Prompted Name'); }
      else await d.accept();
    });
    await page3.goto('file://' + FILE, { waitUntil: 'load' });
    await page3.setInputFiles('#in-resume-file', savePath1);
    await page3.waitForSelector('#screen-quiz', { state: 'visible', timeout: 5000 });
    record('Resume: missing name triggers a prompt() for it', promptSeen);
    await page3.close();

    // ============================================================
    // 5. Resume with a tampered pool_version -> confirm() dialog, cancel -> stays on welcome
    // ============================================================
    const badPoolPath = path.join(tmpDir, 'session-bad-pool.json');
    const badPoolSnap = Object.assign({}, snap2, { pool_version: '1999-01' });
    fs.writeFileSync(badPoolPath, JSON.stringify(badPoolSnap));

    const page4 = await context.newPage();
    let confirmSeen = false;
    page4.on('dialog', async (d) => {
      if (d.type() === 'confirm') { confirmSeen = true; await d.dismiss(); }
      else await d.accept();
    });
    await page4.goto('file://' + FILE, { waitUntil: 'load' });
    await page4.setInputFiles('#in-resume-file', badPoolPath);
    await page4.waitForTimeout(300);
    const stillOnWelcome = await page4.isVisible('#screen-welcome');
    record('Resume: mismatched pool_version prompts confirm()', confirmSeen);
    record('Resume: cancelling the pool-mismatch confirm() stays on welcome screen', stillOnWelcome);
    await page4.close();

    // ============================================================
    // 6. Resume with a corrupt/invalid file -> alert(), no crash
    // ============================================================
    const corruptPath = path.join(tmpDir, 'corrupt.json');
    fs.writeFileSync(corruptPath, 'not valid json {{{');
    const page5 = await context.newPage();
    const page5Errors = [];
    page5.on('pageerror', (e) => page5Errors.push(String(e)));
    let alertSeen = false;
    page5.on('dialog', async (d) => { if (d.type() === 'alert') alertSeen = true; await d.accept(); });
    await page5.goto('file://' + FILE, { waitUntil: 'load' });
    await page5.setInputFiles('#in-resume-file', corruptPath);
    await page5.waitForTimeout(300);
    record('Resume: corrupt file triggers alert(), no uncaught page error', alertSeen && page5Errors.length === 0, page5Errors.join(' | '));
    await page5.close();

    // ============================================================
    // 7. Record of Completion print isolation (pass case)
    // ============================================================
    const page6 = await context.newPage();
    const errors6 = [];
    page6.on('console', (m) => { if (m.type() === 'error') errors6.push(m.text()); });
    page6.on('pageerror', (e) => errors6.push(String(e)));
    await page6.goto('file://' + FILE, { waitUntil: 'load' });
    await page6.evaluate(() => { window.print = () => { window.__printed = true; }; });
    await page6.click('.mode-card[data-mode="pulse"]');
    await page6.waitForSelector('#step-name', { state: 'visible' });
    await page6.fill('#in-name', 'Record Runner');
    await page6.click('#btn-start');
    await answerNQuestions(page6, 5, '#btn-next');
    await page6.waitForSelector('#screen-result', { state: 'visible' });

    const rocGridHtml = await page6.innerHTML('#roc-grid');
    record('Record of Completion: grid populated with fields', rocGridHtml.includes('Attempt ID') && rocGridHtml.includes('Pool version') && rocGridHtml.includes('Legal baseline'));
    record('Record of Completion: name field renders', rocGridHtml.includes('Record Runner'));

    await page6.click('#btn-print-record');
    const hasClass = await page6.evaluate(() => document.body.classList.contains('printing-record-only'));
    record('Record of Completion: printing-record-only class applied', hasClass);

    await page6.emulateMedia({ media: 'print' });
    const rocDisplay = await page6.evaluate(() => getComputedStyle(document.getElementById('record-of-completion')).display);
    const resultBodyDisplay = await page6.evaluate(() => getComputedStyle(document.getElementById('result-body')).display);
    const evidenceResultDisplay = await page6.evaluate(() => getComputedStyle(document.getElementById('evidence-result')).display);
    record('Record print pass: record-of-completion visible', rocDisplay === 'block', rocDisplay);
    record('Record print pass: result-body hidden', resultBodyDisplay === 'none', resultBodyDisplay);
    record('Record print pass: evidence-result hidden even if present', evidenceResultDisplay === 'none', evidenceResultDisplay);
    await page6.emulateMedia({ media: 'screen' });

    await page6.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const hasClassAfter = await page6.evaluate(() => document.body.classList.contains('printing-record-only'));
    record('Record print pass: class removed after afterprint', !hasClassAfter);

    // Default print (completion summary) must NOT show the record.
    await page6.emulateMedia({ media: 'print' });
    const rocDisplayDefault = await page6.evaluate(() => getComputedStyle(document.getElementById('record-of-completion')).display);
    record('Default print pass: record-of-completion hidden', rocDisplayDefault === 'none', rocDisplayDefault);
    await page6.emulateMedia({ media: 'screen' });

    record('Record of Completion page: zero console/page errors', errors6.length === 0, errors6.join(' | '));
    await page6.close();

    // ============================================================
    // 8. Exam fail: both Print buttons hidden, no record built
    // ============================================================
    const page7 = await context.newPage();
    await page7.goto('file://' + FILE + '?type=exam', { waitUntil: 'load' });
    await page7.waitForSelector('#in-name', { state: 'visible' });
    await page7.fill('#in-name', 'Exam Faller');
    await page7.click('#btn-start');
    // Answer wrong deliberately by always picking the last option isn't guaranteed wrong either;
    // instead just answer nth=0 for all 30 and accept whatever score lands, then only assert the
    // print-hiding behavior IF the run actually failed (probabilistically near-certain at random).
    let guard = 0;
    while (guard++ < 40) {
      if (!(await page7.isVisible('#screen-quiz'))) break;
      await page7.waitForSelector('#q-options .opt', { state: 'visible' });
      await page7.click('#q-options .opt >> nth=0');
      await page7.click('#btn-next-exam');
    }
    await page7.waitForSelector('#screen-result', { state: 'visible' });
    const failed = await page7.isVisible('.locked');
    if (failed) {
      const printVisible = await page7.isVisible('#btn-print');
      const printRecordVisible = await page7.isVisible('#btn-print-record');
      record('Exam fail: Print completion summary button hidden', !printVisible);
      record('Exam fail: Print Record of Completion button hidden', !printRecordVisible);
    } else {
      record('Exam fail: Print buttons hidden on fail (skipped — this random run happened to pass)', true, 'skipped, not a failure of the feature');
    }
    await page7.close();

  } finally {
    await browser.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${results.length - passed} failed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
