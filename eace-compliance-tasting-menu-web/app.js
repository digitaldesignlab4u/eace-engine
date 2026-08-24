/* ═══════════════════════════════════════════════════
   EACE.ai — Compliance Tasting Menu — Enterprise/Web Edition — engine
   100% client-side. No network calls. No login. No storage of the
   person's name — it lives in a JS variable only, for this session,
   and is never written to localStorage, sessionStorage, cookies, or
   sent anywhere. The one opt-in exception: if the person checks
   "Remember which questions I've seen," a bare list of question IDs
   (nothing else) is written to localStorage — see the seen-question-ID
   helpers in the assessment-engine section below.

   This is the Enterprise/Web Edition build: markup, styles and question/
   legal-source data live in sibling files (index.html, styles.css,
   questions.js, legal-sources.js) instead of being inlined into one
   HTML file. This file — app.js — is everything else: app-shell,
   assessment-engine (incl. ASSESSMENT_MANIFESTS / resolveManifest()),
   receipt-engine, and receipt-renderer. It must load AFTER questions.js
   and legal-sources.js — see the load-order note at the top of each of
   those files.

   For the single-file, offline/downloadable build of this same product,
   see the Portable Edition: eace-compliance-tasting-menu.html. Do not
   let the two diverge — re-run scripts/build-web-edition.js against the
   Portable Edition any time it changes.
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
  modeGrid: document.getElementById('mode-grid'),
  modeCards: document.querySelectorAll('#mode-grid .mode-card'),
  scopeChips: document.getElementById('scope-chips'),
  scopeChipBtns: document.querySelectorAll('#scope-chips .chip'),
  stepScope: document.getElementById('step-scope'),
  stepName: document.getElementById('step-name'),
  modeNote: document.getElementById('mode-note'),
  welcomeSub: document.getElementById('welcome-sub'),
  inName: document.getElementById('in-name'),
  inRemember: document.getElementById('in-remember'),
  btnResetProgress: document.getElementById('btn-reset-progress'),
  btnStart: document.getElementById('btn-start'),
  screenWelcome: document.getElementById('screen-welcome'),
  screenQuiz: document.getElementById('screen-quiz'),
  btnBackQuiz: document.getElementById('btn-back-quiz'),
  screenResult: document.getElementById('screen-result'),
  examNote: document.getElementById('exam-note'),
  progressFill: document.getElementById('progress-fill'),
  progressTrack: document.getElementById('progress-track'),
  qSource: document.getElementById('q-source'),
  qCount: document.getElementById('q-count'),
  qText: document.getElementById('q-text'),
  qOptions: document.getElementById('q-options'),
  railSession: document.getElementById('rail-session'),
  railScopeBlock: document.getElementById('rail-scope-block'),
  railScopeLabel: document.getElementById('rail-scope-label'),
  railScope: document.getElementById('rail-scope'),
  railArea: document.getElementById('rail-area'),
  railDiffBlock: document.getElementById('rail-diff-block'),
  railDiff: document.getElementById('rail-diff'),
  feedback: document.getElementById('feedback'),
  fbAlba: document.getElementById('fb-alba'),
  fbKai: document.getElementById('fb-kai'),
  btnNext: document.getElementById('btn-next'),
  feedbackExam: document.getElementById('feedback-exam'),
  btnNextExam: document.getElementById('btn-next-exam'),
  resultScore: document.getElementById('result-score'),
  resultPct: document.getElementById('result-pct'),
  snapLabel: document.getElementById('snap-label'),
  snapDomains: document.getElementById('snap-domains'),
  snapCallouts: document.getElementById('snap-callouts'),
  waveNoteTxt: document.getElementById('wave-note-txt'),
  resultBody: document.getElementById('result-body'),
  tokenSection: document.getElementById('token-section'),
  resultTitle: document.getElementById('result-title'),
  tokenOut: document.getElementById('token-out'),
  btnRestart: document.getElementById('btn-restart'),
  btnPrint: document.getElementById('btn-print')
};

// ---- Cadence catalogue (launch cards + rail label) ----
// 'sector' is not a card of its own: it is the Sector scope of a Daily Pulse,
// which is how the engine has always modelled it (?type=sector).
const MODE_META = {
  pulse:      { label:'Daily Pulse',        scoped:true  },
  sector:     { label:'Sector Tasting',     scoped:true  },
  onboarding: { label:'Onboarding',         scoped:false },
  deepdive:   { label:'Deep Dive',          scoped:false },
  exam:       { label:'Annual Assessment',  scoped:false }
};
const SCOPE_LABELS = { all:'General', manager:'Manager', compliance:'Compliance & Legal', technical:'Technical', sector:'Sector' };

// Which card is lit on the launch screen, and which scope chip is picked.
let launchCard = null;      // 'pulse' | 'onboarding' | 'deepdive' | 'exam'
let scopePick  = 'all';     // 'all' | 'manager' | 'compliance' | 'technical' | 'sector'

// ---- Screen show/hide ----
function showWelcomeScreen(){
  DOM.screenWelcome.style.display = 'block';
  DOM.screenQuiz.style.display = 'none';
  DOM.screenResult.style.display = 'none';
  const h = document.getElementById('welcome-title');
  if (h) h.focus();
}
function showQuizScreen(){
  DOM.screenWelcome.style.display = 'none';
  DOM.screenQuiz.style.display = 'block';
}
function showResultScreen(){
  DOM.screenQuiz.style.display = 'none';
  DOM.screenResult.style.display = 'block';
  if (DOM.resultTitle) DOM.resultTitle.focus();
}

// ---- Welcome-screen state machine ----
// Step 1 picks the cadence; steps 2/3 (scope + name) only appear once a
// cadence is lit. Onboarding / deep-dive / annual are general-pool cadences by
// design, so step 2 explains that instead of offering a track or sector.
function updateWelcomeUI(){
  DOM.modeCards.forEach(c => {
    const active = c.dataset.mode === launchCard;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const chosen = !!launchCard;
  DOM.stepScope.classList.toggle('is-hidden', !chosen);
  DOM.stepName.classList.toggle('is-hidden', !chosen);
  DOM.btnStart.disabled = !chosen;
  if (!chosen){
    DOM.welcomeSub.textContent =
      'A scenario-based AI Act check-in. Pick a cadence to begin — everything runs locally in your browser, and neither your answers nor your name are transmitted by this module.';
    return;
  }

  mode = (launchCard === 'pulse' && scopePick === 'sector') ? 'sector' : launchCard;
  const scoped = MODE_META[mode].scoped;

  DOM.scopeChips.classList.toggle('is-hidden', !scoped);
  DOM.modeNote.classList.toggle('is-hidden', scoped);
  DOM.sectorField.classList.toggle('is-hidden', mode !== 'sector');
  DOM.scopeChipBtns.forEach(b => {
    const active = b.dataset.scope === scopePick;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  if (scopePick !== 'sector') DOM.inRole.value = scopePick;

  if (mode === 'exam'){
    DOM.modeNote.textContent = 'Drawn from the full general pool, regardless of track — the annual assessment is deliberately not track-specific.';
    DOM.welcomeSub.textContent =
      'Annual Assessment — fixed question set for this year, feedback withheld until the end. 80% is EACE\'s internal assessment benchmark, not a regulatory threshold.';
  } else if (mode === 'deepdive'){
    DOM.modeNote.textContent = 'Drawn from the full general pool, regardless of track — one fixed set per half-year, identical for everyone.';
    DOM.welcomeSub.textContent =
      '6-month deep-dive — a fixed, larger set for this half-year, with immediate Alba/Kai feedback per question.';
  } else if (mode === 'onboarding'){
    DOM.modeNote.textContent = 'The same foundational set for every new hire, regardless of role. No pass/fail lock: Article 4 asks organisations to support AI literacy, not certify an individual score.';
    DOM.welcomeSub.textContent =
      'General onboarding check-in — the shared foundation, with immediate feedback after every answer.';
  } else if (mode === 'sector'){
    DOM.welcomeSub.textContent =
      'Sector-specific tasting — scenario questions written for your industry, applying the same Regulation to real sector situations. Designed as a companion to the general foundation, not a replacement for it.';
  } else {
    DOM.welcomeSub.textContent =
      'Daily pulse — five scenarios drawn from the live pool. General is the shared foundation; the three role tracks are a separate, harder layer.';
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

  DOM.modeCards.forEach(btn => {
    btn.addEventListener('click', function(){
      launchCard = this.dataset.mode;
      if (launchCard !== 'pulse' && scopePick === 'sector') scopePick = 'all';
      updateWelcomeUI();
    });
  });
  DOM.scopeChipBtns.forEach(btn => {
    btn.addEventListener('click', function(){
      scopePick = this.dataset.scope;
      updateWelcomeUI();
    });
  });

  // ?type= / ?role= still work: they simply pre-light the launch screen.
  if (['exam','onboarding','deepdive'].includes(urlType)) launchCard = urlType;
  else if (urlType === 'sector'){ launchCard = 'pulse'; scopePick = 'sector'; }
  else if (urlType === 'pulse') launchCard = 'pulse';
  if (urlRole && SCOPE_LABELS[urlRole]){ launchCard = launchCard || 'pulse'; scopePick = urlRole; }
  updateWelcomeUI();

  DOM.btnStart.addEventListener('click', startSession);
  DOM.btnNext.addEventListener('click', handleNext);
  DOM.btnNextExam.addEventListener('click', handleNext);
  DOM.btnBackQuiz.addEventListener('click', function(){
    const hasProgress = answers.length > 0;
    if (hasProgress && !confirm('Leave this session? Your progress on this attempt will not be saved.')) return;
    idx = 0; score = 0; answers = [];
    showWelcomeScreen();
  });
  DOM.btnRestart.addEventListener('click', restartToWelcome);
  if (DOM.btnResetProgress){
    DOM.btnResetProgress.addEventListener('click', function(){
      clearSeenIds();
      refreshResetProgressButton();
    });
    refreshResetProgressButton();
  }
  DOM.btnPrint.addEventListener('click', handlePrint);
}

/* ═══════════════════════════════════════════════════
   END: app-shell
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: assessment-engine — pool selection, seeded shuffle, scoring, mode logic
═══════════════════════════════════════════════════ */

