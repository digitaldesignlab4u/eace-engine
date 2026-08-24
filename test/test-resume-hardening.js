#!/usr/bin/env node
/**
 * Hardening pass follow-up: Resume Session must not blindly trust an
 * imported file's claimed score, per-answer shape, or mode/manifest
 * consistency. Each check here starts from a REAL, freshly saved session
 * (via the app's own Save Progress), then tampers one field before
 * attempting to resume it — proving the app's own validation catches the
 * tamper, not a hand-built fixture that might not match the real schema.
 *
 * v2 note: the saved answers array is now { id, option_order, picked_index,
 * correct } per answered question (not the old positional {id,correct}
 * array) — option_order is the exact shuffled display order, needed so a
 * resumed session's picked_index still points at the option actually
 * picked. `correct` is never trusted on import; it's recomputed from
 * option_order + picked_index against the live question data.
 *
 * Usage: node test/test-resume-hardening.js
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

async function saveRealSnapshot(context, tmpDir, { queryParams = {}, questionsToAnswer = 3, saveName = 'snap', includeName = false } = {}) {
  const page = await context.newPage();
  const url = 'file://' + FILE + (Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : '');
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#step-name, #in-name', { state: 'visible' }).catch(() => {});
  if (await page.isVisible('.mode-card[data-mode="pulse"]').catch(() => false) && !queryParams.type) {
    await page.click('.mode-card[data-mode="pulse"]');
    await page.waitForSelector('#step-name', { state: 'visible' });
  }
  await page.fill('#in-name', 'Hardening Test');
  await page.click('#btn-start');
  for (let i = 0; i < questionsToAnswer; i++) {
    await page.waitForSelector('#q-options .opt', { state: 'visible' });
    await page.click('#q-options .opt >> nth=0');
    await page.click('#btn-next');
  }
  await page.waitForSelector('#q-options .opt', { state: 'visible' });
  if (includeName) await page.check('#in-save-name');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btn-save-progress')
  ]);
  const savePath = path.join(tmpDir, saveName + '.json');
  await download.saveAs(savePath);
  await page.close();
  return JSON.parse(fs.readFileSync(savePath, 'utf8'));
}

async function attemptResume(context, tmpDir, snap, filename) {
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(snap));
  const page = await context.newPage();
  const alerts = [];
  const pageErrors = [];
  page.on('dialog', async (d) => { alerts.push(d.message()); await d.accept(); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto('file://' + FILE, { waitUntil: 'load' });
  await page.setInputFiles('#in-resume-file', filePath);
  await page.waitForTimeout(400);
  const onQuiz = await page.isVisible('#screen-quiz');
  const onResult = await page.isVisible('#screen-result');
  const resumed = onQuiz || onResult;
  let scoreShown = null;
  if (onResult) {
    scoreShown = (await page.textContent('#result-score')).trim();
  }
  await page.close();
  return { resumed, alerts, scoreShown, pageErrors };
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const context = await browser.newContext();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eace-hardening-'));

  try {
    // ---- 1. Manipulated top-level score must be recomputed, not trusted ----
    const snap1 = await saveRealSnapshot(context, tmpDir, { saveName: 'score-tamper', questionsToAnswer: 3 });
    const trueScore = snap1.answers.filter((a) => a.correct).length;
    const tampered1 = Object.assign({}, snap1, { score: 999 });
    const r1 = await attemptResume(context, tmpDir, tampered1, 'score-tamper.json');
    let finalScore = null;
    if (r1.resumed) {
      const page = await context.newPage();
      const filePath = path.join(tmpDir, 'score-tamper.json');
      await page.goto('file://' + FILE, { waitUntil: 'load' });
      await page.setInputFiles('#in-resume-file', filePath);
      await page.waitForSelector('#screen-quiz', { state: 'visible', timeout: 5000 });
      let guard = 0;
      while (guard++ < 20) {
        if (!(await page.isVisible('#screen-quiz'))) break;
        await page.waitForSelector('#q-options .opt', { state: 'visible' });
        await page.click('#q-options .opt >> nth=0');
        await page.click('#btn-next');
      }
      await page.waitForSelector('#screen-result', { state: 'visible' });
      const scoreText = (await page.textContent('#result-score')).trim();
      finalScore = parseInt(scoreText.split('/')[0].trim(), 10);
      await page.close();
    }
    record('Score tamper: resume accepted the file structurally', r1.resumed);
    record('Score tamper: final score derived from real answers, not the tampered 999',
      finalScore !== null && finalScore < 999 && finalScore >= trueScore,
      `trueScore-so-far=${trueScore}, finalScore=${finalScore}`);

    // ---- 2. answers[i].id referencing a question outside this session -> rejected ----
    const snap2 = await saveRealSnapshot(context, tmpDir, { saveName: 'id-mismatch', questionsToAnswer: 2 });
    const tampered2 = JSON.parse(JSON.stringify(snap2));
    tampered2.answers[0].id = 'q_nonexistent_swap_target';
    const r2 = await attemptResume(context, tmpDir, tampered2, 'id-mismatch.json');
    record('answers[i].id referencing an unknown question: resume rejected', !r2.resumed, r2.alerts.join(' | '));

    // ---- 3. Duplicate question_ids -> rejected ----
    const snap3 = await saveRealSnapshot(context, tmpDir, { saveName: 'dup-ids', questionsToAnswer: 1 });
    const tampered3 = JSON.parse(JSON.stringify(snap3));
    tampered3.question_ids[1] = tampered3.question_ids[0];
    const r3 = await attemptResume(context, tmpDir, tampered3, 'dup-ids.json');
    record('Duplicate question_ids: resume rejected', !r3.resumed, r3.alerts.join(' | '));

    // ---- 4. Unrecognised mode string -> rejected ----
    const snap4 = await saveRealSnapshot(context, tmpDir, { saveName: 'bad-mode', questionsToAnswer: 1 });
    const tampered4 = Object.assign({}, snap4, { mode: 'super-admin-mode' });
    const r4 = await attemptResume(context, tmpDir, tampered4, 'bad-mode.json');
    record('Unrecognised mode: resume rejected', !r4.resumed, r4.alerts.join(' | '));

    // ---- 4b. mode: "__proto__" -> rejected cleanly, no crash (prototype-chain
    // bracket-access gotcha: a plain object's ['__proto__'] falls through to
    // its actual prototype, which is truthy, so a naive `if (!MODE_META[x])`
    // check would let this through and then throw deeper in the function) ----
    const snap4b = await saveRealSnapshot(context, tmpDir, { saveName: 'proto-mode', questionsToAnswer: 1 });
    const tampered4b = Object.assign({}, snap4b, { mode: '__proto__' });
    const r4b = await attemptResume(context, tmpDir, tampered4b, 'proto-mode.json');
    record('mode: "__proto__": resume rejected, zero uncaught page errors',
      !r4b.resumed && r4b.pageErrors.length === 0,
      r4b.alerts.join(' | ') + (r4b.pageErrors.length ? ' | PAGE ERRORS: ' + r4b.pageErrors.join(' | ') : ''));

    // ---- 5. Claiming mode "exam" with a non-exam (pulse-sized) question set -> rejected ----
    const snap5 = await saveRealSnapshot(context, tmpDir, { saveName: 'fake-exam', questionsToAnswer: 1 });
    const tampered5 = Object.assign({}, snap5, { mode: 'exam', assessment_manifest_id: 'EXAM-2026-v1' });
    const r5 = await attemptResume(context, tmpDir, tampered5, 'fake-exam.json');
    record('Pulse question set relabeled as "exam": resume rejected', !r5.resumed, r5.alerts.join(' | '));

    // ---- 6. Malformed option_order (not a valid permutation) -> rejected ----
    const snap6 = await saveRealSnapshot(context, tmpDir, { saveName: 'bad-option-order', questionsToAnswer: 1 });
    const tampered6 = JSON.parse(JSON.stringify(snap6));
    tampered6.answers[0].option_order = tampered6.answers[0].option_order.map(() => 0); // all zeros: not a permutation
    const r6 = await attemptResume(context, tmpDir, tampered6, 'bad-option-order.json');
    record('Malformed option_order (not a permutation): resume rejected', !r6.resumed, r6.alerts.join(' | '));

    // ---- 6b. picked_index out of range -> rejected ----
    const snap6b = await saveRealSnapshot(context, tmpDir, { saveName: 'bad-picked-index', questionsToAnswer: 1 });
    const tampered6b = JSON.parse(JSON.stringify(snap6b));
    tampered6b.answers[0].picked_index = 99;
    const r6b = await attemptResume(context, tmpDir, tampered6b, 'bad-picked-index.json');
    record('Out-of-range picked_index: resume rejected', !r6b.resumed, r6b.alerts.join(' | '));

    // ---- 6c. Per-answer "correct" flag lied about (option_order/picked_index
    // left truthful) -> ignored; correctness is recomputed from picked_index
    // against the live question data, one level deeper than the top-level
    // score check in test 1. The reveal on the resumed (locked) question
    // must match the TRUE pick, not the lie: exactly one .wrong mark iff the
    // true pick was actually incorrect, regardless of what the file claims. ----
    const snap6c = await saveRealSnapshot(context, tmpDir, { saveName: 'flip-correct', questionsToAnswer: 1 });
    const trueCorrect = snap6c.answers[0].correct;
    const tampered6c = JSON.parse(JSON.stringify(snap6c));
    tampered6c.answers[0].correct = !trueCorrect;
    const filePath6c = path.join(tmpDir, 'flip-correct.json');
    fs.writeFileSync(filePath6c, JSON.stringify(tampered6c));
    const page6c = await context.newPage();
    const errors6c = [];
    page6c.on('pageerror', (e) => errors6c.push(String(e)));
    await page6c.goto('file://' + FILE, { waitUntil: 'load' });
    await page6c.setInputFiles('#in-resume-file', filePath6c);
    await page6c.waitForSelector('#q-options .opt', { state: 'visible', timeout: 5000 });
    const wrongMarkCount = await page6c.locator('#q-options .opt.wrong').count();
    const expectedWrongMarks = trueCorrect ? 0 : 1;
    record('Lied "correct" flag: reveal reflects the TRUE pick, not the lie',
      wrongMarkCount === expectedWrongMarks && errors6c.length === 0,
      `trueCorrect=${trueCorrect}, lied to=${!trueCorrect}, wrongMarks=${wrongMarkCount} (expected ${expectedWrongMarks})`);
    await page6c.close();

    // ---- 7. A legitimate, untampered save must still resume normally (control case) ----
    // includeName:true so resume doesn't hit the (expected, harmless) native
    // prompt() for a missing name — that prompt is itself a dialog, and
    // this case is specifically checking for ZERO dialogs on a clean file.
    const snap7 = await saveRealSnapshot(context, tmpDir, { saveName: 'control', questionsToAnswer: 2, includeName: true });
    const r7 = await attemptResume(context, tmpDir, snap7, 'control.json');
    record('Control: untampered save still resumes successfully with zero dialogs', r7.resumed && r7.alerts.length === 0, r7.alerts.join(' | '));

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
