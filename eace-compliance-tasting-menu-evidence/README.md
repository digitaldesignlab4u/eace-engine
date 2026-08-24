# EACE.ai Compliance Tasting Menu — Evidence Mode

Evidence Mode is a **new, additive artifact type** for the EACE.ai Compliance
Tasting Menu, sitting *alongside* the existing completion receipt — never
replacing it, never reusing its logic, and never blurring the line between
the two. It exists for organisations that need genuine audit defensibility
from an assessment attempt, which the receipt was never designed to provide
and still doesn't.

**Nothing here modifies `eace-compliance-tasting-menu.html` (the Portable
Edition — the reference architecture) or `eace-compliance-tasting-menu-web/`
(the Web Edition).** Everything in this directory is new files. The one
place Evidence Mode touches existing product code is a 3-line hook added to
a *copy* of `app.js` inside `demo/` (built by
`../scripts/build-evidence-demo.js`) — see "Integrating into a real build"
below for exactly what those three lines are and how to apply them yourself.

## Receipt vs. Evidence — read this before anything else

| | Completion Receipt (existing, unchanged) | Evidence Mode record (new) |
|---|---|---|
| What it is | A self-reported summary: name, score, date, mode, pool_version, assessment_manifest_id | A structured, hash-verifiable, cryptographically signed record of the exact question set and per-question correctness |
| Generated | Always, for every mode except a failed exam | Only if the person opts in (a checkbox, off by default) |
| Proves | Nothing on its own — the product's own copy calls it "a self-reported completion receipt, not an auditable evidence record" | Grade 1: the record hasn't been altered since this device produced it. Grade 2 adds: an organisation attested to it, with a timestamp from something other than the local clock |
| Requires network | Never | Grade 1: never. Grade 2: yes, unavoidably — see below |
| On a failed exam | Not generated (product suppresses it) | Still generated if opted in — see "A deliberate behavioural difference" below |

**This framing must not regress.** The receipt's own copy in both existing
editions is correct and stays exactly as-is. Evidence Mode is a strictly
additional, opt-in, more expensive (in complexity and, at Grade 2, in
architecture) artifact for people who need more than the receipt promises.

## The chain, and the decision at each link

The brief asked for: *Assessment Manifest → Attempt ID → Question-set hash →
Answer record → Timestamp → Completion status → Evidence object →
Verification.* Here is what each link actually does, and why.

### 1. Attempt ID
`crypto.randomUUID()` (Web Crypto, no dependency), prefixed `EACE-ATT-`.
122 bits of randomness is enough to be unique without any server-side
coordination — this stays fully local-first. Generated once, at
`startSession()` time.

### 2. Question-set hash
SHA-256 (Web Crypto `crypto.subtle.digest`) over the **sorted**,
comma-joined question IDs — sorted because the evidence claim is "these N
questions were asked," not "in this order." For manifest-backed modes (exam
/ deep-dive / onboarding), a verifier holding the same `ASSESSMENT_MANIFESTS`
constant can derive the *expected* hash independently and cross-check it
against the evidence object's own claimed list — a strictly stronger check
than just recomputing the hash from what the object itself asserts. For
ad-hoc modes (pulse / sector), there's no independent source of truth for
what was drawn — the hash is tamper-evidence on the claimed list, not
external proof of the original random draw, and the verifier says exactly
that (`N/A — no fixed manifest to check against`) rather than implying
otherwise.

### 3. Answer record
`{id, correct}` per question — no answer text, matching the shape the
existing engine's own `answers` array already has. Score and total are also
included, and the verifier recomputes both from the per-question record and
flags a mismatch.

### 4. Timestamp — the first real architecture tension
A local `Date()`/`toISOString()` is not evidence of *when* something
happened — it's evidence of what the device's clock said, which anyone with
access to that device can change before or after the fact. Two honestly
labeled modes:
- **`local-unverified`** (default, Grade 1): a plain local timestamp,
  explicitly labeled as such everywhere it's shown — in the evidence object
  (`timestamp_trust: 'local-unverified'`), in the demo's UI, and in the
  verifier's output. No network call.
- **`tsa-attested`** (Grade 2, opt-in): a timestamp obtained from a
  timestamping endpoint. See "Grade 2 requires leaving local-first" below —
  this is the point where a network call becomes structurally unavoidable,
  not a missing feature.

