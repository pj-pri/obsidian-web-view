const path = require('path');
const { sendJson } = require('./utils');
const { handle: handleFiles } = require('./files');
const { handle: handleSearch } = require('./search');
const { handle: handleAttachments } = require('./attachments');

function getVaultRoot() {
  const configured = process.env.OBSIDIAN_VAULT_DIR || process.env.VAULT_DIR;
  return configured ? path.resolve(configured) : null;
}

function wrap(asyncFn) {
  return (...args) => asyncFn(...args).catch(err => {
    const [req, res] = args;
    console.error('[vault-api]', err);
    if (!res.headersSent) sendJson(req, res, 500, { error: err.message || 'Internal error' });
  });
}

/**
 * Returns true if the request was handled (regardless of outcome).
 * Called from server.js before static file handling.
 */
function handleVaultApi(req, res, pathname) {
  if (!pathname.startsWith('/api/vault')) return false;

  // CORS preflight for all API routes
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  const vaultRoot = getVaultRoot();
  if (!vaultRoot) {
    sendJson(req, res, 503, {
      error: 'Vault directory not configured. Set OBSIDIAN_VAULT_DIR before starting the server.',
    });
    return true;
  }

  const sub = pathname.slice('/api/vault'.length); // e.g. '', '/files', '/files/note.md', '/search', '/attachments/img.png'

  // /api/vault/files[/path]
  if (sub === '/files' || sub.startsWith('/files/')) {
    const encoded = sub.slice('/files'.length); // '' or '/folder/note.md'
    let fileRelPath = null;
    if (encoded && encoded !== '/') {
      try { fileRelPath = decodeURIComponent(encoded.replace(/^\//, '')); }
      catch { sendJson(req, res, 400, { error: 'Invalid path encoding' }); return true; }
    }
    wrap(handleFiles)(req, res, fileRelPath, vaultRoot);
    return true;
  }

  // /api/vault/search
  if (sub === '/search' || sub.startsWith('/search?')) {
    wrap(handleSearch)(req, res, req.url, vaultRoot);
    return true;
  }

  // /api/vault/attachments[/filename]
  if (sub === '/attachments' || sub.startsWith('/attachments/')) {
    const encoded = sub.slice('/attachments'.length);
    let attRelPath = null;
    if (encoded && encoded !== '/') {
      try { attRelPath = decodeURIComponent(encoded.replace(/^\//, '')); }
      catch { sendJson(req, res, 400, { error: 'Invalid path encoding' }); return true; }
    }
    wrap(handleAttachments)(req, res, attRelPath, vaultRoot);
    return true;
  }

  // Legacy: /api/vault — return full vault snapshot for backwards compatibility
  if (sub === '' || sub === '/') {
    wrap(legacySnapshot)(req, res, vaultRoot);
    return true;
  }

  return false;
}

async function legacySnapshot(req, res, vaultRoot) {
  const fsp = require('fs').promises;
  const { walkVault } = require('./files');
  const list = await walkVault(vaultRoot, vaultRoot);
  const files = {};
  for (const f of list) {
    files[f.path] = await fsp.readFile(require('path').join(vaultRoot, f.path), 'utf8').catch(() => '');
  }
  const paths = Object.keys(files).sort();
  sendJson(req, res, 200, {
    root: vaultRoot,
    fileCount: paths.length,
    defaultFile: paths.includes('Welcome.md') ? 'Welcome.md' : (paths[0] || null),
    files,
  });
}

module.exports = { getVaultRoot, handleVaultApi };
