/* ═══════════════════════════════════════════════════
   EACE.ai — Evidence Mode — evidence-mode.js (producer)
   Builds a genuinely stronger evidence artifact alongside — never instead
   of — the existing completion receipt. Depends on evidence-core.js.

   TWO GRADES, never blurred into one "trusted" label:

   Grade 1 — "Local Evidence" (default; fully local-first, zero network):
     attempt ID + question-set hash + per-question answer record + a
     LOCAL DEVICE signature (an ECDSA keypair generated in-browser on first
     use, private key never leaves the device) + a local, EXPLICITLY
     unverified timestamp. Proves the record has not been altered since
     this device produced it. Does NOT prove an organisation attested to
     it, and does NOT prove the timestamp is accurate — the device clock
     is trivially forgeable, and this evidence object says so in
     `timestamp_trust`.

   Grade 2 — "Attested Evidence" (opt-in; REQUIRES a network call):
     everything in Grade 1, plus an organisation co-signature obtained
     from an org-controlled endpoint (the org holds the private key;
     employee browsers only ever see its public key) and a trusted
     timestamp obtained from a timestamping endpoint. This is the tier
     that can actually support an audit claim — and it is impossible to
     build without a network round-trip to *something* the employee's
     browser does not control. That is a genuine architecture change from
     this product's local-first design, not an implementation detail, so
     it is off by default, requires an explicit endpoint to be configured,
     and is disclosed to the person taking the assessment before it fires.
     See README.md's "Grade 2 requires leaving local-first" section.

   Nothing in this file talks to any host unless upgradeToAttested() is
   called with an explicit endpoint configuration — building or verifying
   Grade 1 evidence never touches the network.
═══════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const Core = global.EvidenceCore || require('./evidence-core.js');

  const DEVICE_KEY_STORAGE_KEY = 'eace-evidence-device-key-v1';

  class EvidenceNetworkNotConfiguredError extends Error {
    constructor(what) {
      super(`Evidence Mode: ${what} requires a network endpoint, and none is configured. ` +
        'This is Grade 2 (Attested Evidence) functionality, which is a deliberate scope ' +
        'change away from this product\'s local-first architecture — see README.md. ' +
        'Grade 1 (Local Evidence) works fully offline and does not need this.');
      this.name = 'EvidenceNetworkNotConfiguredError';
    }
  }

  // ---- Attempt ID ----
  // crypto.randomUUID() (Web Crypto API, no dependency) gives 122 bits of
  // randomness — no coordination with a server is needed for this to be
  // unique in practice.
  function generateAttemptId() {
    return 'EACE-ATT-' + crypto.randomUUID();
  }

  // ---- Device keypair (Grade 1 signing key) ----
  // ECDSA P-256 via Web Crypto. Generated once per browser/device on first
  // opt-in use, persisted in localStorage (as JWK, since only extractable
  // keys can be serialized and a fresh CryptoKey object doesn't survive a
  // page navigation). This is a REAL limitation, stated plainly: anyone
  // with access to this browser profile's localStorage can read the
  // private key and forge Grade-1 signatures for this device — the same
  // threat model as any browser-local secret in a no-backend product.
  // Grade 1's honest claim is "not altered since produced by this device
  // key," not "impossible to forge by someone with device access."
  async function getOrCreateDeviceKeypair() {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (stored) {
      const jwkPair = JSON.parse(stored);
      const publicKey = await crypto.subtle.importKey(
        'jwk', jwkPair.publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']
      );
      const privateKey = await crypto.subtle.importKey(
        'jwk', jwkPair.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']
      );
      return { publicKey, privateKey, publicKeyJwk: jwkPair.publicKey };
    }
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']
    );
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, JSON.stringify({ publicKey: publicKeyJwk, privateKey: privateKeyJwk }));
    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, publicKeyJwk };
  }

  // Device changed hands (e.g. reassigned to a different employee)? Clear
  // the key so a fresh one gets generated next time — mirrors the existing
  // product's "Reset this device's progress" pattern for seen-question IDs.
  function resetDeviceKey() {
    localStorage.removeItem(DEVICE_KEY_STORAGE_KEY);
  }

  function hasDeviceKey() {
    return !!localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
  }

  async function deviceKeyId(publicKeyJwk) {
    const canonical = ['crv', 'kty', 'x', 'y'].map((k) => k + '=' + publicKeyJwk[k]).join('&');
    return (await Core.sha256Hex(canonical)).slice(0, 16);
  }

  async function signBase64(privateKey, message) {
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(message)
    );
    const bytes = new Uint8Array(sig);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // ---- Build a Grade 1 (Local Evidence) object ----
  // session: { mode, roleOrSector, poolVersion, assessmentManifestId,
  //            questionIds, answers, score, total, startedAt }
  // `answers` must be [{id, correct}], exactly the shape the existing
  // engine's own `answers` array already has — see README.md's
  // integration-hook note for where to read it from.
  async function buildLocalEvidence(session) {
    const { publicKeyJwk, privateKey } = await getOrCreateDeviceKeypair();
    const keyId = await deviceKeyId(publicKeyJwk);
    const questionSetHash = await Core.questionSetHash(session.questionIds);

    const evidence = {
      evidence_version: Core.EVIDENCE_VERSION,
      grade: 'local',
      attempt_id: generateAttemptId(),
      mode: session.mode,
      role_or_sector: session.roleOrSector,
      pool_version: session.poolVersion,
      assessment_manifest_id: session.assessmentManifestId || 'ad-hoc',
      question_ids: session.questionIds.slice(),
      question_set_hash: questionSetHash,
      answers: session.answers.map((a) => ({ id: a.id, correct: !!a.correct })),
      score: session.score,
      total: session.total,
      started_at: session.startedAt,
      completed_at: new Date().toISOString(),
      timestamp_trust: 'local-unverified',
      tsa: null,
      device_key_id: keyId,
      device_public_key_jwk: publicKeyJwk,
      device_signature: null,
      org_attestation: null,
      product: { name: 'EACE.ai Compliance Tasting Menu', build: session.build || 'unspecified' }
    };

    evidence.device_signature = await signBase64(privateKey, Core.signablePayload(evidence));
    return evidence;
  }

  // ---- Grade 2 network adapters (both OFF unless explicitly configured) ----
  // Simplified JSON contract, not a binary RFC 3161 client — see README.md
  // for exactly why, and what a production-grade TSA integration needs
  // instead. Only the HASH is ever sent, never the underlying evidence
  // content — same principle a real RFC 3161 request follows.
  async function requestTrustedTimestamp(hashHex, endpoint) {
    if (!endpoint) throw new EvidenceNetworkNotConfiguredError('a trusted timestamp');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: hashHex, hash_alg: 'SHA-256' })
    });
    if (!res.ok) throw new Error('Timestamp authority request failed: HTTP ' + res.status);
    return res.json(); // { authority, token, timestamp }
  }

  async function requestOrgAttestation(evidence, endpoint) {
    if (!endpoint) throw new EvidenceNetworkNotConfiguredError('organisation attestation');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidence })
    });
    if (!res.ok) throw new Error('Organisation attestation request failed: HTTP ' + res.status);
    return res.json(); // { org_key_id, org_signature, attested_at }
  }

  // ---- Upgrade a Grade 1 object to Grade 2, given explicit endpoints ----
  // Never called implicitly. The caller (the assessment UI) is responsible
  // for disclosing to the person taking the assessment, BEFORE calling
  // this, that a network request is about to happen and what it sends —
  // see the disclosure copy in demo.html.
  async function upgradeToAttested(localEvidence, config) {
    config = config || {};
    const evidence = JSON.parse(JSON.stringify(localEvidence)); // deep clone, never mutate the Grade-1 object in place

    const tsaResult = await requestTrustedTimestamp(
      (await Core.sha256Hex(Core.signablePayload(evidence))), config.tsaEndpoint
    );
    // Set every field orgSignablePayload() covers to its FINAL value before
    // requesting the org signature — the org endpoint signs exactly this
    // object's state (minus org_attestation itself, added after), so a
    // later verifier recomputing the same payload from the finished record
    // must see the same grade/timestamp_trust/tsa the org actually signed.
    evidence.timestamp_trust = 'tsa-attested';
    evidence.tsa = { authority: tsaResult.authority, token: tsaResult.token, timestamp: tsaResult.timestamp };
    evidence.grade = 'attested';

    const orgResult = await requestOrgAttestation(evidence, config.orgEndpoint);
    evidence.org_attestation = {
      org_key_id: orgResult.org_key_id,
      org_signature: orgResult.org_signature,
      attested_at: orgResult.attested_at
    };

    return evidence;
  }

  const EvidenceMode = {
    EvidenceNetworkNotConfiguredError,
    generateAttemptId,
    getOrCreateDeviceKeypair,
    resetDeviceKey,
    hasDeviceKey,
    deviceKeyId,
    buildLocalEvidence,
    requestTrustedTimestamp,
    requestOrgAttestation,
    upgradeToAttested
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = EvidenceMode;
  global.EvidenceMode = EvidenceMode;
})(typeof window !== 'undefined' ? window : globalThis);
