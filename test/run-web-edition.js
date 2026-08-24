#!/usr/bin/env node
/**
 * Runs the regression harness (run.js) against the Enterprise/Web Edition
 * (eace-compliance-tasting-menu-web/). Starts a throwaway static file
 * server (CSP/same-origin script loading needs a real http(s) origin, not
 * file://), points run.js at it, then shuts the server down.
 *
 * Usage: node test/run-web-edition.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WEB_DIR = path.join(__dirname, '..', 'eace-compliance-tasting-menu-web');
const PORT = process.env.WEB_EDITION_TEST_PORT || 8934;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

function main() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(WEB_DIR, reqPath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.listen(PORT, () => {
    // spawn (async), not spawnSync — a synchronous child-process call would
    // block this process's event loop for its entire duration, and the HTTP
    // server above runs on that same event loop. spawnSync here would starve
    // the server of any chance to actually answer the harness's requests
    // (TCP connections get accepted at the OS level but Node never services
    // them), a real deadlock caught by running this end-to-end rather than
    // just reasoning about it.
    const child = spawn(
      process.execPath,
      [path.join(__dirname, 'run.js'), `http://localhost:${PORT}/index.html`],
      { stdio: 'inherit' }
    );
    child.on('exit', (code) => {
      server.close(() => {
        process.exit(code === null ? 1 : code);
      });
    });
  });
}

main();
