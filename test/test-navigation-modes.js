#!/usr/bin/env node
/**
 * Direct regression for the per-mode navigation rules (Previous/Next/
 * skip/lock/Mark for review/Review & Submit) — not just their interaction
 * with Save/Resume, but the navigation UX itself:
 *   Pulse/Sector    — Next blocked until answered; Previous is read-only
 *                     review, answer can't be changed once locked.
 *   Onboarding/Deep — Next allowed before answering (skip); reaching the
 *   Dive              end with unanswered questions shows a gate instead
 *                     of silently completing; "Review unanswered" jumps to
 *                     the first gap; answers still lock once given.
 *   Annual Assessment — full free navigation, answers changeable up to
 *                     Submit, Mark for review persists, Review & Submit
 *                     screen reports accurate counts.
 *
 * Usage: node test/test-navigation-modes.js
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

  try {
    // ================================================================
    // PULSE: Next blocked until answered; Previous is read-only review
    // ================================================================
    {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('file://' + FILE, { waitUntil: 'load' });
      await page.click('.mode-card[data-mode="pulse"]');
      await page.waitForSelector('#step-name', { state: 'visible' });
      await page.fill('#in-name', 'Nav Test');
      await page.click('#btn-start');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });

      const nextDisabledBefore = await page.isDisabled('#btn-next');
      record('Pulse: Next disabled before answering', nextDisabledBefore);

      await page.click('#q-options .opt >> nth=0');
      const nextEnabledAfter = !(await page.isDisabled('#btn-next'));
      record('Pulse: Next enabled after answering', nextEnabledAfter);

      await page.click('#btn-next');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      const prevEnabledOnQ2 = !(await page.isDisabled('#btn-prev'));
      record('Pulse: Previous enabled on question 2', prevEnabledOnQ2);

      await page.click('#btn-prev');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      const q1Locked = await page.locator('#q-options .opt').first().isDisabled();
      const hasRevealClass = (await page.locator('#q-options .opt.correct, #q-options .opt.wrong').count()) > 0;
      record('Pulse: revisiting an answered question shows it locked/read-only', q1Locked && hasRevealClass);

      // Clicking a disabled option must not change anything (browsers already
      // block clicks on disabled elements, but assert no error either way).
      record('Pulse: zero page errors through this flow', errors.length === 0, errors.join(' | '));
      await page.close();
    }

    // ================================================================
    // ONBOARDING: skip allowed, unanswered gate, review-unanswered jump
    // ================================================================
    {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('file://' + FILE + '?type=onboarding', { waitUntil: 'load' });
      await page.waitForSelector('#in-name', { state: 'visible' });
      await page.fill('#in-name', 'Nav Test');
      await page.click('#btn-start');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });

      const nextEnabledUnanswered = !(await page.isDisabled('#btn-next'));
      record('Onboarding: Next enabled even without answering (skip)', nextEnabledUnanswered);

      // Skip question 1 without answering, answer question 2, then skip
      // straight to the end (skipping every remaining question) to trigger
      // the unanswered gate deterministically.
      await page.click('#btn-next'); // skip q1
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      await page.click('#q-options .opt >> nth=0'); // answer q2
      await page.click('#btn-next');

      let guard = 0;
      while (guard++ < 20) {
        if (!(await page.isVisible('#screen-quiz')) || (await page.isVisible('#unanswered-gate'))) break;
        await page.click('#btn-next'); // skip everything else
      }
      const gateVisible = await page.isVisible('#unanswered-gate');
      record('Onboarding: reaching the end with skipped questions shows the unanswered gate', gateVisible);
      record('Onboarding: quiz nav footer hidden while the gate is showing',
        !(await page.isVisible('.quiz-nav-footer')));

      await page.click('#btn-review-unanswered');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      const gateHiddenAfterReview = !(await page.isVisible('#unanswered-gate'));
      record('Onboarding: "Review unanswered" jumps back into the quiz (gate closes)', gateHiddenAfterReview);
      const qCountAfterReview = await page.textContent('#q-count');
      record('Onboarding: lands on question 1 (the first unanswered)', qCountAfterReview.trim().startsWith('1 /'), qCountAfterReview);

      record('Onboarding: zero page errors through this flow', errors.length === 0, errors.join(' | '));
      await page.close();
    }

    // ================================================================
    // ONBOARDING: "Finish anyway" completes despite unanswered questions
    // ================================================================
    {
      const page = await browser.newPage();
      await page.goto('file://' + FILE + '?type=onboarding', { waitUntil: 'load' });
      await page.waitForSelector('#in-name', { state: 'visible' });
      await page.fill('#in-name', 'Nav Test');
      await page.click('#btn-start');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      let guard = 0;
      while (guard++ < 20) {
        if (!(await page.isVisible('#screen-quiz')) || (await page.isVisible('#unanswered-gate'))) break;
        await page.click('#btn-next'); // skip every question
      }
      await page.waitForSelector('#unanswered-gate', { state: 'visible' });
      await page.click('#btn-finish-anyway');
      await page.waitForSelector('#screen-result', { state: 'visible', timeout: 5000 });
      const scoreText = await page.textContent('#result-score');
      record('Onboarding: "Finish anyway" completes to the result screen', true, scoreText.trim());
      record('Onboarding: all-skipped session scores 0 (unanswered = incorrect)', scoreText.trim().startsWith('0 /'), scoreText.trim());
      await page.close();
    }

    // ================================================================
    // ANNUAL ASSESSMENT: free nav, changeable answers, mark for review,
    // Review & Submit counts
    // ================================================================
    {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('file://' + FILE + '?type=exam', { waitUntil: 'load' });
      await page.waitForSelector('#in-name', { state: 'visible' });
      await page.fill('#in-name', 'Nav Test');
      await page.click('#btn-start');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });

      // Answer q1, then change the answer before moving on.
      await page.click('#q-options .opt >> nth=0');
      const firstPickClass = await page.locator('#q-options .opt').nth(0).getAttribute('class');
      await page.click('#q-options .opt >> nth=1');
      const stillInteractive = !(await page.locator('#q-options .opt').nth(0).isDisabled());
      record('Exam: options remain clickable after answering (no lock pre-submit)', stillInteractive, firstPickClass);
      const secondPickClass = await page.locator('#q-options .opt').nth(1).getAttribute('class');
      record('Exam: re-selecting changes which option is marked "picked"', secondPickClass.includes('picked'));

      // Mark for review.
      const markVisible = await page.isVisible('#btn-mark-review');
      record('Exam: Mark for review button visible', markVisible);
      await page.click('#btn-mark-review');
      const markedActive = (await page.getAttribute('#btn-mark-review', 'class')).includes('active');
      record('Exam: Mark for review toggles active state', markedActive);

      // Move to q2, leave unanswered, jump to Review & Submit directly.
      await page.click('#btn-next');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      await page.click('#btn-review-submit');
      await page.waitForSelector('#screen-submit', { state: 'visible', timeout: 5000 });

      const statsText = await page.textContent('#submit-stats');
      record('Review & Submit: shows Answered 1 / 30', /1\s*\/\s*30/.test(statsText), statsText.replace(/\s+/g, ' '));
      record('Review & Submit: shows Marked for review 1', /Marked for review[^0-9]*1/.test(statsText.replace(/\s+/g, ' ')), statsText.replace(/\s+/g, ' '));
      const warningVisible = await page.isVisible('#submit-warning');
      record('Review & Submit: unanswered warning visible (29 unanswered)', warningVisible);

      // Navigator chip for q1 should show "answered" + "marked".
      const chip1Class = await page.locator('#submit-qnav-grid .qnav-chip').nth(0).getAttribute('class');
      record('Review & Submit: navigator chip 1 shows answered+marked', chip1Class.includes('answered') && chip1Class.includes('marked'), chip1Class);

      // "Continue reviewing" returns to the quiz without submitting.
      await page.click('#btn-cancel-submit');
      const backOnQuiz = await page.isVisible('#screen-quiz');
      record('Review & Submit: "Continue reviewing" returns to the quiz screen', backOnQuiz);

      record('Exam navigation: zero page errors through this flow', errors.length === 0, errors.join(' | '));
      await page.close();
    }

    // ================================================================
    // ANNUAL ASSESSMENT: submit with unanswered questions scores them incorrect
    // ================================================================
    {
      const page = await browser.newPage();
      await page.goto('file://' + FILE + '?type=exam', { waitUntil: 'load' });
      await page.waitForSelector('#in-name', { state: 'visible' });
      await page.fill('#in-name', 'Nav Test');
      await page.click('#btn-start');
      await page.waitForSelector('#q-options .opt', { state: 'visible' });
      await page.click('#q-options .opt >> nth=0'); // answer only q1
      await page.click('#btn-review-submit');
      await page.waitForSelector('#screen-submit', { state: 'visible' });
      await page.click('#btn-confirm-submit');
      await page.waitForSelector('#screen-result', { state: 'visible', timeout: 5000 });
      const scoreText = await page.textContent('#result-score');
      const numerator = parseInt(scoreText.split('/')[0].trim(), 10);
      record('Exam: submitting with 29 unanswered scores at most 1 correct', numerator <= 1, scoreText.trim());
      await page.close();
    }

  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${results.length - passed} failed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
