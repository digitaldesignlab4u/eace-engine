/* ═══════════════════════════════════════════════════
   EACE.ai — Evidence Mode — evidence.js
   Everything the PRODUCT side needs to build an Evidence Mode record:
   schema/hashing (was evidence-core.js) + attempt ID, device signing and
   Grade 2 network adapters (was evidence-mode.js), merged into one file so
   the demo only ever loads a single <script> for this. Two internal
   sections below, each still exporting its own namespace
   (EvidenceCore / EvidenceMode) so nothing that references either name
   needs to change.

   The standalone admin tool (evidence-admin.html — keygen + verifier) is
   deliberately NOT built from this file: it inlines its own, smaller copy
   of just the schema/hashing/verify logic (no signing, no network,
   nothing that needs the Web Crypto sign() capability at all), so it stays
   a single file a person can open with literally nothing else, and never
   ships code that CAN make a network call. See that file's own header
   comment, and README.md's "One tool, one library" section, for why that
   duplication is a deliberate trade-off, not an oversight — and where to
   look if the schema ever changes and both copies need updating together.

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
   called with an explicit endpoint configuration — building Grade 1
   evidence never touches the network.
═══════════════════════════════════════════════════ */

/* ---- Section 1/2: schema, hashing, encode/decode (EvidenceCore) ---- */
(function (global) {
  'use strict';

  const EVIDENCE_VERSION = 1;
  const TOKEN_PREFIX = 'EACE-EVID-';

  // ---- SHA-256 helpers (Web Crypto API — no dependency) ----
  async function sha256Hex(str) {
    const bytes = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // ---- Question-set hash ----
  // Hashed over the SORTED, comma-joined question IDs — not presentation
  // order — because the evidence claim is "these N questions were asked,"
  // not "in this order." (Presentation order is still recorded separately
  // in `question_ids` for information, just not what's hashed.) For
  // manifest-backed modes (exam/deepdive/onboarding) a verifier who also
  // holds ASSESSMENT_MANIFESTS can independently derive the expected hash
  // from the manifest's own frozen question_ids, without trusting this
  // evidence object's question_ids list at all — see
  // verifyQuestionSetAgainstManifest() below. For ad-hoc modes
  // (pulse/sector), the hash is tamper-evidence on the claimed list, not
  // independent proof of the original random draw — that distinction is
  // surfaced explicitly in the verifier's output, not glossed over.
  async function questionSetHash(questionIds) {
    const canonical = questionIds.slice().sort().join(',');
    return 'sha256:' + (await sha256Hex(canonical));
  }

  // ---- The exact byte sequence the DEVICE signature covers ----
  // Deliberately an explicit, fixed field list (in the same spirit as the
  // existing product's pipe-joined receipt payload) rather than a generic
  // JSON canonicalizer — easier to audit, and sidesteps key-ordering/
  // number-formatting edge cases a recursive canonicalizer would need to
  // handle correctly to be trustworthy.
  //
  // Deliberately EXCLUDES `grade`, `timestamp_trust`, `tsa` and
  // `org_attestation` — all four can be added/changed by a later Grade 2
  // upgrade (buildLocalEvidence() always starts at grade:'local',
  // timestamp_trust:'local-unverified', tsa:null; upgradeToAttested() then
  // changes the first two and populates the last two). If any of those
  // were covered by this signature, upgrading a record to Grade 2 would
  // invalidate its own Grade 1 device signature — the device signed a
  // snapshot of THAT information which no longer matches after the
  // in-place mutation. This bug shipped once already (caught by
  // test/evidence-grade2.js's end-to-end run against a real second
  // process, not by unit-testing signing and verifying in the same
  // isolated call) — see orgSignablePayload() below for where those four
  // fields actually do get covered, by the signature that is supposed to
  // change when they do.
  function signablePayload(evidence) {
    const answerField = evidence.answers
      .map((a) => a.id + ':' + (a.correct ? 1 : 0))
      .sort()
      .join(',');
    return [
      'EACE-EVIDENCE',
      String(evidence.evidence_version),
      evidence.attempt_id,
      evidence.mode,
      evidence.role_or_sector,
      evidence.pool_version,
      evidence.assessment_manifest_id,
      evidence.question_ids.slice().sort().join(','),
      evidence.question_set_hash,
      answerField,
      String(evidence.score),
      String(evidence.total),
      evidence.started_at,
      evidence.completed_at,
      evidence.device_key_id
    ].join('|');
  }

  // The org co-signature (Grade 2 only) covers the device-signed base PLUS
  // the device signature itself (so it can't be swapped for a different
  // one) PLUS the FINAL grade/timestamp_trust/tsa values this record will
  // carry once attested. Callers (see upgradeToAttested() below) MUST set
  // evidence.grade/timestamp_trust/tsa to their final values BEFORE
  // requesting the org signature, so the value the org endpoint signs is
  // the same value a later verifier recomputes this payload from.
  function orgSignablePayload(evidence) {
    return [
      signablePayload(evidence),
      evidence.device_signature,
      evidence.grade,
      evidence.timestamp_trust,
      evidence.tsa ? evidence.tsa.token : ''
    ].join('|');
  }

  // ---- UTF-8-safe base64, matching the product's own b64() convention ----
  function b64Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function b64Decode(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encodeEvidenceToken(evidence) {
    return TOKEN_PREFIX + b64Encode(JSON.stringify(evidence)).replace(/=+$/, '');
  }
  function decodeEvidenceToken(token) {
    if (!token || !token.startsWith(TOKEN_PREFIX)) {
      throw new Error('Not an EACE evidence token (missing ' + TOKEN_PREFIX + ' prefix)');
    }
    let b64 = token.slice(TOKEN_PREFIX.length).trim();
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const json = b64Decode(b64);
    const evidence = JSON.parse(json);
    if (evidence.evidence_version !== EVIDENCE_VERSION) {
      throw new Error('Unsupported evidence_version: ' + evidence.evidence_version);
    }
    return evidence;
  }

  // ---- Cross-check against a known manifest (exam/deepdive/onboarding) ----
  // Given the SAME ASSESSMENT_MANIFESTS constant the assessment engine
  // uses, confirms the evidence's declared question_ids match the frozen
  // manifest exactly (order-independent) — a strictly stronger check than
  // just recomputing the hash from the evidence's own claimed list, since
  // the manifest is a value the verifier holds independently.
  function verifyQuestionSetAgainstManifest(evidence, assessmentManifests) {
    if (evidence.assessment_manifest_id === 'ad-hoc') {
      return { applicable: false, reason: 'Ad-hoc draw (pulse/sector) — no fixed manifest to check against.' };
    }
    const manifestKey = Object.keys(assessmentManifests || {}).find(
      (k) => assessmentManifests[k].id === evidence.assessment_manifest_id
    );
    if (!manifestKey) {
      return { applicable: true, pass: false, reason: 'Manifest ID not found in this verifier’s known manifests: ' + evidence.assessment_manifest_id };
    }
    const expected = assessmentManifests[manifestKey].question_ids.slice().sort();
    const actual = evidence.question_ids.slice().sort();
    const pass = expected.length === actual.length && expected.every((id, i) => id === actual[i]);
    return { applicable: true, pass, expectedCount: expected.length, actualCount: actual.length };
  }

  global.EvidenceCore = {
    EVIDENCE_VERSION,
    TOKEN_PREFIX,
    sha256Hex,
    questionSetHash,
    signablePayload,
    orgSignablePayload,
    b64Encode,
    b64Decode,
    encodeEvidenceToken,
    decodeEvidenceToken,
    verifyQuestionSetAgainstManifest
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ---- Section 2/2: attempt ID, device signing, Grade 2 adapters (EvidenceMode) ---- */
(function (global) {
  'use strict';

  const Core = global.EvidenceCore;

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
  // see the disclosure copy in demo/index.html.
  async function upgradeToAttested(localEvidence, config) {
    config = config || {};
    const evidence = JSON.parse(JSON.stringify(localEvidence)); // deep clone, never mutate the Grade-1 object in place

    const tsaResult = await requestTrustedTimestamp(
      (await Core.sha256Hex(Core.signablePayload(evidence))), config.tsaEndpoint
    );
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

  global.EvidenceMode = {
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
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EvidenceCore: globalThis.EvidenceCore, EvidenceMode: globalThis.EvidenceMode };
}