// ---- Session state — name, answers and score are ALWAYS memory-only and
// never persisted, opt-in or not. The one narrow exception is the "Remember
// which questions I've seen" checkbox below, which — only if the person
// checks it — stores a bare list of question IDs (nothing else) so future
// Pulse/Sector draws can favour unseen questions. That is the sole use of
// localStorage anywhere in this file. ----
let userName = '';
let mode = 'pulse';           // 'pulse' | 'onboarding' | 'deepdive' | 'exam' | 'sector'
let roleFilter = 'all';
let sectorFilter = SECTORS[0].v;
let sessionQuestions = [];
let currentManifestId = null; // set for exam/deepdive/onboarding, null for pulse/sector
let idx = 0;
let score = 0;
let answered = false;
let answers = [];             // {id, correct} — kept in memory only, for the token
let rememberProgress = false; // this session's opt-in choice, re-asked every visit — not itself persisted

// ---- Opt-in seen-question-ID tracking (localStorage, question IDs only) ----
const SEEN_IDS_KEY = 'eace-tasting-seen-ids';
function getSeenIds(){
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return []; // storage disabled/unavailable/corrupt — fail open to "no history", never throw
  }
}
function saveSeenIds(ids){
  try {
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    // storage disabled/full — silently no-op; this feature is a nice-to-have, never load-bearing
  }
}
function clearSeenIds(){
  try { localStorage.removeItem(SEEN_IDS_KEY); } catch (e) { /* no-op */ }
}
function refreshResetProgressButton(){
  if (!DOM.btnResetProgress) return;
  const has = getSeenIds().length > 0;
  DOM.btnResetProgress.style.display = has ? 'inline' : 'none';
}

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

