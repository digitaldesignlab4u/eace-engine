#!/usr/bin/env node
/**
 * Evidence Mode regression suite. Covers everything the design set out to
 * prove, end-to-end (real browser + real second process for Grade 2), not
 * just unit-level isolated calls:
 *   1. Attempt ID uniqueness across independent sessions
 *   2. Question-set hash reproducibility + manifest cross-check
 *   3. Zero console errors / zero CSP violations in the demo, Grade 1 flow
 *   4. Tamper detection: flip one field post-hoc, verifier must flag FAIL
 *   5. Full demo -> evidence-admin.html round trip (Grade 1)
 *   6. Full Grade 2 network flow against scripts/evidence-cli.js serve
 *      (its own process, real HTTP, not an in-process fake)
 *
 * Usage: node test/evidence-suite.js
 */
const path = require('path');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const { startServer } = require('./serve-dir');

const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO_DIR = path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'demo');
const VERIFIER_PATH = path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'evidence-admin.html');
const DEMO_PORT = 8936;
const SIGNER_PORT = 8937;

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function completeSession(browser, queryParams) {
  const page = await browser.newPage();
  const errors = [];
  const cspViolations = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.exposeFunction('__reportCSP', (v) => cspViolations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__reportCSP(e.violatedDirective + ' blocked ' + e.blockedURI + ' in ' + e.sourceFile + ':' + e.lineNumber);
    });
  });

  const url = `http://localhost:${DEMO_PORT}/index.html?` + new URLSearchParams(queryParams).toString();
  await page.goto(url, { waitUntil: 'load' });
  await page.check('#in-evidence');
  await page.fill('#in-name', 'Ana Kovač');
  await page.click('#btn-start');

  const nextSelector = queryParams.type === 'exam' ? '#btn-next-exam' : '#btn-next';
  let guard = 0;
  while (guard++ < 50) {
    if (!(await page.isVisible('#screen-quiz'))) break;
    await page.waitForSelector('#q-options .opt', { state: 'visible' });
    await page.click('#q-options .opt >> nth=0');
    await page.click(nextSelector);
  }

  await page.waitForSelector('#evidence-panel .evidence-eyebrow', { timeout: 5000 });
  const evidenceToken = await page.textContent('#evidence-token-out');
  await page.close();
  return { evidenceToken, errors, cspViolations };
}

async function runVerifier(browser, token, orgPublicKeyJwk) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + VERIFIER_PATH, { waitUntil: 'load' });
  await page.fill('#in-token', token);
  if (orgPublicKeyJwk) await page.fill('#in-org-key', JSON.stringify(orgPublicKeyJwk));
  await page.click('#btn-verify');
  await page.waitForSelector('#out-result', { state: 'visible', timeout: 5000 });
  const verdictOk = (await page.getAttribute('#out-verdict', 'class')).includes('ok');
  const checksHtml = await page.innerHTML('#out-checks');
  await page.close();
  return { verdictOk, checksHtml, errors };
}

function spawnSigner() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      path.join(__dirname, '..', 'scripts', 'evidence-cli.js'), 'serve',
      '--keyfile', '/tmp/org-keypair.json',
      '--port', String(SIGNER_PORT)
    ]);
    let publicKeyJwk = null;
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
      if (out.includes('listening on')) resolve({ child, publicKeyJwk });
    });
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('error', reject);
    setTimeout(() => reject(new Error('evidence-cli.js serve did not start within 5s')), 5000);
  });
}

async function main() {
  // Generate a fresh org keypair for this run (fs required here only).
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const keypairJson = execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'evidence-cli.js'), 'keygen'], { encoding: 'utf8' });
  fs.writeFileSync('/tmp/org-keypair.json', keypairJson);
  const orgPublicKeyJwk = JSON.parse(keypairJson).publicKey;

  const demoServer = await startServer(DEMO_DIR, DEMO_PORT);
  const { child: signerChild } = await spawnSigner();
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });

  try {
    // ---- 1. Attempt ID uniqueness + zero errors/CSP violations (Grade 1) ----
    const s1 = await completeSession(browser, { type: 'pulse', role: 'all' });
    const s2 = await completeSession(browser, { type: 'pulse', role: 'all' });
    record('Attempt IDs unique across independent sessions',
      JSON.parse(atobJson(s1.evidenceToken)).attempt_id !== JSON.parse(atobJson(s2.evidenceToken)).attempt_id);
    record('Zero console errors during Grade 1 session (demo)', s1.errors.length === 0 && s2.errors.length === 0,
      [...s1.errors, ...s2.errors].join(' | '));
    record('Zero CSP violations during Grade 1 session (demo)', s1.cspViolations.length === 0 && s2.cspViolations.length === 0,
      [...s1.cspViolations, ...s2.cspViolations].join(' | '));

    // ---- 2. Question-set hash + manifest cross-check (exam = fixed manifest) ----
    const examSession = await completeSession(browser, { type: 'exam' });
    const examVerify = await runVerifier(browser, examSession.evidenceToken);
    record('Exam session: full verifier check passes (hash + manifest cross-check + signature)', examVerify.verdictOk);
    record('Exam session: manifest cross-check specifically ran (not N/A)',
      examVerify.checksHtml.includes('known fixed manifest') && examVerify.checksHtml.includes('Pass'));

    // ---- 3. Grade 1 verify round trip (pulse — ad-hoc, no manifest) ----
    const s1Verify = await runVerifier(browser, s1.evidenceToken);
    record('Pulse (ad-hoc) session: verifier passes', s1Verify.verdictOk);
    record('Pulse (ad-hoc) session: manifest check correctly N/A', s1Verify.checksHtml.includes('no fixed manifest to check against'));

    // ---- 4. Tamper detection ----
    const decoded = JSON.parse(atobJson(s1.evidenceToken));
    decoded.score = decoded.score + 1; // flip the score without re-signing
    const tamperedToken = 'EACE-EVID-' + Buffer.from(JSON.stringify(decoded), 'utf8').toString('base64').replace(/=+$/, '');
    const tamperVerify = await runVerifier(browser, tamperedToken);
    record('Tampered evidence (score edited post-signing) fails verification', !tamperVerify.verdictOk);

    // ---- 5. Grade 2 end-to-end (real second process, real HTTP) ----
    const g2Result = execFileSync(process.execPath, [path.join(__dirname, 'evidence-grade2.js'), `http://localhost:${SIGNER_PORT}`], { encoding: 'utf8' });
    console.log(g2Result.trim().split('\n').map((l) => '  (grade2) ' + l).join('\n'));
    record('Grade 2 end-to-end (network, real second process)', g2Result.includes('GRADE 2 END-TO-END TEST: PASS'));

  } finally {
    await browser.close();
    await demoServer.close();
    signerChild.kill('SIGKILL');
  }

  const passed = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`${passed}/${results.length} passed, ${results.length - passed} failed`);
  process.exit(passed === results.length ? 0 : 1);
}

function atobJson(token) {
  let b64 = token.slice('EACE-EVID-'.length);
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from(b64, 'base64').toString('utf8');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
