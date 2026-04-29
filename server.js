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
const crypto = require('crypto');
const { URL } = require('url');
const { getVaultRoot, handleVaultApi } = require('./vault-api/index.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const DEFAULT_FILE = 'Obsidian Web Vault.html';
const APP_LOGIN_USER = process.env.APP_LOGIN_USER || '';
const APP_LOGIN_PASSWORD = process.env.APP_LOGIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'owv_session';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 7 * 24 * 60 * 60_000;
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
const sessions = new Map();

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

function isSessionAuthEnabled() {
  return !!(APP_LOGIN_USER && APP_LOGIN_PASSWORD && SESSION_SECRET);
}

function isBasicAuthEnabled() {
  return !isSessionAuthEnabled() && !!(BASIC_AUTH_USER && BASIC_AUTH_PASSWORD);
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

function pruneSessions(now) {
  for (const [sid, session] of sessions.entries()) {
    if (!session || session.expiresAt <= now) sessions.delete(sid);
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function signSessionId(sessionId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
}

function encodeSessionToken(sessionId) {
  return `${sessionId}.${signSessionId(sessionId)}`;
}

function decodeSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const sessionId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!sessionId || !signature) return null;
  const expected = signSessionId(sessionId);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;
  return sessionId;
}

function createSession(username, now = Date.now()) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const expiresAt = now + SESSION_TTL_MS;
  sessions.set(sessionId, { username, expiresAt });
  return { token: encodeSessionToken(sessionId), expiresAt };
}

function getSession(req, now = Date.now()) {
  if (!isSessionAuthEnabled()) return null;
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  const sessionId = decodeSessionToken(token);
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= now) {
    sessions.delete(sessionId);
    return null;
  }
  session.expiresAt = now + SESSION_TTL_MS;
  return { sessionId, ...session };
}

function setSessionCookie(res, token, expiresAt) {
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(1, Math.floor((expiresAt - Date.now()) / 1000))}`,
  ];
  res.setHeader('Set-Cookie', cookie.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
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

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(payload));
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

function sendUnauthorizedJson(res) {
  sendJson(res, 401, { error: 'Authentication required' });
}

function isAuthorizedByBasicAuth(req) {
  if (!isBasicAuthEnabled() || req.method === 'OPTIONS') return true;
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

async function handleAuthApi(req, res, pathname, clientIp, now) {
  if (!pathname.startsWith('/api/auth')) return false;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  if (pathname === '/api/auth/session' && req.method === 'GET') {
    const session = getSession(req, now);
    sendJson(res, 200, {
      enabled: isSessionAuthEnabled(),
      mode: isSessionAuthEnabled() ? 'session' : isBasicAuthEnabled() ? 'basic' : 'none',
      authenticated: !!session || !isSessionAuthEnabled(),
      username: session?.username || (isBasicAuthEnabled() ? BASIC_AUTH_USER : null),
    });
    return true;
  }

  if (!isSessionAuthEnabled()) {
    sendJson(res, 404, { error: 'Session login is not enabled' });
    return true;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return true;
    }

    const username = String(body.username || '');
    const password = String(body.password || '');
    if (username !== APP_LOGIN_USER || password !== APP_LOGIN_PASSWORD) {
      const authRate = checkRateLimit(authFailureBuckets, clientIp, AUTH_RATE_LIMIT_MAX_FAILURES, AUTH_RATE_LIMIT_WINDOW_MS, now);
      setRateLimitHeaders(res, AUTH_RATE_LIMIT_MAX_FAILURES, authRate);
      if (!authRate.allowed) {
        logSecurityEvent('warn', 'rate_limit', {
          scope: 'login',
          ip: clientIp,
          method: req.method,
          path: pathname,
          retryAfterSec: Math.ceil((authRate.resetAt - now) / 1000),
        });
        sendRateLimited(res, Math.ceil((authRate.resetAt - now) / 1000), 'Too many login attempts');
        return true;
      }
      logSecurityEvent('warn', 'login_failed', {
        ip: clientIp,
        method: req.method,
        path: pathname,
        remainingFailures: authRate.remaining,
      });
      sendJson(res, 401, { error: 'Invalid credentials' });
      return true;
    }

    authFailureBuckets.delete(clientIp);
    const session = createSession(APP_LOGIN_USER, now);
    setSessionCookie(res, session.token, session.expiresAt);
    logSecurityEvent('info', 'login_success', {
      ip: clientIp,
      method: req.method,
      path: pathname,
      username: APP_LOGIN_USER,
    });
    sendJson(res, 200, { ok: true, username: APP_LOGIN_USER });
    return true;
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const session = getSession(req, now);
    if (session?.sessionId) sessions.delete(session.sessionId);
    clearSessionCookie(res);
    logSecurityEvent('info', 'logout', {
      ip: clientIp,
      method: req.method,
      path: pathname,
      username: session?.username || null,
    });
    sendJson(res, 200, { ok: true });
    return true;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
  return true;
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
  if (requestBuckets.size > 1000 || authFailureBuckets.size > 1000 || sessions.size > 1000) {
    pruneBucketStore(requestBuckets, now);
    pruneBucketStore(authFailureBuckets, now);
    pruneSessions(now);
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

  if (pathname.startsWith('/api/auth')) {
    Promise.resolve(handleAuthApi(req, res, pathname, clientIp, now)).catch((error) => {
      console.error('[auth-api]', error);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal error' });
    });
    return;
  }

  if (isBasicAuthEnabled()) {
    if (!isAuthorizedByBasicAuth(req)) {
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
  }

  if (isSessionAuthEnabled() && pathname.startsWith('/api/')) {
    const session = getSession(req, now);
    if (!session) {
      sendUnauthorizedJson(res);
      return;
    }
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
  if (isSessionAuthEnabled()) {
    console.log(`Session login: enabled (${APP_LOGIN_USER})`);
  } else if (APP_LOGIN_USER || APP_LOGIN_PASSWORD || SESSION_SECRET) {
    console.warn('Session login: disabled because APP_LOGIN_USER, APP_LOGIN_PASSWORD, and SESSION_SECRET must all be set.');
  }
  if (isBasicAuthEnabled()) {
    console.log(`Basic Auth: enabled (${BASIC_AUTH_USER})`);
  } else if (!isSessionAuthEnabled() && (BASIC_AUTH_USER || BASIC_AUTH_PASSWORD)) {
    console.warn('Basic Auth: disabled because BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must both be set.');
  } else if (isSessionAuthEnabled() && (BASIC_AUTH_USER || BASIC_AUTH_PASSWORD)) {
    console.warn('Basic Auth: ignored because session login is enabled.');
  }
  console.log(`Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests / ${Math.round(RATE_LIMIT_WINDOW_MS / 1000)}s per IP`);
  if (isSessionAuthEnabled() || isBasicAuthEnabled()) {
    console.log(`Auth failures: ${AUTH_RATE_LIMIT_MAX_FAILURES} attempts / ${Math.round(AUTH_RATE_LIMIT_WINDOW_MS / 1000)}s per IP`);
  }
  const vaultRoot = getVaultRoot();
  if (vaultRoot) {
    console.log(`Vault API: http://localhost:${PORT}/api/vault`);
    console.log(`Vault root: ${vaultRoot}`);
  }
});