// ---- Assessment Manifests — frozen question-ID lists, not live re-shuffles ----
// Reproducibility must not depend on the QUESTIONS array's current order or
// length: if the pool is edited or reordered mid-year, a seed-based reshuffle
// silently produces a different set for the same seed. A manifest is
// generated once (by the same seeded-shuffle algorithm, run at authoring
// time) and frozen as an explicit ID list, so "what did the 2026 exam
// actually contain" stays answerable regardless of later pool changes.
// Regenerate the relevant manifest deliberately when the pool changes enough
// to warrant a new version — do not let it silently drift.
const ASSESSMENT_MANIFESTS = {
  exam: {
    id: 'EXAM-2026-v1',
    generated_from: 'seededShuffle(QUESTIONS, 2026)',
    generated_at: '2026-08-23',
    question_ids: ["q108","q136","q149","q145","q46","q152","q131","q61","q127","q159","q134","q38","q97","q137","q25","q91","q161","q19","q116","q118","q81","q104","q96","q88","q101","q37","q48","q132","q105","q140"]
  },
  deepdive: {
    id: 'DEEPDIVE-2026-H2-v1',
    generated_from: 'seededShuffle(QUESTIONS, 20262)',
    generated_at: '2026-08-23',
    question_ids: ["q71","q2","q92","q134","q65","q130","q4","q102","q147","q90","q10","q53","q50","q128","q14","q131","q135","q8","q59","q88"]
  },
  onboarding: {
    id: 'ONBOARDING-2026-08-v1',
    generated_from: "seededShuffle(QUESTIONS.filter(role==='all'), 424242)",
    generated_at: '2026-08-23',
    question_ids: ["q131","q4","q143","q86","q3","q55","q151","q93","q56","q21","q23","q24","q57","q20","q64","q2","q36","q15"]
  }
};
// Resolve a manifest's frozen ID list against the live QUESTIONS array,
// preserving manifest order. If a question was since removed from the pool,
// it's dropped with a console warning rather than breaking the session.
function resolveManifest(manifestKey){
  const manifest = ASSESSMENT_MANIFESTS[manifestKey];
  const byId = new Map(QUESTIONS.map(q => [q.id, q]));
  const resolved = [];
  manifest.question_ids.forEach(id => {
    const q = byId.get(id);
    if (q) resolved.push(q);
    else console.warn('Assessment manifest ' + manifest.id + ': question ' + id + ' no longer exists in QUESTIONS — dropped from this session.');
  });
  return { manifestId: manifest.id, questions: resolved };
}

