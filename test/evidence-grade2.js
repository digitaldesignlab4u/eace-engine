#!/usr/bin/env node
/**
 * Exercises the FULL Grade 2 (Attested Evidence) network flow end-to-end
 * against scripts/reference-org-signer.js running locally — the actual
 * evidence-mode.js code path (upgradeToAttested -> requestTrustedTimestamp
 * + requestOrgAttestation via fetch), not a re-implementation of it.
 *
 * This proves the CONTRACT is internally consistent and that a real
 * organisation-run endpoint following it would work — it does not and
 * cannot prove anything about a production deployment's TLS,
 * authentication, or key custody, none of which this reference server
 * implements (see reference-org-signer.js's own header comment).
 *
 * Usage:
 *   node scripts/generate-org-keypair.js > /tmp/org-keypair.json
 *   node scripts/reference-org-signer.js --keyfile /tmp/org-keypair.json --port 8937 &
 *   node test/evidence-grade2.js http://localhost:8937
 */
const path = require('path');

global.window = global;
require(path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'evidence-core.js'));
require(path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'evidence-mode.js'));

const endpointBase = process.argv[2] || 'http://localhost:8937';

// Minimal localStorage shim so getOrCreateDeviceKeypair() works under Node.
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

async function main() {
  const session = {
    mode: 'exam', roleOrSector: 'all', poolVersion: '2026-08',
    assessmentManifestId: 'EXAM-2026-v1',
    questionIds: ['q108', 'q136', 'q149'],
    answers: [{ id: 'q108', correct: true }, { id: 'q136', correct: false }, { id: 'q149', correct: true }],
    score: 2, total: 3, startedAt: new Date(Date.now() - 60000).toISOString(), build: 'grade2-test'
  };

  const local = await EvidenceMode.buildLocalEvidence(session);
  console.log('[1/5] Built Grade 1 (local) evidence — attempt', local.attempt_id);

  let threw = false;
  try {
    await EvidenceMode.upgradeToAttested(local, {});
  } catch (e) {
    threw = e instanceof EvidenceMode.EvidenceNetworkNotConfiguredError;
  }
  console.log('[2/5] upgradeToAttested() with no endpoints throws EvidenceNetworkNotConfiguredError:', threw ? 'PASS' : 'FAIL');

  const attested = await EvidenceMode.upgradeToAttested(local, {
    tsaEndpoint: endpointBase + '/tsa',
    orgEndpoint: endpointBase + '/attest'
  });
  console.log('[3/5] upgradeToAttested() against the reference signer succeeded — grade:', attested.grade, 'timestamp_trust:', attested.timestamp_trust);

  const orgSigOk = await verifyOrgSignature(attested);
  console.log('[4/5] Org co-signature verifies against the reference signer\'s public key:', orgSigOk ? 'PASS' : 'FAIL');

  // Tamper AFTER attestation — the org signature must break, exactly like
  // the device signature does (Core.orgSignablePayload commits to the
  // device signature and the tsa token too, not just the base fields).
  const tampered = JSON.parse(JSON.stringify(attested));
  tampered.score = 3;
  const orgSigOkAfterTamper = await verifyOrgSignature(tampered);
  console.log('[5/5] Org co-signature invalid after tampering with score (should be false):', orgSigOkAfterTamper === false ? 'PASS' : 'FAIL');

  const allPass = threw && attested.grade === 'attested' && orgSigOk && orgSigOkAfterTamper === false;
  console.log('');
  console.log(allPass ? 'GRADE 2 END-TO-END TEST: PASS' : 'GRADE 2 END-TO-END TEST: FAIL');
  process.exit(allPass ? 0 : 1);
}

async function verifyOrgSignature(evidence) {
  // Fetch the reference signer's own public key isn't exposed over HTTP by
  // design (it only signs) — for this test we already have it locally.
  const orgPublicKeyJwk = JSON.parse(require('fs').readFileSync('/tmp/org-keypair.json', 'utf8')).publicKey;
  const key = await crypto.subtle.importKey('jwk', orgPublicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
  const sigBytes = Buffer.from(evidence.org_attestation.org_signature, 'base64');
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, key, sigBytes,
    new TextEncoder().encode(EvidenceCore.orgSignablePayload(evidence))
  );
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
