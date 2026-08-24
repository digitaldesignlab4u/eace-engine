#!/usr/bin/env node
/**
 * Builds the Evidence Mode integration DEMO
 * (eace-compliance-tasting-menu-evidence/demo/) — a working proof that
 * Evidence Mode actually wires into a real assessment session, not just a
 * library exercised in isolation.
 *
 * This is a NEW build, same pattern as build-web-edition.js: it never
 * touches the Portable Edition (the reference architecture) or the
 * Enterprise/Web Edition. It takes a COPY of the Web Edition's
 * styles.css/questions.js/legal-sources.js/index.html verbatim, and adds
 * exactly THREE small, clearly-marked "EVIDENCE MODE HOOK" lines to a COPY
 * of app.js — everything else new lives in separate, additive files
 * (evidence-core.js, evidence-mode.js, evidence-integration.js). Those
 * three hook lines are the entire integration surface; see README.md for
 * the exact diff, so wiring Evidence Mode into either shipped edition for
 * real is a small, reviewable change.
 *
 * Usage: node scripts/build-evidence-demo.js
 */
const fs = require('fs');
const path = require('path');

const WEB_DIR = path.join(__dirname, '..', 'eace-compliance-tasting-menu-web');
const EVIDENCE_DIR = path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence');
const OUT_DIR = path.join(EVIDENCE_DIR, 'demo');