// ---- Seeded shuffle (deterministic — retained for Pulse's ad-hoc draws are
// NOT seeded, this is only kept as the documented generation method behind
// the frozen manifests above; it is not called live for exam/deepdive/onboarding) ----
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
const ONBOARDING_SEED = 424242; // documented generation seed for ONBOARDING-2026-08-v1 above
const EXAM_SIZE = 30, DEEPDIVE_SIZE = 20, ONBOARDING_SIZE = 18, PULSE_SIZE = 5;

// ---- Build this session's question set for the selected mode/track/sector ----
function startSession(){
  userName = DOM.inName.value.trim() || 'Anonymous';
  roleFilter = DOM.inRole.value;
  sectorFilter = DOM.inSector.value;
  rememberProgress = !!(DOM.inRemember && DOM.inRemember.checked);
  const seenIds = rememberProgress ? getSeenIds() : [];

  // Prefer questions not already in the seen-IDs list; if that would leave
  // too few to fill the draw, fall back to the full pool rather than ever
  // getting stuck or silently repeating a smaller and smaller set forever.
  function drawFavouringUnseen(pool, size){
    if (rememberProgress && seenIds.length){
      const unseen = pool.filter(q => !seenIds.includes(q.id));
      if (unseen.length >= size) return shuffle(unseen).slice(0, size);
    }
    return shuffle(pool).slice(0, Math.min(size, pool.length));
  }

  if (mode === 'exam'){
    const r = resolveManifest('exam');
    sessionQuestions = r.questions; currentManifestId = r.manifestId;
  } else if (mode === 'deepdive'){
    const r = resolveManifest('deepdive');
    sessionQuestions = r.questions; currentManifestId = r.manifestId;
  } else if (mode === 'onboarding'){
    const r = resolveManifest('onboarding');
    sessionQuestions = r.questions; currentManifestId = r.manifestId;
  } else if (mode === 'sector'){
    const pool = QUESTIONS_SECTOR.filter(q => q.sector === sectorFilter);
    sessionQuestions = drawFavouringUnseen(pool, PULSE_SIZE);
    currentManifestId = null;
  } else {
    let pool = roleFilter === 'all' ? QUESTIONS.slice() : QUESTIONS.filter(q => q.role === roleFilter);
    if (pool.length === 0) pool = QUESTIONS.slice();
    sessionQuestions = drawFavouringUnseen(pool, PULSE_SIZE);
    currentManifestId = null;
  }

  idx = 0; score = 0; answers = [];
  showQuizScreen();
  DOM.examNote.style.display = (mode === 'exam') ? 'block' : 'none';
  DOM.examNote.textContent = 'Exam mode — fixed question set for this year, feedback withheld until the end. 80% is EACE\'s internal assessment benchmark, not a regulatory threshold.';
  renderQuestion();
}

