/**
 * Minimal static file server, reusable by any test runner that needs a
 * real http(s) origin (CSP / same-origin script loading doesn't apply
 * correctly under file://). Exports startServer(dir, port) -> {server, url},
 * with a close() that actually releases the port before resolving.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

function startServer(dir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(dir, reqPath);
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(port, () => resolve({
      server,
      url: `http://localhost:${port}/`,
      close: () => new Promise((res) => server.close(res))
    }));
  });
}

module.exports = { startServer };
