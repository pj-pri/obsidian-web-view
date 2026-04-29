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
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || '';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || '';
const BASIC_AUTH_REALM = process.env.BASIC_AUTH_REALM || 'Obsidian Web Vault';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300;
const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 10 * 60_000;
const AUTH_RATE_LIMIT_MAX_FAILURES = Number(process.env.AUTH_RATE_LIMIT_MAX_FAILURES) || 10;
const SECURITY_HEADERS_ENABLED = process.env.SECURITY_HEADERS_ENABLED !== 'false';

const requestBuckets = new Map();
const authFailureBuckets = new Map();

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

function isAuthEnabled() {
  return !!(BASIC_AUTH_USER && BASIC_AUTH_PASSWORD);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function pruneBucketStore(store, now) {
  for (const [key, bucket] of store.entries()) {
    if (!bucket || bucket.resetAt <= now) store.delete(key);
  }
}

function checkRateLimit(store, key, limit, windowMs, now = Date.now()) {
  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

function setRateLimitHeaders(res, limit, result) {
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(result.remaining));
  res.setHeader('RateLimit-Reset', String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))));
}

function applySecurityHeaders(res) {
  if (!SECURITY_HEADERS_ENABLED) return;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://cdnjs.cloudflare.com data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
  ].join('; '));
}

function sendRateLimited(res, retrySeconds, message = 'Too many requests') {
  res.setHeader('Retry-After', String(Math.max(1, retrySeconds)));
  res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify({ error: message }));
}

function logSecurityEvent(level, event, details = {}) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...details,
  };
  const line = `[security] ${JSON.stringify(payload)}`;
  if (level === 'warn') console.warn(line);
  else console.log(line);
}

function sendAuthChallenge(res) {
  res.writeHead(401, {
    'Content-Type': 'text/plain; charset=utf-8',
    'WWW-Authenticate': `Basic realm="${BASIC_AUTH_REALM.replace(/"/g, '\\"')}", charset="UTF-8"`,
    'Cache-Control': 'no-cache',
  });
  res.end('Authentication required');
}

function isAuthorized(req) {
  if (!isAuthEnabled() || req.method === 'OPTIONS') return true;
  const header = req.headers.authorization || '';
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return false;

  let decoded;
  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8');
  } catch {
    return false;
  }

  const sepIndex = decoded.indexOf(':');
  if (sepIndex === -1) return false;
  const user = decoded.slice(0, sepIndex);
  const password = decoded.slice(sepIndex + 1);
  return user === BASIC_AUTH_USER && password === BASIC_AUTH_PASSWORD;
}

const server = http.createServer((req, res) => {
  applySecurityHeaders(res);

  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  const now = Date.now();
  if (requestBuckets.size > 1000 || authFailureBuckets.size > 1000) {
    pruneBucketStore(requestBuckets, now);
    pruneBucketStore(authFailureBuckets, now);
  }

  const clientIp = getClientIp(req);
  const requestRate = checkRateLimit(requestBuckets, clientIp, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS, now);
  setRateLimitHeaders(res, RATE_LIMIT_MAX_REQUESTS, requestRate);
  if (!requestRate.allowed) {
    logSecurityEvent('warn', 'rate_limit', {
      scope: 'request',
      ip: clientIp,
      method: req.method,
      path: pathname,
      retryAfterSec: Math.ceil((requestRate.resetAt - now) / 1000),
    });
    sendRateLimited(res, Math.ceil((requestRate.resetAt - now) / 1000));
    return;
  }

  if (!isAuthorized(req)) {
    const authRate = checkRateLimit(authFailureBuckets, clientIp, AUTH_RATE_LIMIT_MAX_FAILURES, AUTH_RATE_LIMIT_WINDOW_MS, now);
    setRateLimitHeaders(res, AUTH_RATE_LIMIT_MAX_FAILURES, authRate);
    if (!authRate.allowed) {
      logSecurityEvent('warn', 'rate_limit', {
        scope: 'auth',
        ip: clientIp,
        method: req.method,
        path: pathname,
        retryAfterSec: Math.ceil((authRate.resetAt - now) / 1000),
      });
      sendRateLimited(res, Math.ceil((authRate.resetAt - now) / 1000), 'Too many authentication attempts');
      return;
    }
    logSecurityEvent('warn', 'auth_failed', {
      ip: clientIp,
      method: req.method,
      path: pathname,
      remainingFailures: authRate.remaining,
    });
    sendAuthChallenge(res);
    return;
  }

  authFailureBuckets.delete(clientIp);

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
  if (isAuthEnabled()) {
    console.log(`Basic Auth: enabled (${BASIC_AUTH_USER})`);
  } else if (BASIC_AUTH_USER || BASIC_AUTH_PASSWORD) {
    console.warn('Basic Auth: disabled because BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must both be set.');
  }
  console.log(`Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests / ${Math.round(RATE_LIMIT_WINDOW_MS / 1000)}s per IP`);
  if (isAuthEnabled()) {
    console.log(`Auth failures: ${AUTH_RATE_LIMIT_MAX_FAILURES} attempts / ${Math.round(AUTH_RATE_LIMIT_WINDOW_MS / 1000)}s per IP`);
  }
  const vaultRoot = getVaultRoot();
  if (vaultRoot) {
    console.log(`Vault API: http://localhost:${PORT}/api/vault`);
    console.log(`Vault root: ${vaultRoot}`);
  }
});
