const path = require('path');
const fsp = require('fs').promises;
const { URL } = require('url');
const { sendJson } = require('./utils');
const { walkVault } = require('./files');

async function searchVault(vaultRoot, query) {
  const q = query.toLowerCase();
  const files = await walkVault(vaultRoot, vaultRoot);
  const results = [];

  for (const f of files) {
    const abs = path.join(vaultRoot, f.path);
    const content = await fsp.readFile(abs, 'utf8').catch(() => '');
    const nameMatch = f.path.toLowerCase().includes(q);
    const contexts = [];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        contexts.push({ line: lines[i].trim(), lineNo: i + 1 });
        if (contexts.length >= 3) break;
      }
    }

    if (nameMatch || contexts.length > 0) {
      results.push({ path: f.path, nameMatch, contexts });
    }
  }

  // Sort: name matches first, then by number of context hits
  results.sort((a, b) => {
    if (a.nameMatch !== b.nameMatch) return a.nameMatch ? -1 : 1;
    return b.contexts.length - a.contexts.length;
  });

  return results;
}

async function handle(req, res, reqUrl, vaultRoot) {
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return sendJson(req, res, 405, { error: 'Method not allowed' });

  let q;
  try {
    q = new URL(reqUrl, 'http://localhost').searchParams.get('q') || '';
  } catch {
    q = '';
  }

  if (!q.trim()) return sendJson(req, res, 200, { results: [] });

  const results = await searchVault(vaultRoot, q.trim());
  return sendJson(req, res, 200, { query: q.trim(), results });
}

module.exports = { handle };
