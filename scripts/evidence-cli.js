#!/usr/bin/env node
/**
 * EACE.ai Evidence Mode — CLI utilities, merged into subcommands so
 * scripts/ carries one file for this instead of two:
 *
 *   node scripts/evidence-cli.js keygen > org-keypair.json
 *     CLI equivalent of evidence-admin.html's "Generate Organisation Key"
 *     tab — for testing/automation. For actual production use by HR/IT,
 *     prefer evidence-admin.html (matches the product's own browser-only
 *     philosophy, needs no Node install).
 *
 *   node scripts/evidence-cli.js serve --keyfile org-keypair.json --port 8937
 *     REFERENCE implementation of the Grade 2 (Attested Evidence) server
 *     side — POST /tsa and POST /attest, matching evidence.js's
 *     requestTrustedTimestamp()/requestOrgAttestation() contract.
 *
 *     THIS IS NOT PRODUCTION CODE. It exists so the Grade 2 network
 *     contract can be exercised and tested end-to-end (see
 *     test/evidence-grade2.js), and so an organisation building a real
 *     endpoint has a concrete, correct example of the request/response
 *     shape and the signing logic. Before using anything like this for
 *     real:
 *       - Put it behind TLS and authenticate the caller (this reference
 *         server does neither — anyone who can reach it can get evidence
 *         objects signed).
 *       - Decide a real key-custody story (this reads a keypair from a
 *         JSON file on disk in cleartext — fine for a local test, not for
 *         production; use a proper secrets manager or HSM).
 *       - The /tsa endpoint here is NOT an RFC 3161 timestamp authority —
 *         it's a simplified JSON-over-HTTPS timestamp contract that
 *         follows RFC 3161's "only ever sign a hash, never the underlying
 *         content" principle, but does not speak the actual RFC 3161
 *         binary protocol or come from a certificate-audited TSA. If your
 *         organisation needs genuine RFC 3161 interop, point
 *         requestTrustedTimestamp() at a real TSA client instead of this
 *         endpoint — see README.md.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

async function cmdKeygen() {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  console.log(JSON.stringify({ publicKey, privateKey }, null, 2));
}

function parseServeArgs(argv) {
  const args = { port: 8937, keyfile: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') args.port = Number(argv[++i]);
    if (argv[i] === '--keyfile') args.keyfile = argv[++i];
  }
  return args;
}

async function loadOrImportKeypair(keyfile, Core) {
  let jwkPair;
  if (keyfile) {
    jwkPair = JSON.parse(fs.readFileSync(keyfile, 'utf8'));
    console.log('Loaded org keypair from', keyfile);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    jwkPair = {
      publicKey: await crypto.subtle.exportKey('jwk', kp.publicKey),
      privateKey: await crypto.subtle.exportKey('jwk', kp.privateKey)
    };
    console.log('No --keyfile given — generated an EPHEMERAL keypair for this run only (not saved).');
    console.log('Its public key (paste into evidence-admin.html to check attestations from this run):');
    console.log(JSON.stringify(jwkPair.publicKey));
  }
  const privateKey = await crypto.subtle.importKey('jwk', jwkPair.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const orgKeyId = (await Core.sha256Hex(['crv', 'kty', 'x', 'y'].map((k) => k + '=' + jwkPair.publicKey[k]).join('&'))).slice(0, 16);
  return { privateKey, publicKeyJwk: jwkPair.publicKey, orgKeyId };
}

async function signBase64(privateKey, message) {
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(message));
  return Buffer.from(sig).toString('base64');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function cmdServe(argv) {
  const { EvidenceCore: Core } = require(path.join(__dirname, '..', 'eace-compliance-tasting-menu-evidence', 'evidence.js'));
  const args = parseServeArgs(argv);
  const { privateKey, orgKeyId } = await loadOrImportKeypair(args.keyfile, Core);
  console.log('Org key ID:', orgKeyId);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'POST' && req.url === '/tsa') {
        const body = await readJsonBody(req);
        if (!body.hash) { res.writeHead(400); res.end('missing hash'); return; }
        const timestamp = new Date().toISOString();
        const token = await signBase64(privateKey, 'EACE-REF-TSA|' + body.hash + '|' + timestamp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ authority: 'EACE Reference TSA (test-only, not certificate-audited)', token, timestamp }));
        return;
      }

      if (req.method === 'POST' && req.url === '/attest') {
        const body = await readJsonBody(req);
        if (!body.evidence) { res.writeHead(400); res.end('missing evidence'); return; }
        const org_signature = await signBase64(privateKey, Core.orgSignablePayload(body.evidence));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ org_key_id: orgKeyId, org_signature, attested_at: new Date().toISOString() }));
        return;
      }

      res.writeHead(404);
      res.end('not found — this reference server only implements POST /tsa and POST /attest');
    } catch (e) {
      res.writeHead(500);
      res.end('error: ' + e.message);
    }
  });

  server.listen(args.port, () => {
    console.log(`Reference Grade-2 signer listening on http://localhost:${args.port} (POST /tsa, POST /attest)`);
  });
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'keygen') return cmdKeygen();
  if (cmd === 'serve') return cmdServe(rest);
  console.error('Usage:');
  console.error('  node scripts/evidence-cli.js keygen > org-keypair.json');
  console.error('  node scripts/evidence-cli.js serve --keyfile org-keypair.json --port 8937');
  process.exit(1);
}

main();