### 5. Cryptographic signature — the second, bigger architecture tension
*Signing with what key, held where, verified by whom?* This is the question
the brief asked to work through rather than default past, and working
through it honestly produces two tiers, not one:

- **Grade 1 — device-held key.** On first opt-in use, the browser generates
  its own ECDSA P-256 keypair (Web Crypto) and signs the record with it. The
  public key travels inside the evidence object, so any verifier can check
  the signature with no external lookup. **What this proves:** the record
  hasn't been altered since this device signed it. **What it does not
  prove:** that an organisation attested to the session, or that the signer
  is who they claim — a per-device key generated by the same browser that
  produced the record is, structurally, self-signing. It's a real step up
  from an unsigned receipt (tamper-evidence, consistent device identity
  across attempts), and every place this is shown says exactly that, not
  more.
- **Grade 2 — organisation-held key.** The brief's own framing —
  *"HR/IT holds a keypair, employees' browsers only get the public key"* —
  is the only model that can make a signature mean "the organisation vouches
  for this," and it is **impossible to implement as pure client-side
  JavaScript**: if the employee's browser held the private key, it
  wouldn't be the organisation's key anymore. Producing an org signature
  therefore requires sending the (already device-signed) record to
  something the employee's browser does not control, and getting a
  signature back — a network round-trip to an org-run endpoint. This is
  implemented (see `evidence.js`'s `requestOrgAttestation()` and
  `scripts/evidence-cli.js serve`), off by default, and never fires
  without an endpoint explicitly configured.

`evidence-admin.html`'s "Generate Organisation Key" tab generates the org
keypair in-browser, once, with the private key never leaving that page and
never shipping in any product build — `scripts/evidence-cli.js keygen` is a
CLI equivalent for testing/automation.

### 6. Completion status, Evidence object
Assembled by `evidence.js`'s `buildLocalEvidence()`. Full schema in that
file's header comment; encoded the same way the existing receipt is
(`EACE-EVID-<base64>`), decodable by `evidence-admin.html`.

### 7. Verification
`evidence-admin.html`'s "Verify Evidence" tab — standalone, works fully
offline (open it via `file://`, no server needed) for Grade 1. Matches the
existing product's own pattern of a receipt "decoded locally by EACE's
admin tool." Runs, and displays as separate pass/fail/N-A rows with an
explanatory note each, never just an overall thumbs-up:
1. Required fields present
2. Question-set hash matches the claimed question list
3. Question set matches a known fixed manifest (exam/deepdive/onboarding
   only — explicitly N/A for pulse/sector)
4. Score matches the per-question answer record
5. Device signature valid (with an explicit note on what this does and
   does not prove)
6. Timestamp trust level (always shown, never silently upgraded)
7. Organisation co-signature (N/A for Grade 1; requires the verifier
   operator to paste the org public key to actually check for Grade 2)

## Grade 2 requires leaving local-first — the trade-off, named plainly

This is the point the brief asked not to paper over, so: **an evidence
record that an organisation can actually stand behind cannot be produced
entirely inside a browser the employee controls.** Either the browser sends
something to an endpoint the organisation controls (what this build does),
or the "organisation attestation" isn't real — it would just be another
device-held key with an official-sounding name. There's no third option
that keeps this both local-first and genuinely attested.

Concretely, turning Grade 2 on requires an organisation to:
1. Generate a keypair (`evidence-admin.html`'s keygen tab, or
   `evidence-cli.js keygen`) and keep the private key somewhere real (a
   secrets manager or HSM — this product does not manage that for you, and
   has no rotation/revocation mechanism).
2. Deploy something serving `POST /attest` and (for a genuinely independent
   timestamp) `POST /tsa`, reachable from employees' browsers.
   `scripts/evidence-cli.js serve` is a correct, tested example of the
   contract — **not production code** (no TLS termination, no
   authentication, cleartext key file) — see its own header comment for
   exactly what a production deployment needs to add.