// ---- Legal-area mapping: legal_source_id -> short domain label ----
// Used by the question-screen rail and by the result-screen breakdown, so a
// session's questions roll up into the handful of AI Act areas they touch.
// Order matters: art51-56 (GPAI) and art50 (transparency) are matched before
// the Article 5 prohibitions, and art4 / art4a before Articles 40-49.
const LEGAL_AREAS = [
  [/^art5[1-6]/,                                          'GPAI obligations'],
  [/^art50/,                                              'Transparency'],
  [/^art13/,                                              'Transparency'],
  [/^art5(_|$)/,                                          'Prohibited practices'],
  [/^annex3|^art6/,                                       'Classification'],
  [/^art14|^art26|^art27/,                                'Human oversight'],
  [/^art4a$/,                                             'Data & risk governance'],
  [/^art9$|^art10|^art15/,                                'Data & risk governance'],
  [/^art11|^art12|^art17|^art18|^art19|^art20|^art21|^art72|^art73/, 'Records & incidents'],
  [/^art4$/,                                              'AI literacy'],
  [/^art16|^art2[2-58]|^art4[0-9]|^art57|^art60|^art62/,  'Conformity & value chain'],
  [/^art2(_|$)|^art3|^whole_act_method/,                   'Scope & definitions'],
  [/^use_case_classification/,                            'Classification'],
  [/^reg_2026_1744/,                                      '2026 Omnibus amendments'],
  [/^art9[59]/,                                           'Enforcement']
];
function legalArea(q){
  const id = (q && q.legal_source_id) || '';
  for (let i = 0; i < LEGAL_AREAS.length; i++){
    if (LEGAL_AREAS[i][0].test(id)) return LEGAL_AREAS[i][1];
  }
  const s = (q && q.source) || '';
  if (/Annex\s*III/i.test(s)) return 'Classification';
  if (/Article\s*5\b/.test(s)) return 'Prohibited practices';
  if (/Article\s*50/.test(s)) return 'Transparency';
  return 'General provisions';
}

// Difficulty is only stated where the data actually supports it: the general
// pool tags role:'all' as the shared foundation and the three role tracks as
// the harder layer. Sector questions carry no such tag, so the block is hidden.
function difficultyOf(q){
  if (!q || !q.role) return null;
  return q.role === 'all' ? 'Foundation' : 'Advanced layer';
}

function renderQuestion(){
  answered = false;
  const q = sessionQuestions[idx];
  DOM.progressFill.style.width = ((idx) / sessionQuestions.length * 100) + '%';
  DOM.progressTrack.setAttribute('aria-valuenow', Math.round((idx) / sessionQuestions.length * 100));
  DOM.progressTrack.setAttribute('aria-valuetext', (idx + 1) + ' of ' + sessionQuestions.length);
  DOM.qSource.textContent = q.source;
  DOM.qCount.textContent = (idx + 1) + ' / ' + sessionQuestions.length;
  DOM.qText.textContent = q.question;
  DOM.qText.focus();

  // ---- intelligence rail (sidebar ≥1024px, metadata strip below that) ----
  DOM.railSession.textContent = MODE_META[mode].label;
  if (mode === 'sector'){
    DOM.railScopeLabel.textContent = 'Sector';
    const s = SECTORS.find(x => x.v === sectorFilter);
    DOM.railScope.textContent = s ? s.l : sectorFilter;
    DOM.railScopeBlock.classList.remove('is-hidden');
  } else if (mode === 'pulse'){
    DOM.railScopeLabel.textContent = 'Track';
    const r = ROLES.find(x => x.v === roleFilter);
    DOM.railScope.textContent = r ? r.l : roleFilter;
    DOM.railScopeBlock.classList.remove('is-hidden');
  } else {
    DOM.railScopeLabel.textContent = 'Pool';
    DOM.railScope.textContent = 'General — all employees';
    DOM.railScopeBlock.classList.remove('is-hidden');
  }
  DOM.railArea.textContent = legalArea(q);
  const diff = difficultyOf(q);
  DOM.railDiff.textContent = diff || '';
  DOM.railDiffBlock.classList.toggle('is-hidden', !diff);

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
  DOM.feedbackExam.className = 'feedback exam-plain';
}

