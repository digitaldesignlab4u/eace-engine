#!/usr/bin/env node
/**
 * Builds the "Enterprise/Web Edition" of the EACE Compliance Tasting Menu
 * by splitting the single-file "Portable Edition"
 * (eace-compliance-tasting-menu.html) into:
 *   eace-compliance-tasting-menu-web/index.html      — markup only
 *   eace-compliance-tasting-menu-web/styles.css       — the <style> block, verbatim
 *   eace-compliance-tasting-menu-web/questions.js     — QUESTIONS, QUESTIONS_SECTOR,
 *                                                        ROLES, SECTORS, WAVE_LINES
 *                                                        (the full question-registry
 *                                                        section), verbatim
 *   eace-compliance-tasting-menu-web/legal-sources.js — LEGAL_SOURCES, POOL_METHODOLOGY
 *                                                        (the full legal-source-registry
 *                                                        section), verbatim
 *   eace-compliance-tasting-menu-web/app.js           — app-shell, assessment-engine
 *                                                        (incl. ASSESSMENT_MANIFESTS /
 *                                                        resolveManifest()), receipt-engine,
 *                                                        receipt-renderer
 *
 * The Portable Edition source file is read-only input here — this script
 * never writes to it. Data/CSS blocks are extracted byte-for-byte (verified
 * against the source afterward); only the small top-of-file doc comments in
 * app.js/questions.js/legal-sources.js are newly authored, to describe the
 * multi-file architecture instead of the single-file one.
 *
 * Usage: node scripts/build-web-edition.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'eace-compliance-tasting-menu.html');
const OUT_DIR = path.join(__dirname, '..', 'eace-compliance-tasting-menu-web');

const STRICT_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';";

function extractBetween(text, startMarker, endMarker) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find start marker: ' + startMarker);
  const endIdx = text.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error('Could not find end marker: ' + endMarker);
  return text.slice(startIdx, endIdx + endMarker.length);
}

function main() {
  const html = fs.readFileSync(SOURCE, 'utf8');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ---- 1. Extract <style> verbatim ----
  const styleOpen = '<style>';
  const styleClose = '</style>';
  const styleStart = html.indexOf(styleOpen) + styleOpen.length;
  const styleEnd = html.indexOf(styleClose);
  const cssBody = html.slice(styleStart, styleEnd);

  const stylesCss =
    '/* ═══════════════════════════════════════════════════\n' +
    '   EACE.ai — Compliance Tasting Menu — Enterprise/Web Edition\n' +
    '   Extracted verbatim from the single <style> block in the Portable\n' +
    '   Edition (eace-compliance-tasting-menu.html) — every rule, custom\n' +
    '   property, and the embedded @font-face declarations for Instrument\n' +
    '   Sans and DM Mono, unchanged. Do not hand-edit divergently from the\n' +
    '   Portable Edition; re-run scripts/build-web-edition.js instead.\n' +
    '═══════════════════════════════════════════════════ */\n' +
    cssBody;
  fs.writeFileSync(path.join(OUT_DIR, 'styles.css'), stylesCss);
  console.log('Wrote styles.css (' + cssBody.length + ' bytes of CSS)');

  // ---- 2. Extract <script> body, then split into three JS files ----
  const scriptOpen = '<script>';
  const scriptClose = '</script>';
  const scriptStart = html.indexOf(scriptOpen) + scriptOpen.length;
  const scriptEnd = html.indexOf(scriptClose);
  const scriptBody = html.slice(scriptStart, scriptEnd);

  const questionRegistryBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: question-registry',
    'END: question-registry\n═══════════════════════════════════════════════════ */'
  );
  const legalSourceRegistryBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: legal-source-registry',
    'END: legal-source-registry\n═══════════════════════════════════════════════════ */'
  );
  const appShellBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: app-shell',
    'END: app-shell\n═══════════════════════════════════════════════════ */'
  );
  const assessmentEngineBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: assessment-engine',
    'END: assessment-engine\n═══════════════════════════════════════════════════ */'
  );
  const receiptEngineBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: receipt-engine',
    'END: receipt-engine\n═══════════════════════════════════════════════════ */'
  );
  const receiptRendererBlock = extractBetween(
    scriptBody,
    '/* ═══════════════════════════════════════════════════\n   SECTION: receipt-renderer',
    // Source file's own closing banner says "END: print-renderer" (a legacy
    // name from before this section was renamed receipt-renderer) — matched
    // verbatim since we're extracting, not editing, the Portable Edition.
    'END: print-renderer\n═══════════════════════════════════════════════════ */'
  );

  // ---- 2a. questions.js ----
  const questionsJs =
    '/* ═══════════════════════════════════════════════════\n' +
    '   EACE.ai — Compliance Tasting Menu — Enterprise/Web Edition\n' +
    '   question-registry data file.\n\n' +
    '   Extracted verbatim from the question-registry section of the\n' +
    '   Portable Edition (eace-compliance-tasting-menu.html) — 355 questions\n' +
    '   unchanged (161 general in QUESTIONS + 194 sector in QUESTIONS_SECTOR),\n' +
    '   plus ROLES, SECTORS and WAVE_LINES.\n\n' +
    '   LOAD ORDER: this file declares QUESTIONS / QUESTIONS_SECTOR / ROLES /\n' +
    '   SECTORS / WAVE_LINES as top-level (non-module) script bindings, which\n' +
    '   app.js reads at its own module (IIFE) scope — e.g. `let sectorFilter =\n' +
    '   SECTORS[0].v;` runs immediately when app.js executes, and init() (also\n' +
    '   called immediately) populates the Track/Sector dropdowns from ROLES/\n' +
    '   SECTORS. Both must already exist by then, so index.html loads this\n' +
    '   file — and legal-sources.js — before app.js.\n\n' +
    '   Do not hand-edit divergently from the Portable Edition; re-run\n' +
    '   scripts/build-web-edition.js instead.\n' +
    '═══════════════════════════════════════════════════ */\n\n' +
    questionRegistryBlock + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'questions.js'), questionsJs);
  console.log('Wrote questions.js');

  // ---- 2b. legal-sources.js ----
  const legalSourcesJs =
    '/* ═══════════════════════════════════════════════════\n' +
    '   EACE.ai — Compliance Tasting Menu — Enterprise/Web Edition\n' +
    '   legal-source-registry data file.\n\n' +
    '   Extracted verbatim from the legal-source-registry section of the\n' +
    '   Portable Edition (eace-compliance-tasting-menu.html) — LEGAL_SOURCES\n' +
    '   (103 entries) and POOL_METHODOLOGY, unchanged.\n\n' +
    '   LOAD ORDER: declares LEGAL_SOURCES / POOL_METHODOLOGY as top-level\n' +
    '   (non-module) script bindings. Nothing in the current app.js reads them\n' +
    '   yet (they exist for label/rendering work such as the Intelligence\n' +
    '   Rail), but index.html still loads this file — and questions.js —\n' +
    '   before app.js, so any future app.js code can rely on them being\n' +
    '   present at module scope without a load-order surprise.\n\n' +
    '   Do not hand-edit divergently from the Portable Edition; re-run\n' +
    '   scripts/build-web-edition.js instead.\n' +
    '═══════════════════════════════════════════════════ */\n\n' +
    legalSourceRegistryBlock + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'legal-sources.js'), legalSourcesJs);
  console.log('Wrote legal-sources.js');

  // ---- 2c'. Patch the one dynamic inline style="..." built via innerHTML ----
  // renderSnapshot() interpolates a per-render value (r.pct, 0-100) into an
  // innerHTML string as style="width:NN%" — the empirical CSP check below
  // (a full headless-browser run, not just static review) caught this as a
  // real style-src-attr violation, since innerHTML-parsed markup is governed
  // by CSP exactly like static HTML. Unlike the static attributes handled in
  // index.html above, this value is genuinely dynamic, so it can't become a
  // fixed utility class — instead it's rendered as a data-pct attribute and
  // the width is applied afterward via the CSSOM (el.style.width = ...),
  // which the same empirical check confirms is CSP-exempt. Portable Edition
  // doesn't need this (its CSP keeps 'unsafe-inline' for style-src) — this
  // is an Enterprise/Web-Edition-only patch on top of the verbatim extract.
  const dynamicStyleOld =
    "'<div class=\"d-track\"><div class=\"d-fill' + (r.pct === 100 ? ' full' : '') + '\" style=\"width:' + r.pct + '%\"></div></div>' +";
  const dynamicStyleNew =
    "'<div class=\"d-track\"><div class=\"d-fill' + (r.pct === 100 ? ' full' : '') + '\" data-pct=\"' + r.pct + '\"></div></div>' +";
  if (!receiptRendererBlock.includes(dynamicStyleOld)) throw new Error('dynamic style="..." pattern not found in receipt-renderer block');
  let patchedReceiptRendererBlock = receiptRendererBlock.replace(dynamicStyleOld, dynamicStyleNew);

  const innerHtmlAssignEnd = "    : '';\n";
  const cssomWidthFix =
    innerHtmlAssignEnd +
    '\n  // Widths set via the CSSOM, not an innerHTML style="..." attribute — see\n' +
    '  // the load-order/CSP note above this function.\n' +
    "  DOM.snapDomains.querySelectorAll('.d-fill[data-pct]').forEach(function(el){\n" +
    "    el.style.width = el.dataset.pct + '%';\n" +
    '  });\n';
  if (!patchedReceiptRendererBlock.includes(innerHtmlAssignEnd)) throw new Error('renderSnapshot() innerHTML assignment end marker not found');
  patchedReceiptRendererBlock = patchedReceiptRendererBlock.replace(innerHtmlAssignEnd, cssomWidthFix);

  // ---- 2c. app.js ----
  const appJs =
    '/* ═══════════════════════════════════════════════════\n' +
    '   EACE.ai — Compliance Tasting Menu — Enterprise/Web Edition — engine\n' +
    '   100% client-side. No network calls. No login. No storage of the\n' +
    "   person's name — it lives in a JS variable only, for this session,\n" +
    '   and is never written to localStorage, sessionStorage, cookies, or\n' +
    '   sent anywhere. The one opt-in exception: if the person checks\n' +
    '   "Remember which questions I\'ve seen," a bare list of question IDs\n' +
    '   (nothing else) is written to localStorage — see the seen-question-ID\n' +
    '   helpers in the assessment-engine section below.\n\n' +
    '   This is the Enterprise/Web Edition build: markup, styles and question/\n' +
    '   legal-source data live in sibling files (index.html, styles.css,\n' +
    '   questions.js, legal-sources.js) instead of being inlined into one\n' +
    '   HTML file. This file — app.js — is everything else: app-shell,\n' +
    '   assessment-engine (incl. ASSESSMENT_MANIFESTS / resolveManifest()),\n' +
    '   receipt-engine, and receipt-renderer. It must load AFTER questions.js\n' +
    '   and legal-sources.js — see the load-order note at the top of each of\n' +
    '   those files.\n\n' +
    '   For the single-file, offline/downloadable build of this same product,\n' +
    '   see the Portable Edition: eace-compliance-tasting-menu.html. Do not\n' +
    '   let the two diverge — re-run scripts/build-web-edition.js against the\n' +
    '   Portable Edition any time it changes.\n' +
    '═══════════════════════════════════════════════════ */\n' +
    '(function(){\n\n' +
    appShellBlock + '\n\n' +
    assessmentEngineBlock + '\n\n' +
    receiptEngineBlock + '\n\n' +
    patchedReceiptRendererBlock + '\n\n' +
    'init();\n\n' +
    '})();\n';
  fs.writeFileSync(path.join(OUT_DIR, 'app.js'), appJs);
  console.log('Wrote app.js');

  // ---- 3. index.html: markup only, strict CSP, script/link tags ----
  let indexHtml = html;

  // Replace <style>...</style> with a stylesheet link.
  const fullStyleTag = html.slice(html.indexOf(styleOpen), styleEnd + styleClose.length);
  indexHtml = indexHtml.replace(fullStyleTag, '<link rel="stylesheet" href="styles.css">');

  // Replace <script>...</script> with the three script tags, in load order.
  const fullScriptTag = html.slice(html.indexOf(scriptOpen), scriptEnd + scriptClose.length);
  indexHtml = indexHtml.replace(
    fullScriptTag,
    '<script src="questions.js"></script>\n' +
    '<script src="legal-sources.js"></script>\n' +
    '<script src="app.js"></script>'
  );

  // Replace the CSP meta tag's content with the strict, no-unsafe-inline policy
  // (safe now that nothing is inline — everything is an external file the
  // browser loads from 'self').
  const cspRe = /(<meta http-equiv="Content-Security-Policy" content=")[^"]*("[^>]*>)/;
  if (!cspRe.test(indexHtml)) throw new Error('Could not find CSP meta tag');
  indexHtml = indexHtml.replace(cspRe, '$1' + STRICT_CSP + '$2');

  // Swap the Portable Edition's "EDITION: Portable Edition (this file)"
  // header comment for the Enterprise/Web Edition's own version.
  const editionCommentRe = /<!-- ═══════════════════════════════════════════════════\n     EDITION: Portable Edition[\s\S]*?═══════════════════════════════════════════════════ -->\n/;
  const newEditionComment =
    '<!-- ═══════════════════════════════════════════════════\n' +
    '     EDITION: Enterprise/Web Edition (this build)\n' +
    '     Markup, styles and data live in separate same-origin files\n' +
    '     (styles.css, questions.js, legal-sources.js, app.js), which is what\n' +
    '     lets the CSP below drop \'unsafe-inline\'. Built FROM the single-file\n' +
    '     Portable Edition (../eace-compliance-tasting-menu.html, the source\n' +
    '     of truth) by ../scripts/build-web-edition.js — never hand-edit the\n' +
    '     files in this directory; re-run that script instead, or edits will\n' +
    '     be silently lost and the two editions will drift apart. See\n' +
    '     README.md in this directory for the two editions\' respective\n' +
    '     trade-offs and when to use each.\n' +
    '     ═══════════════════════════════════════════════════ -->\n';
  if (!editionCommentRe.test(indexHtml)) throw new Error('Could not find EDITION header comment');
  indexHtml = indexHtml.replace(editionCommentRe, newEditionComment);

  // The Portable Edition's CSP-explainer comment describes the inline-file
  // trade-off and explicitly points at "a future physical file-split" as
  // the way to get a stricter CSP — replace it with one that reflects that
  // this IS that split, now that unsafe-inline is gone.
  const cspCommentRe = /<!-- This file loads no external network resources[\s\S]*?-->\n/;
  const newCspComment =
    '<!-- This file loads no external network resources of its own (no <img>,\n' +
    '     fetch, XHR, WebSocket, or sendBeacon anywhere in the code) beyond the\n' +
    '     same-origin <link>/<script> files below — connect-src \'none\' makes\n' +
    '     that a browser-enforced guarantee, not just a design intent. This is\n' +
    '     the Enterprise/Web Edition (see eace-compliance-tasting-menu.html for\n' +
    '     the single-file Portable Edition): styles.css, questions.js,\n' +
    '     legal-sources.js and app.js are all served same-origin, so\n' +
    '     script-src/style-src can be \'self\' instead of the Portable Edition\'s\n' +
    '     \'unsafe-inline\' — no inline script or style exists in this file.\n' +
    '     Instrument Sans and DM Mono stay embedded as base64 data: URIs inside\n' +
    '     styles.css, so font-src still allows data: rather than \'self\'. -->\n';
  if (!cspCommentRe.test(indexHtml)) throw new Error('Could not find CSP explainer comment');
  indexHtml = indexHtml.replace(cspCommentRe, newCspComment);

  // Title suffix so the two editions are distinguishable in a browser tab.
  indexHtml = indexHtml.replace(
    '<title>EACE.ai — Compliance Tasting Menu</title>',
    '<title>EACE.ai — Compliance Tasting Menu (Web Edition)</title>'
  );

  // ---- 4. Strip inline style="..." attributes ----
  // A strict CSP (style-src 'self', no 'unsafe-inline') blocks the HTML
  // parser from applying inline style="..." attributes — verified empirically
  // in a real headless browser (20 `style-src-attr` violations, #screen-quiz
  // and #screen-result both stuck visible at load). JS-driven
  // `element.style.x = value` is unaffected (confirmed by the same probe) —
  // app.js's showQuizScreen()/showResult()/etc keep working unchanged.
  // Each of the 20 static inline styles below is replaced with a CSS class
  // (new utility classes or scoped selectors added to styles.css), chosen so
  // the rendered result is pixel-identical to the Portable Edition. Several
  // turned out to exactly duplicate an existing base rule (e.g. .hint's own
  // margin-top, .avatar's own flex/border-radius/font styling) and are
  // simply dropped rather than replaced.
  const styleReplacements = [
    // [old markup fragment (unique), new markup fragment]
    ['<h1 style="font-size:1.9rem;margin-bottom:0.4rem" id="welcome-title" tabindex="-1">',
     '<h1 id="welcome-title" tabindex="-1">'],
    ['<p class="lede" style="margin-bottom:0.3rem">355 legally mapped',
     '<p class="lede lede-tight">355 legally mapped'],
    ['<div class="card" style="margin-top:1.5rem">\n\n      <div class="step">',
     '<div class="card">\n\n      <div class="step">'],
    ['<div id="role-field" style="display:none">',
     '<div id="role-field" class="is-hidden">'],
    ['<p class="hint" style="margin-top:0.5rem">Your sector does not determine',
     '<p class="hint">Your sector does not determine'],
    ['<label for="in-name" style="margin-top:0">Your name</label>',
     '<label for="in-name" class="mt-0">Your name</label>'],
    ['<p class="hint" style="margin-top:0.5rem">Used only for this session',
     '<p class="hint">Used only for this session'],
    ['<button type="button" class="link-btn" id="btn-reset-progress" style="display:none">',
     '<button type="button" class="link-btn hidden-init" id="btn-reset-progress">'],
    ['<section id="screen-quiz" style="display:none">',
     '<section id="screen-quiz" class="hidden-init">'],
    ['<div id="exam-note" class="exam-note no-print" style="display:none">',
     '<div id="exam-note" class="exam-note no-print hidden-init">'],
    ['<p class="hint" style="margin:0 0 1rem">Answer recorded.',
     '<p class="hint hint-exam-plain">Answer recorded.'],
    ['<section id="screen-result" style="display:none">',
     '<section id="screen-result" class="hidden-init">'],
    ['<h1 style="font-size:1.7rem" id="result-title" tabindex="-1">',
     '<h1 id="result-title" tabindex="-1">'],
    ['<div class="progress-track" style="margin-top:0.9rem"><div class="progress-fill" style="width:100%"></div></div>',
     '<div class="progress-track progress-track-result"><div class="progress-fill progress-fill-full"></div></div>'],
    ['<div class="card" style="margin-top:1.25rem">',
     '<div class="card card-mt-result">'],
    ['<div class="wave-note show" id="wave-note" style="margin-bottom:0">',
     '<div class="wave-note show" id="wave-note">'],
    ['<div class="avatar" style="border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:600">W</div>',
     '<div class="avatar">W</div>'],
    ['<div id="token-section" style="display:none">',
     '<div id="token-section" class="hidden-init">'],
    ['<label style="margin-top:0.5rem">EACE completion receipt</label>',
     '<label class="label-mt-sm">EACE completion receipt</label>'],
  ];

  for (const [oldFrag, newFrag] of styleReplacements) {
    if (!indexHtml.includes(oldFrag)) throw new Error('style replacement target not found: ' + oldFrag.slice(0, 60));
    const before = indexHtml;
    indexHtml = indexHtml.replace(oldFrag, newFrag);
    if (indexHtml === before) throw new Error('style replacement had no effect: ' + oldFrag.slice(0, 60));
  }

  const remainingInlineStyles = indexHtml.match(/ style="/g);
  if (remainingInlineStyles) throw new Error('Inline style attributes remain: ' + remainingInlineStyles.length);

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);
  console.log('Wrote index.html (0 inline style attributes — CSP style-src \'self\' safe)');

  // ---- 5. Append the CSS classes the replacements above reference ----
  // Pixel-identical to the inline styles they replace — verified against
  // styles.css's own base rules (e.g. #screen-welcome/#screen-result .card
  // has no base margin-top; .hidden-init deliberately has NO !important, so
  // app.js's later `el.style.display = 'block'` — a non-important inline
  // style — still overrides it, exactly like the removed inline style did).
  const cssAdditions =
    '\n/* ═══════════════════════════════════════════════════\n' +
    '   Enterprise/Web Edition — utility classes\n' +
    '   Replace the Portable Edition\'s per-element inline style="..." with\n' +
    '   classes, so the strict CSP (style-src \'self\', no \'unsafe-inline\') can\n' +
    '   still apply them — the HTML parser refuses inline style attributes\n' +
    '   under that policy, verified in a real headless browser. Each rule\n' +
    '   below reproduces one removed inline style exactly; some inline styles\n' +
    '   were dropped instead because they exactly duplicated a base rule\n' +
    '   already in this file (.hint\'s own margin-top; .avatar\'s own flex/\n' +
    '   border-radius/font styling).\n' +
    '═══════════════════════════════════════════════════ */\n' +
    '#welcome-title{font-size:1.9rem;margin-bottom:0.4rem}\n' +
    '.lede-tight{margin-bottom:0.3rem}\n' +
    '.mt-0{margin-top:0}\n' +
    '.label-mt-sm{margin-top:0.5rem}\n' +
    '#screen-welcome>.card{margin-top:1.5rem}\n' +
    '.hint-exam-plain{margin:0 0 1rem}\n' +
    '#result-title{font-size:1.7rem}\n' +
    '.progress-track-result{margin-top:0.9rem}\n' +
    '.progress-fill-full{width:100%}\n' +
    '.card-mt-result{margin-top:1.25rem}\n' +
    '#wave-note{margin-bottom:0}\n' +
    '/* Non-important on purpose — app.js toggles these via el.style.display,\n' +
    '   a plain inline style that must still be able to override this. */\n' +
    '.hidden-init{display:none}\n';
  fs.appendFileSync(path.join(OUT_DIR, 'styles.css'), cssAdditions);
  console.log('Appended utility CSS classes to styles.css');
}

main();