3. Wire `evidence.js`'s `upgradeToAttested(evidence, {tsaEndpoint,
   orgEndpoint})` up to those URLs, and — this part is a product/UX decision
   for whoever integrates this, not something the library does for you —
   disclose to the person taking the assessment, *before* the network call
   fires, that it's about to happen and what it sends (only a SHA-256 hash
   of the evidence content, never the underlying record, matching RFC
   3161's own "sign a hash, never the content" principle).

Until an organisation does that, Grade 2 stays off, and every session that
opts into Evidence Mode gets Grade 1 only — which is the honest state to
default to, not a workaround.

**On RFC 3161 specifically:** `requestTrustedTimestamp()` and
`scripts/evidence-cli.js serve`'s `/tsa` endpoint speak a simplified
JSON-over-HTTPS contract (`{hash, hash_alg} -> {authority, token,
timestamp}`), not the actual binary RFC 3161 protocol against a
certificate-audited timestamp authority. Implementing a real RFC 3161 client
(ASN.1 DER request/response, certificate chain validation against a
specific TSA's CA) dependency-free in the browser is a substantial
undertaking on its own, and — checked directly rather than assumed — this
environment's network policy doesn't reach public TSA hosts to validate
such a client against anyway (`timestamp.digicert.com` returned 403 through
this session's proxy, `freetsa.org` didn't connect at all). Shipping
something that *looks* RFC-3161-shaped without that validation would be
worse than being explicit about the gap: if genuine RFC 3161 interop
matters to you, point `requestTrustedTimestamp()`'s endpoint at a real TSA
client (several exist server-side) instead of the reference `/tsa`.

## A deliberate behavioural difference from the receipt

The receipt is not generated for a failed exam (`pct < 80`) — the product
intentionally withholds it. Evidence Mode's hook fires **regardless of
pass/fail**: recording that an attempt happened, on which exact question
set, with which answers, matters for audit purposes independent of whether
it was a passing attempt. If that's not the behaviour you want in a real
deployment, it's a one-line change at the call site (see `app.js`'s two
`EVIDENCE MODE HOOK (3/3)` insertions in `demo/` — the early-return branch
and the end of `showResult()`; drop the first one to only ever record
passing/completed sessions).

## What Evidence Mode does **not** claim, at either grade

- **Real-world identity.** Nothing here confirms the named person is who
  they say they are — same limitation the receipt already has. A device
  key or an org attestation authenticates a *record*, not a *person*.
- **Key security beyond the browser's own.** The Grade 1 device private
  key lives in `localStorage` as an extractable JWK (it has to, to survive
  a page reload) — anyone with access to that browser profile can read it
  and forge Grade-1 signatures for that device. This is the same threat
  model as any browser-local secret in a no-backend product, not a flaw
  specific to this design; `resetDeviceKey()` exists for when a device
  changes hands.
- **Revocation or rotation.** Neither grade has a mechanism to invalidate a
  compromised key after the fact. A production deployment needs its own
  answer to this, same as it would for any signing key.

## Integrating into a real build

`scripts/build-evidence-demo.js` applies exactly three hook insertions to a
copy of `app.js`, none of which change existing behaviour — they only add
a `sessionStartedAt` timestamp and dispatch a `eace:session-complete`
`CustomEvent` carrying the same data already sitting in `app.js`'s own
session-state variables:

1. `let sessionStartedAt = null;` next to the other session-state `let`s
2. `sessionStartedAt = new Date().toISOString();` as the first line of
   `startSession()`
3. The event dispatch, once in `showResult()`'s early-return (failed exam)
   branch, once at the end — see the script for the exact `CustomEvent`
   detail shape.

Apply the same three insertions to the Portable Edition or the Web
Edition's real `app.js` (not the demo copy) to wire Evidence Mode into an
actual shipped build, then add `evidence.js`, an opt-in checkbox, and a
render target for the evidence panel — `demo/index.html`'s two markup
insertions and `demo/evidence-integration.js` (both produced by
`build-evidence-demo.js` — read its `EVIDENCE_INTEGRATION_JS` constant and
its `assertReplace()` calls for the exact markup) are a working reference
for both.

## One tool, one library

Two consolidations on top of the design above, made after building it, to
cut the file count without losing anything a real deployment needs:

- **`evidence.js`** is `evidence-core.js` (schema/hashing) and
  `evidence-mode.js` (attempt ID/signing/Grade 2 adapters) concatenated
  into one file the product loads with a single `<script>` tag. The two
  original sections are still marked and still each export their own
  namespace (`EvidenceCore`, `EvidenceMode`) internally — nothing about
  the logic changed, only that it now ships as one file.
- **`evidence-admin.html`** is the keypair generator and the verifier
  merged into one page with a tab switcher ("Verify Evidence" /
  "Generate Organisation Key"). This one is a genuine trade-off, not a
  free merge: `evidence-admin.html` does **not** load `evidence.js` —
  it inlines its own copy of just the hashing/schema/verify logic (no
  signing, no `fetch()`, nothing that can reach the network at all,
  which is deliberate for an admin tool that only ever reads and checks
  records) directly in its own `<script>` block, the same way
  `evidence-admin.html`'s predecessor (the old standalone
  `evidence-verifier.html`) already did. That means the hashing/schema
  logic exists in **two places** — `evidence.js` and
  `evidence-admin.html` — and if the evidence schema ever changes
  (a new field, a different signable-payload shape), **both need
  updating together**, by hand; nothing generates one from the other. The
  alternative — `evidence-admin.html` loading `evidence.js` as an
  external script — was rejected on purpose: it would make the admin
  tool depend on a sibling file to even open (no longer "one tool"), and
  would ship Grade 2's `fetch()`-capable code into a page that should
  never be able to make a network call in the first place.
- **`scripts/evidence-cli.js`** replaces `generate-org-keypair.js` and
  `reference-org-signer.js` with one script, two subcommands (`keygen`,
  `serve`).

## The all-in-one build

`../eace-compliance-tasting-menu-all-in-one.html` is a separate, single-file
distribution: the Portable Edition's engine plus a **base64-embedded copy**
of this directory's `evidence.js` and `evidence-admin.html`, so the whole
product (learner flow, receipt, Evidence Mode, and the admin tool) ships as
one physical file with no `<script src>`/`<link>` to anything else. It does
not load these files — it carries its own copies, inlined — so changes here
do not automatically reach it, and vice versa.

That build is currently **one schema version ahead** of this directory:

- **Evidence schema v2** (this directory is still v1): the evidence object
  and its signed payload gained `completion_status`, `benchmark_type`,
  `benchmark_threshold`, and `benchmark_met`, so a verifier reads pass/fail
  directly instead of inferring it from raw `score`/`total`. For exam mode,
  `benchmark_type` is `'EACE_INTERNAL'` and the threshold is `80`; every
  other mode carries `null` for all three benchmark fields.
- **Receipt v3** (Portable/Web Edition stay v2): the receipt payload gained
  a 10th field, the session's `attempt_id` — the same ID the evidence
  object (if the person opted in) carries — so the two artifacts can be
  shown to correlate to one attempt without either one carrying the other's
  payload (no name added to Evidence, just a shared opaque ID, generated
  once at `startSession()`).
- **Admin tool reachability**: the all-in-one build has no admin
  launcher/dialog/iframe on the learner screen at all. Its embedded admin
  tool opens only via `?mode=admin` on the same URL (a `document.write()`
  full-document swap, deferred to `DOMContentLoaded` so it actually
  replaces the document instead of inserting mid-parse — verified in a real
  browser, not assumed), and "Verify locally" on the result screen opens
  that same URL with `&verify=<token>` in a new tab, which the embedded
  admin document reads from `location.search` to prefill and auto-run.
- The evidence result is also excluded from the learner's own "Print
  completion summary" action; a separate "Print evidence record" button
  toggles a `body.printing-evidence-only` class for its own dedicated
  print pass, cleaned up on the `afterprint` event.
- **Save Progress / Resume Session** — a "Save progress →" button during
  the quiz downloads a JSON snapshot (schema-versioned separately, via
  `SESSION_FILE_VERSION`) of the in-progress attempt: pool/manifest/
  attempt ID, mode/role/sector, the resolved question ID order, answers so
  far, current position, and whether Evidence Mode was opted in — the
  person's name only if they explicitly check "Include my name in the
  saved file" (unchecked by default). Never localStorage/sessionStorage/a
  cookie — the file is the only place this state lives outside memory,
  and only because the person chose to download it. "Resume a saved
  session…" on the welcome screen reads that file back, re-resolves the
  question IDs against this build's live pools (refusing to resume if the
  pool or schema version doesn't match, or if positions/answers are
  internally inconsistent — never guessing), and continues the session
  from exactly where it left off, including the evidence opt-in and
  attempt ID, so a resumed session still produces a receipt and evidence
  record that correlate correctly.
- **Record of Completion** — a `Print Record of Completion →` action,
  separate from both the plain completion summary and the evidence
  print pass, renders a more formal document (name, assessment, score,
  date, pool version, legal baseline, manifest ID, attempt ID, EACE's
  internal benchmark for exam mode, and a plain-text verifier reference
  to the Evidence record if one exists — no QR code, since a correct
  offline QR encoder is real, non-trivial code this build doesn't have,
  and this file's `connect-src 'none'` CSP rules out pulling one in from
  a CDN). Deliberately not called a "Certificate": the AI Act gives EACE
  no authority to certify a person in a regulatory sense, and the
  document says so explicitly in its own disclaimer text. Hidden on the
  same exam-fail path that already withholds the receipt.

If the schema changes again, update **three** copies by hand, not two:
`evidence.js` and `evidence-admin.html` here, and the corresponding
embedded copies (`evidence.js`'s content and `ADMIN_B64`) inside
`eace-compliance-tasting-menu-all-in-one.html`. Nothing generates one from
the other, same trade-off as "One tool, one library" above, one layer up.

## Files in this directory

| File | Role |
|---|---|
| `evidence.js` | Everything the product side needs: schema, SHA-256 hashing, signable-payload construction, encode/decode, attempt ID, device keypair lifecycle, `buildLocalEvidence()`, and the Grade 2 network adapters (`requestTrustedTimestamp`, `requestOrgAttestation`, `upgradeToAttested`) — all off unless explicitly configured. |
| `evidence-admin.html` | Standalone, offline, single-file admin tool — verify a record, or generate the organisation's Grade 2 keypair. See "One tool, one library" above for why its core logic is a deliberate, hand-synced copy rather than a shared import. |
| `demo/` | Generated by `../scripts/build-evidence-demo.js` — a full, working copy of the Web Edition with Evidence Mode wired in, for actual end-to-end testing. Do not hand-edit; re-run the build script. |

Related, in `../scripts/`: `build-evidence-demo.js` (builds `demo/`),
`evidence-cli.js` (keypair generation and the reference Grade 2 server,
via subcommands — test-only, not production code).

## Running the tests

```sh
cd test && npm install    # once
npm run test:evidence
```

`test/evidence-suite.js` covers, end-to-end (real browser via Playwright,
real second process for Grade 2 — not in-process fakes):
attempt ID uniqueness, zero console errors / zero CSP violations during a
Grade 1 session, the question-set hash + manifest cross-check (exam mode),
the ad-hoc mode's correct N/A manifest result, tamper detection (editing
one field post-signing flips the verifier's verdict to fail), and the full
Grade 2 network flow against `scripts/evidence-cli.js serve` — including
confirming the org co-signature itself breaks under tampering. All nine
checks currently pass. It also exercises `evidence-admin.html` directly
(both tabs, real key generation, a real verify pass) — see
`test/evidence-admin-check.js` if you want to run just that part.

`test/evidence-grade2.js` is the standalone Grade 2 test `evidence-suite.js`
shells out to; run it directly against any running `evidence-cli.js serve`
instance if you're iterating on the network adapters specifically.

One bug this end-to-end testing caught that isolated unit tests would not
have: the first implementation included the evidence object's `grade` field
inside the payload the *device* signature covers. Since `grade` changes
from `'local'` to `'attested'` during a Grade 2 upgrade, that made the
device signature unverifiable against the post-upgrade object — a real
correctness bug, only visible when a full upgrade → re-verify round trip
was actually exercised against a second, independent process. Fixed by
moving `grade`/`timestamp_trust`/`tsa` out of the device-signed payload and
into the org-signed one instead, where they're supposed to change — see
`evidence.js`'s comment on `signablePayload()` for the full reasoning.

The all-in-one build (see "The all-in-one build" above) has its own
end-to-end checks, run directly against it rather than through
`npm run test:evidence`:

```sh
cd test
node run.js ../eace-compliance-tasting-menu-all-in-one.html   # full mode × track × sector regression
node test-fix5-fields.js                                       # completion_status/benchmark_* fields, real exam + pulse sessions
node test-save-resume-record.js                                 # Save Progress, Resume Session, Record of Completion
```

`run.js` decodes whichever receipt shape it's actually handed
(`receipt_version` `v2` = 9 fields, no `attempt_id`; `v3` = 10 fields, with
it) rather than assuming a single global field count, since the Portable
and Web Editions are still on v2 and the all-in-one build is on v3.
