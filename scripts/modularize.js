#!/usr/bin/env node
/**
 * One-off refactor (Task 1): reorganizes the inline <script> into six
 * clearly banner-commented, dependency-safe sections —
 *   app-shell / question-registry / legal-source-registry /
 *   assessment-engine / receipt-engine / print-renderer
 * — without changing any external behaviour.
 *
 * The QUESTIONS / QUESTIONS_SECTOR / LEGAL_SOURCES / WAVE_LINES / ROLES /
 * SECTORS blocks are extracted VERBATIM (bracket-matched, byte-identical)
 * from the current file and spliced into the new layout; only the smaller
 * "engine" code around them (DOM lookups, event wiring, session logic) is
 * rewritten, consolidating scattered document.getElementById() calls into
 * a single DOM refs object and extracting the receipt-token logic into its
 * own function. All top-level side effects (dropdown population, event
 * listener attachment, the initial updateWelcomeUI() call) still happen in
 * the same relative order as before, just gathered into one init() call
 * fired once at the very end of the IIFE.
 *
 * Usage: node scripts/modularize.js
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'eace-compliance-tasting-menu.html');

function extractBlock(html, startMarker, openChar, closeChar) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find ' + startMarker);
  let depth = 0;
  let i = startIdx + startMarker.length - 1; // at the opening bracket
  let endIdx = -1;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of block starting ' + startMarker);
  // include trailing ';' if present
  let end = endIdx + 1;
  if (html[end] === ';') end++;
  return { text: html.slice(startIdx, end), startIdx, endIdx: end };
}

function main() {
  const html = fs.readFileSync(TARGET, 'utf8');

  const scriptOpenIdx = html.indexOf('<script>') + '<script>'.length;
  const scriptCloseIdx = html.indexOf('</script>');
  if (scriptOpenIdx === -1 || scriptCloseIdx === -1) throw new Error('Could not find <script> tags');

  const legalSources = extractBlock(html, 'const LEGAL_SOURCES = {', '{', '}');
  const questions = extractBlock(html, 'const QUESTIONS = [', '[', ']');
  const questionsSector = extractBlock(html, 'const QUESTIONS_SECTOR = [', '[', ']');
  const waveLines = extractBlock(html, 'const WAVE_LINES = {', '{', '}');
  const roles = extractBlock(html, 'const ROLES = [', '[', ']');
  const sectors = extractBlock(html, 'const SECTORS = [', '[', ']');

  // Registry comment block currently sits just before LEGAL_SOURCES's own
  // "const LEGAL_SOURCES" line; grab the "// ----" doc comment that
  // precedes it so it travels with the block into its new section.
  const legalSourcesCommentStart = html.lastIndexOf('// ---- Legal Source Registry ----', legalSources.startIdx);
  const legalSourcesFull = html.slice(legalSourcesCommentStart, legalSources.endIdx);

  const HEADER = `/* ═══════════════════════════════════════════════════
   EACE.ai — Compliance Tasting Menu — engine
   100% client-side. No network calls. No login. No storage
   of the person's name — it lives in a JS variable only,
   for this session, and is never written to localStorage,
   sessionStorage, cookies, or sent anywhere.

   Question pools: 161 general questions (QUESTIONS) + 194 sector
   questions (QUESTIONS_SECTOR). Each traces to a legally-reviewed
   source citation (see legal-source-registry below); the correct
   option paraphrases the verified position, distractors represent
   common misreadings, not asserted law.

   Track model (replaces the old topic-category filter):
     role:'all'         — General / shared foundation, everyone draws from this
     role:'manager'      — advanced layer, managers & decision-makers
     role:'compliance'   — advanced layer, Compliance & Legal
     role:'technical'    — advanced layer, Technical / Engineering
   General track pool = the FULL question set. A role track pool =
   ONLY that role's tagged subset (harder, separate layer — not
   general + extras).

   Modes (?type=pulse|onboarding|deepdive|exam|sector, default pulse):
     pulse      — 5 random Qs from the selected track, immediate feedback
     onboarding — fixed 18-Q set from role:'all' only, same for every
                  new hire (seed 424242), immediate feedback, no lock
     deepdive   — fixed 20-Q set, rotates every 6 months, full pool
     exam       — fixed 30-Q set, rotates yearly, full pool, feedback
                  withheld until the certificate screen, 80% to pass
     sector     — 5 random Qs from QUESTIONS_SECTOR (separate 194-item
                  pool), filtered by the Sector dropdown instead of Track;
                  runs after the general pool, not combined with it

   Layout (each section is self-contained enough to lift into its own
   file later without restructuring — it just ships as one file today):
     1. app-shell            — DOM refs, screen show/hide, init
     2. question-registry    — QUESTIONS, QUESTIONS_SECTOR, ROLES, SECTORS, WAVE_LINES
     3. legal-source-registry — LEGAL_SOURCES lookup
     4. assessment-engine    — pool selection, seeded shuffle, scoring, mode logic
     5. receipt-engine       — token generation, b64 encoding
     6. print-renderer       — print CSS hooks (see <style> @media print), certificate rendering
═══════════════════════════════════════════════════ */
(function(){

/* ═══════════════════════════════════════════════════
   SECTION: app-shell — DOM refs, screen show/hide, init
═══════════════════════════════════════════════════ */

// ---- DOM refs (looked up once; every other section reads from here) ----
const DOM = {
  inRole: document.getElementById('in-role'),
  inSector: document.getElementById('in-sector'),
  roleField: document.getElementById('role-field'),
  sectorField: document.getElementById('sector-field'),
  poolToggleWrap: document.getElementById('pool-toggle-wrap'),
  poolToggleBtns: document.querySelectorAll('#pool-toggle button'),
  welcomeSub: document.getElementById('welcome-sub'),
  inName: document.getElementById('in-name'),
  btnStart: document.getElementById('btn-start'),
  screenWelcome: document.getElementById('screen-welcome'),
  screenQuiz: document.getElementById('screen-quiz'),
  screenResult: document.getElementById('screen-result'),
  examNote: document.getElementById('exam-note'),
  progressFill: document.getElementById('progress-fill'),
  qSource: document.getElementById('q-source'),
  qCount: document.getElementById('q-count'),
  qText: document.getElementById('q-text'),
  qOptions: document.getElementById('q-options'),
  feedback: document.getElementById('feedback'),
  fbAlba: document.getElementById('fb-alba'),
  fbKai: document.getElementById('fb-kai'),
  btnNext: document.getElementById('btn-next'),
  resultScore: document.getElementById('result-score'),
  resultPct: document.getElementById('result-pct'),
  waveNoteTxt: document.getElementById('wave-note-txt'),
  resultBody: document.getElementById('result-body'),
  tokenSection: document.getElementById('token-section'),
  resultTitle: document.getElementById('result-title'),
  tokenOut: document.getElementById('token-out'),
  btnRestart: document.getElementById('btn-restart'),
  btnPrint: document.getElementById('btn-print')
};

// ---- Screen show/hide ----
function showWelcomeScreen(){
  DOM.screenWelcome.style.display = 'block';
  DOM.screenQuiz.style.display = 'none';
  DOM.screenResult.style.display = 'none';
}
function showQuizScreen(){
  DOM.screenWelcome.style.display = 'none';
  DOM.screenQuiz.style.display = 'block';
}
function showResultScreen(){
  DOM.screenQuiz.style.display = 'none';
  DOM.screenResult.style.display = 'block';
}

// ---- Welcome-screen copy per mode ----
function updateWelcomeUI(){
  DOM.roleField.style.display = (mode === 'pulse') ? '' : 'none';
  DOM.sectorField.style.display = (mode === 'sector') ? '' : 'none';

  // The General/Sector toggle only makes sense for the default pulse cadence —
  // onboarding/deep-dive/exam are fixed, general-only cadences by design (a
  // sector-specific annual exam or onboarding set isn't part of this spec),
  // so the toggle hides entirely for those and shows only for pulse/sector.
  const toggleApplies = (mode === 'pulse' || mode === 'sector');
  DOM.poolToggleWrap.style.display = toggleApplies ? '' : 'none';
  DOM.poolToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.pool === (mode === 'sector' ? 'sector' : 'general')));

  if (mode === 'exam'){
    DOM.welcomeSub.textContent =
      'Annual certification exam — fixed question set for this year, feedback withheld until the end, minimum 80% required for a certificate token. Draws from the full general pool regardless of track.';
  } else if (mode === 'deepdive'){
    DOM.welcomeSub.textContent =
      '6-month deep-dive — a fixed, larger set for this half-year, with immediate Alba/Kai feedback per question. Draws from the full general pool regardless of track.';
  } else if (mode === 'onboarding'){
    DOM.welcomeSub.textContent =
      'General onboarding check-in — the same foundational set for every new hire, regardless of role. Immediate feedback. No pass/fail lock: Article 4 asks organisations to support AI literacy, not certify an individual score.';
  } else if (mode === 'sector'){
    DOM.welcomeSub.textContent =
      'Sector-specific tasting — scenario questions written for your industry, applying the same Regulation to real sector situations. Runs after the general track, not instead of it.';
  } else {
    DOM.welcomeSub.textContent =
      'A short, scenario-based AI Act check-in. Runs locally in your browser — your answers and name are not transmitted by this module.';
  }
}

