# EACE Compliance Tasting Menu — Enterprise/Web Edition

This directory is the **Enterprise/Web Edition** build of the EACE.ai
Compliance Tasting Menu: the same product as the single-file **Portable
Edition** (`../eace-compliance-tasting-menu.html`), split into separate
same-origin files so it can ship behind a strict Content-Security-Policy.

## The two editions

| | Portable Edition | Enterprise/Web Edition |
|---|---|---|
| File | `eace-compliance-tasting-menu.html` | `eace-compliance-tasting-menu-web/` (this directory) |
| Shape | One self-contained HTML file | `index.html` + `styles.css` + `questions.js` + `legal-sources.js` + `app.js` |
| CSP | `script-src 'unsafe-inline'; style-src 'unsafe-inline'` | `script-src 'self'; style-src 'self'` — no inline script or style anywhere |
| Use when | Offline use, email/USB distribution, a single file to download and open | Hosted behind a real web server, where a strict CSP is expected/required |
| Source of truth | **Yes** — edit content, questions, legal sources and styling here | No — generated from the Portable Edition |

**The Portable Edition is the source of truth.** This directory is
generated from it by `../scripts/build-web-edition.js` — do not hand-edit
`index.html`, `styles.css`, `questions.js`, `legal-sources.js` or `app.js`
in this directory; a manual edit here doesn't touch the Portable Edition, so
the two editions will drift out of sync, silently, until someone finds the
mismatch. Change the Portable Edition, then run:

```sh
node scripts/build-web-edition.js
```

from the repo root to regenerate every file in this directory.

## Why the CSP is different

The Portable Edition ships as one file by design — no build step, nothing
to fetch — which means its `<script>`/`<style>` are necessarily inline, so
its CSP needs `'unsafe-inline'` for `script-src`/`style-src`. This edition's
whole point is to drop that: `index.html` has no inline `<script>` or
`<style>` block, and (as of this build) no inline `style="..."` attribute
either — everything is either an external same-origin file the CSP already
trusts (`'self'`), or applied at runtime via `element.style.x = ...`, which
browsers exempt from CSP's style-src (verified empirically, not just by
reading the spec — see the note below).

## Load order

`index.html` loads the three scripts in this order:

```html
<script src="questions.js"></script>
<script src="legal-sources.js"></script>
<script src="app.js"></script>
```

`questions.js` and `legal-sources.js` are plain (non-module) scripts that
declare `QUESTIONS`, `QUESTIONS_SECTOR`, `ROLES`, `SECTORS`, `WAVE_LINES`,
`LEGAL_SOURCES` and `POOL_METHODOLOGY` as top-level bindings — classic
`<script>` tags on the same page share one global lexical scope, so these
become visible to code that runs afterward, including everything inside
`app.js`'s own IIFE. `app.js` reads several of them immediately when it
executes (e.g. `let sectorFilter = SECTORS[0].v;`, and `init()` — called at
the very bottom of the file — populates the Track/Sector dropdowns from
`ROLES`/`SECTORS`), so it must load last, or those reads hit a
`ReferenceError` (the binding not existing yet). `LEGAL_SOURCES` and
`POOL_METHODOLOGY` aren't read anywhere in the current `app.js`, but
`legal-sources.js` still loads before `app.js` on the same principle, so
future `app.js` code can rely on them being present without a load-order
surprise.

## What changed from a straight copy-paste split

A few things in the Portable Edition only work because its CSP still allows
`'unsafe-inline'`. Splitting the files alone would have shipped a broken
page under the strict CSP above — caught by actually running it in a
headless browser (Playwright) and watching for `securitypolicyviolation`
events and console errors, not by reading the code:

- **20 static `style="..."` attributes** in the markup (initial
  `display:none` on the quiz/result screens, one-off margin/font-size
  tweaks, etc.) — the HTML parser refuses to apply an inline `style`
  attribute under `style-src 'self'`. Each was replaced with a CSS class in
  `styles.css` (new utility classes, or a scoped selector like
  `#screen-result .progress-track`); a few turned out to exactly duplicate
  a rule the stylesheet already had (`.hint`'s own `margin-top`, `.avatar`'s
  own flex/border-radius/font styling) and were simply dropped. The
  `.hidden-init` class deliberately has **no** `!important`, so `app.js`
  setting `el.style.display = 'block'` later (a plain inline style) still
  overrides it — same behavior as the inline `style="display:none"` it
  replaced.
- **One dynamic `style="width:NN%"`**, built inside an `innerHTML` string in
  `renderSnapshot()` (the per-domain score bars on the result screen).
  `innerHTML`-parsed markup is governed by CSP exactly like static HTML, so
  this needed a different fix than a fixed class — the percentage is
  genuinely different every session. It's rendered as `data-pct="NN"`
  instead, then a short loop right after the `innerHTML` assignment applies
  the width via `element.style.width = ...` (the CSSOM property, not the
  HTML attribute) — confirmed CSP-exempt by the same empirical check.

Both fixes are applied by `build-web-edition.js` itself, on top of an
otherwise byte-for-byte-verbatim extraction of the CSS and JS from the
Portable Edition (verified by the build script: every extracted block is
checked to still appear as an exact substring of the source before being
written out).

## Verifying this build

```sh
cd test && npm install   # once
npm run test:web         # regression harness against this edition
npm run test:portable    # same harness against the Portable Edition
```

The harness (`test/run.js`) drives all 19 mode/track/sector combinations —
4 role tracks × Daily Pulse, 12 sectors, and the 3 fixed cadences
(Onboarding/Deep Dive/Annual Assessment) — through a full session each, and
asserts zero console errors, zero CSP violations, a rendered result screen,
and (where the session generates one) a completion receipt that
Base64-decodes to the expected fields — including a Croatian-diacritics name
surviving the round trip through `app.js`'s `TextEncoder`-based `b64()`.
`test/run-web-edition.js` wraps a throwaway static file server around the
harness, since CSP and same-origin script loading need a real `http://`
origin rather than `file://`.
