/* ═══════════════════════════════════════════════════
   EACE.ai — Evidence Mode — evidence-core.js
   Schema, hashing and encode/decode logic shared by the PRODUCER
   (evidence-mode.js, runs during a live assessment session) and the
   VERIFIER (evidence-verifier.html, runs standalone, offline, on the
   admin/HR side) — exactly matching the existing product's own pattern of
   a receipt "decoded locally by EACE's admin tool."

   This file has zero network calls and zero dependencies beyond the
   in-browser Web Crypto API (crypto.subtle, crypto.randomUUID). It never
   signs or requests anything — see evidence-mode.js for that.

   EVIDENCE_VERSION 1 SCHEMA — see the "signable payload" section below for
   exactly which fields are covered by a signature, and in what order.
═══════════════════════════════════════════════════ */
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
  // carry once attested. Callers (see evidence-mode.js's
  // upgradeToAttested()) MUST set evidence.grade/timestamp_trust/tsa to
  // their final values BEFORE requesting the org signature, so the value
  // the org endpoint signs is the same value a later verifier recomputes
  // this payload from.
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

  const EvidenceCore = {
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

  if (typeof module !== 'undefined' && module.exports) module.exports = EvidenceCore;
  global.EvidenceCore = EvidenceCore;
})(typeof window !== 'undefined' ? window : globalThis);