function restartToWelcome(){
  showWelcomeScreen();
  DOM.inName.value = '';
}

// ---- Init: populate dropdowns from the question-registry, wire events ----
// Called once, at the very bottom of this file, after every section below
// has finished declaring its data and functions.
function init(){
  ROLES.forEach(r => {
    const o = document.createElement('option');
    o.value = r.v; o.textContent = r.l;
    DOM.inRole.appendChild(o);
  });
  if (urlRole && ROLES.some(r => r.v === urlRole)) DOM.inRole.value = urlRole;

  SECTORS.forEach(s => {
    const o = document.createElement('option');
    o.value = s.v; o.textContent = s.l;
    DOM.inSector.appendChild(o);
  });
  if (urlSector && SECTORS.some(s => s.v === urlSector)) DOM.inSector.value = urlSector;

  DOM.poolToggleBtns.forEach(btn => {
    btn.addEventListener('click', function(){
      mode = (this.dataset.pool === 'sector') ? 'sector' : 'pulse';
      updateWelcomeUI();
    });
  });
  updateWelcomeUI();

  DOM.btnStart.addEventListener('click', startSession);
  DOM.btnNext.addEventListener('click', handleNext);
  DOM.btnRestart.addEventListener('click', restartToWelcome);
  DOM.btnPrint.addEventListener('click', handlePrint);
}

