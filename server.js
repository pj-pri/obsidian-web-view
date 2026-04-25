/**
 * Local static server (Node, no dependencies).
 * Usage: node server.js
 *   PORT=8080 node server.js  (Unix)
 *   OBSIDIAN_VAULT_DIR=/path/to/vault PORT=8080 node server.js
 *   set PORT=8080&& node server.js  (Windows cmd)
 *
 * .env file is loaded automatically if present.
 */

// Load .env if present (no external deps)
try {
  const lines = require('fs').readFileSync(require('path').join(__dirname, '.env'), 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { getVaultRoot, handleVaultApi } = require('./vault-api/index.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const DEFAULT_FILE = 'Obsidian Web Vault.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Map URL path to absolute file path under ROOT, or null if invalid / traversal */
function safeResolve(urlPathname) {
  let decoded;
  try {
    decoded = decodeURIComponent((urlPathname || '').split('?')[0] || '');
  } catch {
    return null;
  }
  const rel = decoded.replace(/^[\\/]+/, '');
  if (!rel) return path.resolve(ROOT);
  const normalized = path.normalize(rel);
  const abs = path.resolve(ROOT, normalized);
  const rootResolved = path.resolve(ROOT);
  const relToRoot = path.relative(rootResolved, abs);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  // API routes handle all HTTP methods (POST, PUT, DELETE, PATCH, OPTIONS, etc.)
  if (handleVaultApi(req, res, pathname)) return;

  // Static file serving: GET and HEAD only
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const rel = pathname === '/' || pathname === '' ? DEFAULT_FILE : pathname.replace(/^\/+/, '');
  const filePath = safeResolve(rel);
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad path');
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      fs.stat(index, (e2, st2) => {
        if (!e2 && st2.isFile()) sendFile(req, res, index);
        else listDir(res, filePath);
      });
      return;
    }
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    sendFile(req, res, filePath);
  });
});

function sendFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') {
    stream.destroy();
    res.end();
    return;
  }
  stream.pipe(res);
}

function listDir(res, dirPath) {
  fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error reading directory');
      return;
    }
    const rel = path.relative(ROOT, dirPath) || '.';
    const links = entries
      .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1))
      .map((e) => {
        const name = e.name + (e.isDirectory() ? '/' : '');
        const href = path.posix.join('/', path.relative(ROOT, path.join(dirPath, e.name)).split(path.sep).join('/'));
        return `<li><a href="${href}${e.isDirectory() ? '/' : ''}">${name}</a></li>`;
      })
      .join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${rel}</title></head><body><h1>${rel}</h1><ul>${links}</ul></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

server.listen(PORT, () => {
  console.log(`Static server at http://localhost:${PORT}/`);
  console.log(`Open: http://localhost:${PORT}/${encodeURIComponent(DEFAULT_FILE)}`);
  const vaultRoot = getVaultRoot();
  if (vaultRoot) {
    console.log(`Vault API: http://localhost:${PORT}/api/vault`);
    console.log(`Vault root: ${vaultRoot}`);
  }
});
