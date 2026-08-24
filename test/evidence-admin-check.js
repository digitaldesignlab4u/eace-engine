const { chromium } = require('playwright');
const path = require('path');

const ADMIN_PATH = path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'evidence-admin.html');

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
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

  await page.goto('file://' + ADMIN_PATH, { waitUntil: 'load' });

  // ---- Keygen tab ----
  await page.click('.tab[data-panel="panel-keygen"]');
  await page.click('#btn-generate');
  await page.waitForSelector('#keygen-out', { state: 'visible', timeout: 5000 });
  const pub = await page.inputValue('#out-public');
  const priv = await page.inputValue('#out-private');
  console.log('Keygen: public key JWK generated:', pub.includes('"kty": "EC"'));
  console.log('Keygen: private key JWK generated:', priv.includes('"kty": "EC"'));

  // ---- Verify tab, with a real evidence token from evidence.js directly ----
  await page.click('.tab[data-panel="panel-verify"]');

  const evidenceToken = await page.evaluate(async () => {
    // Build a real evidence object right here in the page (Web Crypto available)
    // to avoid depending on the demo server being up for this specific check.
    const questionIds = ['q108', 'q136', 'q149'];
    const answers = [{ id: 'q108', correct: true }, { id: 'q136', correct: false }, { id: 'q149', correct: true }];
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    async function sha256Hex(str) {
      const bytes = new TextEncoder().encode(str);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    const questionSetHash = 'sha256:' + await sha256Hex(questionIds.slice().sort().join(','));
    const deviceKeyId = (await sha256Hex(['crv','kty','x','y'].map(k => k + '=' + publicKeyJwk[k]).join('&'))).slice(0, 16);
    const evidence = {
      evidence_version: 1, grade: 'local', attempt_id: 'EACE-ATT-' + crypto.randomUUID(),
      mode: 'pulse', role_or_sector: 'all', pool_version: '2026-08', assessment_manifest_id: 'ad-hoc',
      question_ids: questionIds, question_set_hash: questionSetHash, answers,
      score: 2, total: 3, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      timestamp_trust: 'local-unverified', tsa: null, device_key_id: deviceKeyId,
      device_public_key_jwk: publicKeyJwk, device_signature: null, org_attestation: null,
      product: { name: 'test', build: 'admin-check' }
    };
    function signablePayload(e) {
      const af = e.answers.map(a => a.id + ':' + (a.correct?1:0)).sort().join(',');
      return ['EACE-EVIDENCE', String(e.evidence_version), e.attempt_id, e.mode, e.role_or_sector, e.pool_version,
        e.assessment_manifest_id, e.question_ids.slice().sort().join(','), e.question_set_hash, af,
        String(e.score), String(e.total), e.started_at, e.completed_at, e.device_key_id].join('|');
    }
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, new TextEncoder().encode(signablePayload(evidence)));
    const bytes = new Uint8Array(sig);
    let binary = ''; bytes.forEach(b => { binary += String.fromCharCode(b); });
    evidence.device_signature = btoa(binary);
    const jsonBytes = new TextEncoder().encode(JSON.stringify(evidence));
    let jbin = ''; jsonBytes.forEach(b => { jbin += String.fromCharCode(b); });
    return 'EACE-EVID-' + btoa(jbin).replace(/=+$/, '');
  });

  await page.fill('#in-token', evidenceToken);
  await page.click('#btn-verify');
  await page.waitForSelector('#out-result', { state: 'visible', timeout: 5000 });
  const verdictClass = await page.getAttribute('#out-verdict', 'class');
  const verdictOk = verdictClass.includes('ok');
  console.log('Verify: verdict', verdictOk ? 'PASS' : 'FAIL', '(' + verdictClass + ')');

  console.log('console errors:', errors.length, errors.join(' | '));
  console.log('CSP violations:', cspViolations.length, cspViolations.join(' | '));

  const ok = errors.length === 0 && cspViolations.length === 0 && verdictOk &&
    pub.includes('"kty": "EC"') && priv.includes('"kty": "EC"');
  console.log(ok ? 'ADMIN TOOL CHECK: PASS' : 'ADMIN TOOL CHECK: FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
