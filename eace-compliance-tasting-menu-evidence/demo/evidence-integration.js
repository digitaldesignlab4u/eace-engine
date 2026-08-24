/* ═══════════════════════════════════════════════════
   EACE.ai — Evidence Mode — demo integration glue
   Listens for the `eace:session-complete` event (dispatched by the three
   EVIDENCE MODE HOOK lines in this demo's app.js — see ../README.md) and, if
   the person opted in on the welcome screen, builds a Grade 1 (Local
   Evidence) record and renders it in its own clearly-separated panel,
   distinct from the completion receipt above it. This file is entirely
   demo/UI glue — all the actual evidence logic lives in evidence.js, which
   knows nothing about this page's DOM.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const panel = document.getElementById('evidence-panel');
  const checkbox = document.getElementById('in-evidence');

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderEvidence(evidence, token) {
    panel.className = 'card evidence-panel';
    panel.innerHTML =
      '<div class="evidence-eyebrow">Evidence Mode — Grade 1: Local Evidence</div>' +
      '<p class="hint">This is a SEPARATE, stronger artifact from the completion receipt above — not a replacement for it, and not itself an unconditional audit record. It proves the record below has not been altered since this device signed it. ' +
      '<strong>It does not prove your organisation attested to this session, and its timestamp is not independently verifiable</strong> — see what each field does and does not claim in evidence-admin.html.</p>' +
      '<div class="evidence-meta">' +
        '<div><span class="meta-label">Attempt ID</span>' + esc(evidence.attempt_id) + '</div>' +
        '<div><span class="meta-label">Question-set hash</span>' + esc(evidence.question_set_hash.slice(0, 24)) + '…</div>' +
        '<div><span class="meta-label">Device key ID</span>' + esc(evidence.device_key_id) + '</div>' +
        '<div><span class="meta-label">Timestamp trust</span>' + esc(evidence.timestamp_trust) + ' (local device clock — not independently verifiable)</div>' +
      '</div>' +
      '<label class="label-mt-sm">Evidence token</label>' +
      '<div class="token-box" id="evidence-token-out"></div>' +
      '<p class="hint">Paste this into evidence-admin.html\'s Verify Evidence tab to check the question-set hash, the score-vs-answers consistency, and the device signature.</p>' +
      '<div class="evidence-upgrade">' +
        '<div class="evidence-eyebrow evidence-eyebrow-dim">Grade 2 — Attested Evidence (not available in this demo)</div>' +
        '<p class="hint">Adding an organisation co-signature and a trusted timestamp genuinely requires a network call to something this browser does not control — that is a real change to this product\'s local-first architecture, not a missing feature of this demo. See README.md\'s "Grade 2 requires leaving local-first" section for the exact trade-off and what deploying it would involve.</p>' +
      '</div>';
    document.getElementById('evidence-token-out').textContent = token;
  }

  document.addEventListener('eace:session-complete', function (evt) {
    if (!checkbox || !checkbox.checked) return; // opted out — no evidence object, no localStorage device key ever created
    if (typeof EvidenceMode === 'undefined') {
      console.error('Evidence Mode scripts did not load — evidence.js missing?');
      return;
    }
    EvidenceMode.buildLocalEvidence(Object.assign({ build: 'evidence-demo' }, evt.detail))
      .then(function (evidence) {
        const token = EvidenceCore.encodeEvidenceToken(evidence);
        renderEvidence(evidence, token);
      })
      .catch(function (e) {
        console.error('Evidence Mode: failed to build local evidence record:', e);
        panel.className = 'card evidence-panel';
        panel.innerHTML = '<div class="evidence-eyebrow">Evidence Mode</div><p class="hint">Could not build an evidence record: ' + esc(e.message) + '</p>';
      });
  });
})();