/* ═══════════════════════════════════════════════════
   END: app-shell
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: question-registry — QUESTIONS, QUESTIONS_SECTOR, ROLES, SECTORS, WAVE_LINES
═══════════════════════════════════════════════════ */

// ---- General question pool ----
__QUESTIONS__

// ---- Sector question pool (separate, parallel industry pool) ----
__QUESTIONS_SECTOR__

// TRACKS replace the old topic-category filter. "General" is the shared
// foundation every employee draws from (the full pool). Each role track is a
// SEPARATE, harder, more specialised layer for that audience — not the
// general pool plus extras — matching the "shared foundation + role-specific
// advanced branch" model used in practice (SANS / Teachfloor).
__ROLES__

// SECTORS: the separate, parallel industry pool. Selected only in Sector
// mode (?type=sector), independent of the General/Track pulse pool above —
// "after the general pull comes sector-specific," not a combined filter.
// NOTE: sectors are scenario groupings, not classifications — Annex III
// classifies by use case/intended purpose, not industry label. Each sector
// pool deliberately includes non-high-risk "trap" scenarios alongside
// genuine Annex III/Article 5/Article 50 triggers.
__SECTORS__

// ---- Wave's post-session reaction lines ----
__WAVE_LINES__

/* ═══════════════════════════════════════════════════
   END: question-registry
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: legal-source-registry — LEGAL_SOURCES lookup
═══════════════════════════════════════════════════ */

__LEGAL_SOURCES__

/* ═══════════════════════════════════════════════════
   END: legal-source-registry
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: assessment-engine — pool selection, seeded shuffle, scoring, mode logic
═══════════════════════════════════════════════════ */

// ---- Session state (memory only — never persisted) ----
let userName = '';
let mode = 'pulse';           // 'pulse' | 'onboarding' | 'deepdive' | 'exam' | 'sector'
let roleFilter = 'all';
let sectorFilter = SECTORS[0].v;
let sessionQuestions = [];
let idx = 0;
let score = 0;
let answered = false;
let answers = [];             // {id, correct} — kept in memory only, for the token

