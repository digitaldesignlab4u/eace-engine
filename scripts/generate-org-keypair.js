#!/usr/bin/env node
/**
 * CLI convenience version of eace-compliance-tasting-menu-evidence/keygen.html
 * — for testing/automation. For actual production use by HR/IT, prefer
 * keygen.html (matches the product's own browser-only philosophy and needs
 * no Node install); this script exists so the Grade 2 flow can be tested
 * end-to-end without a browser.
 *
 * Usage: node scripts/generate-org-keypair.js > org-keypair.json
 *   (then keep org-keypair.json secret — see reference-org-signer.js)
 */
async function main() {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  console.log(JSON.stringify({ publicKey, privateKey }, null, 2));
}
main();