function assertReplace(text, oldFrag, newFrag, label) {
  if (!text.includes(oldFrag)) throw new Error('Hook target not found (' + label + '): ' + oldFrag.slice(0, 60));
  const out = text.replace(oldFrag, newFrag);
  if (out === text) throw new Error('Hook replacement had no effect (' + label + ')');
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ---- 1. Verbatim copies ----
  for (const f of ['styles.css', 'questions.js', 'legal-sources.js']) {
    fs.copyFileSync(path.join(WEB_DIR, f), path.join(OUT_DIR, f));
  }
  console.log('Copied styles.css, questions.js, legal-sources.js verbatim from the Web Edition');

  // Evidence-panel-only classes, appended (not touching any existing rule) —
  // deliberately class-based, never inline style="...", for the same
  // strict-CSP reason build-web-edition.js already established.
  const evidenceCss =
    '\n/* ═══════════════════════════════════════════════════\n' +
    '   Evidence Mode demo — evidence panel styling (additive only)\n' +
    '═══════════════════════════════════════════════════ */\n' +
    '.evidence-panel{border-left:2px solid var(--green);margin-top:1.25rem}\n' +
    '.evidence-eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--green);margin-bottom:0.6rem}\n' +
    '.evidence-eyebrow-dim{color:var(--muted)}\n' +
    '.evidence-meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.6rem;font-family:var(--mono);font-size:11.5px;margin:0.75rem 0}\n' +
    '.evidence-meta .meta-label{display:block;color:var(--muted);font-size:9.5px;text-transform:uppercase;letter-spacing:0.05em}\n' +
    '.evidence-upgrade{margin-top:1.25rem;padding-top:1rem;border-top:0.5px solid var(--line)}\n';
  fs.appendFileSync(path.join(OUT_DIR, 'styles.css'), evidenceCss);
  console.log('Appended evidence panel CSS classes to styles.css');

  // ---- 2. app.js + the three-line hook ----
  let appJs = fs.readFileSync(path.join(WEB_DIR, 'app.js'), 'utf8');

  appJs = assertReplace(
    appJs,
    "let answers = [];             // {id, correct} — kept in memory only, for the token",
    "let answers = [];             // {id, correct} — kept in memory only, for the token\n" +
    "let sessionStartedAt = null;  // EVIDENCE MODE HOOK (1/3) — see ../README.md",
    'session state hook'
  );

  appJs = assertReplace(
    appJs,
    'function startSession(){\n  userName = DOM.inName.value.trim() || \'Anonymous\';',
    'function startSession(){\n' +
    '  sessionStartedAt = new Date().toISOString(); // EVIDENCE MODE HOOK (2/3) — see ../README.md\n' +
    "  userName = DOM.inName.value.trim() || 'Anonymous';",
    'startSession hook'
  );

  const evidenceEventDispatch =
    "\n  // EVIDENCE MODE HOOK (3/3) — see ../README.md. Fires regardless of\n" +
    "  // pass/fail, unlike the receipt below (which the product intentionally\n" +
    "  // withholds for a failed exam) — Evidence Mode's job is to record what\n" +
    "  // was actually attempted, not just what was passed.\n" +
    "  document.dispatchEvent(new CustomEvent('eace:session-complete', { detail: {\n" +
    "    mode: mode,\n" +
    "    roleOrSector: (mode === 'sector' ? sectorFilter : roleFilter),\n" +
    "    poolVersion: POOL_VERSION,\n" +
    "    assessmentManifestId: currentManifestId,\n" +
    "    questionIds: sessionQuestions.map(function(q){ return q.id; }),\n" +
    "    answers: answers.slice(),\n" +
    "    score: score,\n" +
    "    total: sessionQuestions.length,\n" +
    "    startedAt: sessionStartedAt\n" +
    "  } }));\n";

  appJs = assertReplace(
    appJs,
    "    DOM.tokenSection.style.display = 'none';\n    DOM.btnPrint.style.display = 'none';\n    return;\n  }",
    "    DOM.tokenSection.style.display = 'none';\n    DOM.btnPrint.style.display = 'none';" +
    evidenceEventDispatch +
    "    return;\n  }",
    'showResult early-return (exam fail) hook'
  );

  appJs = assertReplace(
    appJs,
    "  DOM.tokenOut.textContent = token;\n  DOM.tokenSection.style.display = 'block';\n}",
    "  DOM.tokenOut.textContent = token;\n  DOM.tokenSection.style.display = 'block';" +
    evidenceEventDispatch +
    "}",
    'showResult end hook'
  );

  fs.writeFileSync(path.join(OUT_DIR, 'app.js'), appJs);
  console.log('Wrote app.js (Web Edition + 3 EVIDENCE MODE HOOK insertions)');

  // ---- 3. Evidence Mode files, verbatim from this directory ----
  for (const f of ['evidence-core.js', 'evidence-mode.js']) {
    fs.copyFileSync(path.join(EVIDENCE_DIR, f), path.join(OUT_DIR, f));
  }
  console.log('Copied evidence-core.js, evidence-mode.js');

  // ---- 4. index.html: add the opt-in checkbox + evidence panel + script tags ----
  let indexHtml = fs.readFileSync(path.join(WEB_DIR, 'index.html'), 'utf8');

  indexHtml = assertReplace(
    indexHtml,
    '<title>EACE.ai — Compliance Tasting Menu (Web Edition)</title>',
    '<title>EACE.ai — Compliance Tasting Menu (Evidence Mode demo)</title>',
    'title'
  );

  // Opt-in checkbox, right beside the existing "remember seen questions" one.
  indexHtml = assertReplace(
    indexHtml,
    '<p class="hint">Opt-in only. Stores question IDs alone — no name, no answers, no scores — so Pulse/Sector draws can favour questions you haven\'t had yet. <button type="button" class="link-btn hidden-init" id="btn-reset-progress">Reset this device\'s progress</button></p>',
    '<p class="hint">Opt-in only. Stores question IDs alone — no name, no answers, no scores — so Pulse/Sector draws can favour questions you haven\'t had yet. <button type="button" class="link-btn hidden-init" id="btn-reset-progress">Reset this device\'s progress</button></p>\n' +
    '        <label class="checkbox-row" for="in-evidence">\n' +
    '          <input type="checkbox" id="in-evidence">\n' +
    '          <span>Also generate an Evidence Mode record (stronger than the receipt below)</span>\n' +
    '        </label>\n' +
    '        <p class="hint">Adds a signed, hash-verifiable record of exactly which questions were asked and how each was answered (still no answer text). Off by default — this demo only builds the local, offline tier (Grade 1); see the evidence panel on the result screen for what that does and does not prove.</p>',
    'evidence opt-in checkbox'
  );

  // Evidence panel container, right after the existing receipt token-section.
  indexHtml = assertReplace(
    indexHtml,
    '<p class="hint">This is a self-reported completion receipt, not an auditable evidence record. Copy it and send it to HR/IT via your internal channel — it encodes name, score, date and focus area, nothing else, and is decoded locally by EACE\'s admin tool, never transmitted by this page. If you choose to copy, print or send this receipt, that subsequent handling happens outside this local module and is governed by your organisation\'s own processes.</p>\n      </div>',
    '<p class="hint">This is a self-reported completion receipt, not an auditable evidence record. Copy it and send it to HR/IT via your internal channel — it encodes name, score, date and focus area, nothing else, and is decoded locally by EACE\'s admin tool, never transmitted by this page. If you choose to copy, print or send this receipt, that subsequent handling happens outside this local module and is governed by your organisation\'s own processes.</p>\n      </div>\n      <div id="evidence-panel" class="hidden-init"></div>',
    'evidence panel container'
  );

  // Script tags, after app.js.
  indexHtml = assertReplace(
    indexHtml,
    '<script src="app.js"></script>',
    '<script src="app.js"></script>\n' +
    '<script src="evidence-core.js"></script>\n' +
    '<script src="evidence-mode.js"></script>\n' +
    '<script src="evidence-integration.js"></script>',
    'evidence script tags'
  );

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);
  console.log('Wrote index.html (Web Edition + evidence opt-in + evidence panel + script tags)');

  // ---- 5. evidence-integration.js is hand-authored, not templated here —
  // copy it verbatim from this directory so it's easy to read/diff on its own.
  fs.copyFileSync(path.join(EVIDENCE_DIR, 'evidence-integration.src.js'), path.join(OUT_DIR, 'evidence-integration.js'));
  console.log('Copied evidence-integration.js');
}

main();