// ---- URL params: ?role=... , ?sector=... , ?type=exam|onboarding|deepdive|sector ----
const params = new URLSearchParams(window.location.search);
const urlType = params.get('type');
if (['exam','onboarding','deepdive','sector'].includes(urlType)) mode = urlType;
const urlRole = params.get('role');
const urlSector = params.get('sector');

// ---- Fisher–Yates (true randomness — pulse mode) ----
function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Seeded shuffle (deterministic — exam mode, same set/order for everyone this quarter) ----
function seededShuffle(arr, seed){
  const a = arr.slice();
  let s = seed;
  function rnd(){ const x = Math.sin(s++) * 10000; return x - Math.floor(x); }
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function yearSeed(){ return new Date().getFullYear(); }                 // annual exam
function halfYearSeed(){                                                 // 6-month deep-dive
  const d = new Date();
  const half = d.getMonth() < 6 ? 1 : 2;
  return d.getFullYear() * 10 + half;
}
const ONBOARDING_SEED = 424242; // fixed — every new hire gets the identical general test, no rotation
const EXAM_SIZE = 30, DEEPDIVE_SIZE = 20, ONBOARDING_SIZE = 18, PULSE_SIZE = 5;

// ---- Build this session's question set for the selected mode/track/sector ----
function startSession(){
  userName = DOM.inName.value.trim() || 'Anonymous';
  roleFilter = DOM.inRole.value;
  sectorFilter = DOM.inSector.value;

  if (mode === 'exam'){
    sessionQuestions = seededShuffle(QUESTIONS, yearSeed()).slice(0, Math.min(EXAM_SIZE, QUESTIONS.length));
  } else if (mode === 'deepdive'){
    sessionQuestions = seededShuffle(QUESTIONS, halfYearSeed()).slice(0, Math.min(DEEPDIVE_SIZE, QUESTIONS.length));
  } else if (mode === 'onboarding'){
    const foundation = QUESTIONS.filter(q => q.role === 'all');
    sessionQuestions = seededShuffle(foundation, ONBOARDING_SEED).slice(0, Math.min(ONBOARDING_SIZE, foundation.length));
  } else if (mode === 'sector'){
    const pool = QUESTIONS_SECTOR.filter(q => q.sector === sectorFilter);
    sessionQuestions = shuffle(pool).slice(0, Math.min(PULSE_SIZE, pool.length));
  } else {
    let pool = roleFilter === 'all' ? QUESTIONS.slice() : QUESTIONS.filter(q => q.role === roleFilter);
    if (pool.length === 0) pool = QUESTIONS.slice();
    sessionQuestions = shuffle(pool).slice(0, Math.min(PULSE_SIZE, pool.length));
  }

  idx = 0; score = 0; answers = [];
  showQuizScreen();
  DOM.examNote.style.display = (mode === 'exam') ? 'block' : 'none';
  DOM.examNote.textContent = 'Exam mode — fixed question set for this year, feedback withheld until the end. Minimum 80% required to receive a certificate token.';
  renderQuestion();
}

function renderQuestion(){
  answered = false;
  const q = sessionQuestions[idx];
  DOM.progressFill.style.width = ((idx) / sessionQuestions.length * 100) + '%';
  DOM.qSource.textContent = q.source;
  DOM.qCount.textContent = 'Question ' + (idx + 1) + ' / ' + sessionQuestions.length;
  DOM.qText.textContent = q.question;

  DOM.qOptions.innerHTML = '';
  const shuffledOpts = shuffle(q.options);
  shuffledOpts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.textContent = opt.t;
    btn.addEventListener('click', function(){ selectOption(btn, opt, shuffledOpts, DOM.qOptions); });
    DOM.qOptions.appendChild(btn);
  });

  DOM.feedback.className = 'feedback';
}

