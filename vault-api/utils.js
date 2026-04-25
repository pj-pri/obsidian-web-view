const path = require('path');

function sendJson(req, res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Resolve a relative vault path to an absolute path, blocking traversal. Returns null on invalid input. */
function safeJoin(vaultRoot, relPath) {
  let decoded;
  try {
    decoded = decodeURIComponent((relPath || '').replace(/^\/+/, ''));
  } catch {
    return null;
  }
  if (!decoded) return vaultRoot;
  const normalized = path.normalize(decoded);
  const abs = path.resolve(vaultRoot, normalized);
  const rel = path.relative(vaultRoot, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return abs;
}

async function exists(absPath) {
  const fsp = require('fs').promises;
  try { await fsp.access(absPath); return true; } catch { return false; }
}

function parseJsonBody(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

module.exports = { sendJson, readBody, safeJoin, exists, parseJsonBody };