function selectOption(btn, opt, allOpts, optWrap){
  if (answered) return;
  answered = true;
  const q = sessionQuestions[idx];
  if (opt.c) score++;
  answers.push({ id: q.id, correct: opt.c });

  Array.from(optWrap.children).forEach((el, i) => {
    el.disabled = true;
    if (mode !== 'exam'){
      // Pulse/Onboarding/Deep-Dive: reveal immediately, this is a learning moment.
      if (allOpts[i].c) el.classList.add('correct');
      else if (el === btn) el.classList.add('wrong');
    } else {
      // Exam mode: mark the selection so it's visible which one was picked,
      // but never reveal which one was correct — that stays withheld until
      // the completion-summary screen, matching the exam-note copy's own promise.
      if (el === btn) el.classList.add('picked');
    }
  });

  if (mode !== 'exam'){
    DOM.fbAlba.textContent = q.alba;
    DOM.fbKai.textContent = q.kai;
    DOM.feedback.className = 'feedback show';
    DOM.feedbackExam.className = 'feedback exam-plain';
  } else {
    // Exam mode: a plain, separate footer — never the Alba/Kai avatars with
    // empty text, which is what rendered here before this fix.
    DOM.feedback.className = 'feedback';
    DOM.feedbackExam.className = 'feedback exam-plain show';
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

// ---- UTF-8-safe Base64 via TextEncoder (unescape() is legacy/deprecated —
// this survives Croatian diacritics without relying on it) ----
function b64(str){
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

const RECEIPT_VERSION = 2;             // bump when the payload shape below changes
const POOL_VERSION = '2026-08';        // shared across all questions in this pool — see question_version/pool_version per item

// ---- Self-reported completion receipt: version, name, score, focus, date,
// mode, pool version and the assessment manifest this session drew from
// (null for ad-hoc Pulse/Sector draws). Nothing else. Decoded locally by
// EACE's admin tool, never transmitted. A receipt, not an evidence record —
// see the note on the result screen. ----
function buildReceiptToken(name, scoreLabel, focus, sessionMode){
  const payload = [
    'EACE-TASTING',
    'v' + RECEIPT_VERSION,
    name,
    scoreLabel,
    focus,
    new Date().toISOString().slice(0,10),
    sessionMode,
    POOL_VERSION,
    currentManifestId || 'ad-hoc'
  ].join('|');
  return 'EACE-' + b64(payload).replace(/=+$/,'');
}

/* ═══════════════════════════════════════════════════
   END: receipt-engine
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION: receipt-renderer — print CSS hooks (see <style> @media print), completion-summary rendering
═══════════════════════════════════════════════════ */

// ---- Competence snapshot helpers ----
// Labels are sample-size aware: a 5-question Pulse session is a snapshot of
// today, not a competence claim, so it gets lighter, session-scoped language.
// Only larger, fixed-set sessions (Onboarding/Deep-Dive/Annual) earn the
// stronger "working knowledge" framing, and even then only at genuine sample
// sizes — this deliberately does not scale the same label down from a
// five-question draw.
function qualitativeLabel(pct, n){
  const smallSample = n <= 5;
  if (smallSample){
    if (pct === 100) return 'Excellent session';
    if (pct >= 60)   return 'Good session';
    return 'Rough session — no single reading from five questions';
  }
  if (pct === 100) return 'Full command of this set';
  if (pct >= 90)  return 'Strong working knowledge';
  if (pct >= 80)  return 'Solid working knowledge';
  if (pct >= 60)  return 'Developing understanding';
  if (pct >= 40)  return 'Partial understanding';
  return 'Foundation still to build';
}

// Roll the session's answers up by legal area, so the score reads as a map of
// what was actually tested rather than one undifferentiated number.
function domainBreakdown(){
  const map = new Map();
  answers.forEach(a => {
    const q = sessionQuestions.find(x => x.id === a.id);
    if (!q) return;
    const key = legalArea(q);
    const e = map.get(key) || { n:0, c:0 };
    e.n++; if (a.correct) e.c++;
    map.set(key, e);
  });
  return Array.from(map, function(entry){
    return { label: entry[0], n: entry[1].n, c: entry[1].c, pct: Math.round(entry[1].c / entry[1].n * 100) };
  }).sort((a,b) => (b.pct - a.pct) || (b.n - a.n));
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderSnapshot(){
  const rows = domainBreakdown();
  DOM.snapDomains.innerHTML = rows.length
    ? '<div class="domain-list"><div class="domain-head">Legal areas touched in this session</div>' +
      rows.map(function(r){
        const small = r.n < 3;
        return '<div class="domain-row">' +
          '<div class="d-top"><span>' + esc(r.label) + (small ? ' <span class="d-small">· limited sample</span>' : '') + '</span>' +
          '<span class="d-pct">' + r.c + '/' + r.n + ' · ' + r.pct + '%</span></div>' +
          '<div class="d-track"><div class="d-fill' + (r.pct === 100 ? ' full' : '') + '" data-pct="' + r.pct + '"></div></div>' +
        '</div>';
      }).join('') + '</div>'
    : '';

  // Widths set via the CSSOM, not an innerHTML style="..." attribute — see
  // the load-order/CSP note above this function.
  DOM.snapDomains.querySelectorAll('.d-fill[data-pct]').forEach(function(el){
    el.style.width = el.dataset.pct + '%';
  });

  // Prefer domains with n>=3 for the strongest/review-next callouts — a
  // single question shouldn't be presented as a settled "strongest area."
  // Fall back to the small-sample rows only if nothing bigger exists, and
  // say so explicitly when that happens.
  const solid = rows.filter(r => r.n >= 3);
  const best = solid[0] || rows[0];
  const weakest = solid.length ? solid[solid.length - 1] : rows[rows.length - 1];
  const bestIsLimited = best && best.n < 3;
  const parts = [];
  if (best && best.pct > 0){
    parts.push('<div class="callout strong"><div class="c-label">Your strongest area' + (bestIsLimited ? ' (limited sample)' : '') + '</div>' +
      '<div class="c-val">' + esc(best.label) + ' — ' + best.c + ' of ' + best.n + '</div></div>');
  }
  if (weakest && weakest !== best && weakest.pct < 100){
    const weakestIsLimited = weakest.n < 3;
    parts.push('<div class="callout next"><div class="c-label">Review next' + (weakestIsLimited ? ' (limited sample)' : '') + '</div>' +
      '<div class="c-val">' + esc(weakest.label) + ' — ' + weakest.c + ' of ' + weakest.n + '</div></div>');
  } else if (best && best.pct < 100 && rows.length === 1){
    parts.push('<div class="callout next"><div class="c-label">Review next</div>' +
      '<div class="c-val">' + esc(best.label) + ' — the misses in this session sit here</div></div>');
  }
  DOM.snapCallouts.innerHTML = parts.length ? '<div class="callouts">' + parts.join('') + '</div>' : '';
}

function showResult(){
  DOM.progressFill.style.width = '100%';
  DOM.progressTrack.setAttribute('aria-valuenow', 100);
  DOM.progressTrack.setAttribute('aria-valuetext', 'Complete');
  showResultScreen();

  if (rememberProgress){
    const existing = getSeenIds();
    const merged = existing.concat(sessionQuestions.map(q => q.id).filter(id => !existing.includes(id)));
    saveSeenIds(merged);
    refreshResetProgressButton();
  }

  const pct = Math.round((score / sessionQuestions.length) * 100);
  DOM.resultScore.textContent = score + ' / ' + sessionQuestions.length;
  DOM.resultPct.textContent = pct + '%';
  DOM.snapLabel.textContent = qualitativeLabel(pct, sessionQuestions.length);
  renderSnapshot();

  const wavePool = pct === 100 ? WAVE_LINES.perfect : (pct >= 80 ? WAVE_LINES.good : WAVE_LINES.tryAgain);
  DOM.waveNoteTxt.textContent = wavePool[Math.floor(Math.random() * wavePool.length)];

  if (mode === 'exam' && pct < 80){
    DOM.resultTitle.textContent = 'Threshold not reached';
    DOM.resultBody.innerHTML = '<div class="locked">Below EACE\'s 80% internal assessment benchmark. Alba suggests reviewing the weekly tasting modules before the next attempt. No completion receipt is generated for this session.</div>';
    DOM.tokenSection.style.display = 'none';
    DOM.btnPrint.style.display = 'none';
    return;
  }
  DOM.btnPrint.style.display = '';

  DOM.resultTitle.textContent = (mode === 'exam') ? 'Assessment complete' : 'Session complete';
  DOM.resultBody.innerHTML = '<p class="lede">' + (mode === 'exam'
    ? 'Completion receipt generated below. Copy it to your HR/IT contact for your organisation\'s internal records.'
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