function selectOption(btn, opt, allOpts, optWrap){
  if (answered) return;
  answered = true;
  const q = sessionQuestions[idx];
  if (opt.c) score++;
  answers.push({ id: q.id, correct: opt.c });

  Array.from(optWrap.children).forEach((el, i) => {
    el.disabled = true;
    if (allOpts[i].c) el.classList.add('correct');
    else if (el === btn) el.classList.add('wrong');
  });

  if (mode !== 'exam'){
    DOM.fbAlba.textContent = q.alba;
    DOM.fbKai.textContent = q.kai;
    DOM.feedback.className = 'feedback show';
  } else {
    // Exam mode: no Alba/Kai mid-test — straight to Next, feedback withheld until the certificate screen
    DOM.feedback.className = 'feedback show';
    DOM.fbAlba.textContent = '';
    DOM.fbKai.textContent = '';
  }
}

function handleNext(){
  idx++;
  if (idx >= sessionQuestions.length){
    showResult();
  } else {
    renderQuestion();
  }
}

/* ═══════════════════════════════════════════════════
   END: assessment-engine
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: receipt-engine — token generation, b64 encoding
═══════════════════════════════════════════════════ */

// ---- UTF-8-safe Base64 (so Croatian diacritics survive) ----
function b64(str){ return btoa(unescape(encodeURIComponent(str))); }

// ---- Self-reported completion receipt: name, score, date and focus area,
// nothing else. Decoded locally by EACE's admin tool, never transmitted. ----
function buildReceiptToken(name, scoreLabel, focus, sessionMode){
  const payload = [
    'EACE-TASTING',
    name,
    scoreLabel,
    focus,
    new Date().toISOString().slice(0,10),
    sessionMode
  ].join('|');
  return 'EACE-' + b64(payload).replace(/=+$/,'');
}

/* ═══════════════════════════════════════════════════
   END: receipt-engine
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: print-renderer — print CSS hooks (see <style> @media print), certificate rendering
═══════════════════════════════════════════════════ */

function showResult(){
  DOM.progressFill.style.width = '100%';
  showResultScreen();

  const pct = Math.round((score / sessionQuestions.length) * 100);
  DOM.resultScore.textContent = score + '/' + sessionQuestions.length;
  DOM.resultPct.textContent = pct + '%';

  const wavePool = pct === 100 ? WAVE_LINES.perfect : (pct >= 80 ? WAVE_LINES.good : WAVE_LINES.tryAgain);
  DOM.waveNoteTxt.textContent = wavePool[Math.floor(Math.random() * wavePool.length)];

  if (mode === 'exam' && pct < 80){
    DOM.resultTitle.textContent = 'Not yet certified';
    DOM.resultBody.innerHTML = '<div class="locked">Below the 80% certification threshold. Alba suggests reviewing the weekly tasting modules before the next attempt. No token is generated for this session.</div>';
    DOM.tokenSection.style.display = 'none';
    DOM.btnPrint.style.display = 'none';
    return;
  }
  DOM.btnPrint.style.display = '';

  DOM.resultTitle.textContent = (mode === 'exam') ? 'Certification complete' : 'Session complete';
  DOM.resultBody.innerHTML = '<p class="lede">' + (mode === 'exam'
    ? 'Formal record generated below. Copy the token to your HR/IT contact for the audit file.'
    : 'Nicely done. Copy the token below if your team tracks weekly completions.') + '</p>';

  const token = buildReceiptToken(userName, score + '/' + sessionQuestions.length, (mode === 'sector' ? sectorFilter : roleFilter), mode);
  DOM.tokenOut.textContent = token;
  DOM.tokenSection.style.display = 'block';
}

function handlePrint(){ window.print(); }

/* ═══════════════════════════════════════════════════
   END: print-renderer
═══════════════════════════════════════════════════ */

init();

})();
`;

  let newScript = HEADER;
  newScript = newScript.replace('__QUESTIONS__', questions.text);
  newScript = newScript.replace('__QUESTIONS_SECTOR__', questionsSector.text);
  newScript = newScript.replace('__ROLES__', roles.text);
  newScript = newScript.replace('__SECTORS__', sectors.text);
  newScript = newScript.replace('__WAVE_LINES__', waveLines.text);
  newScript = newScript.replace('__LEGAL_SOURCES__', legalSourcesFull);

  const newHtml = html.slice(0, scriptOpenIdx) + '\n' + newScript + html.slice(scriptCloseIdx);
  fs.writeFileSync(TARGET, newHtml);
  console.log('Wrote reorganized script to ' + TARGET);
}

main();
