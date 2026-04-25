const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
const { sendJson, readBody, safeJoin, exists, parseJsonBody } = require('./utils');

const IGNORED_DIRS = new Set(['.git', '.obsidian', 'node_modules', '.trash']);

async function walkVault(dir, vaultRoot, result = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name))
        await walkVault(path.join(dir, entry.name), vaultRoot, result);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const abs = path.join(dir, entry.name);
      const stat = await fsp.stat(abs);
      result.push({
        path: path.relative(vaultRoot, abs).split(path.sep).join('/'),
        mtime: stat.mtimeMs,
        size: stat.size,
      });
    }
  }
  return result;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** After renaming oldRelPath → newRelPath, update [[wikilink]] refs in all vault .md files. */
async function updateWikilinks(vaultRoot, oldRelPath, newRelPath) {
  const oldBasename = path.basename(oldRelPath, '.md');
  const newBasename = path.basename(newRelPath, '.md');
  const oldPathNoExt = oldRelPath.replace(/\.md$/, '');
  const newPathNoExt = newRelPath.replace(/\.md$/, '');

  const files = await walkVault(vaultRoot, vaultRoot);
  const updated = [];

  for (const f of files) {
    const abs = path.join(vaultRoot, f.path);
    let content = await fsp.readFile(abs, 'utf8');
    let changed = false;

    // Replace [[full/path]] references
    if (oldPathNoExt !== newPathNoExt) {
      const reFullPath = new RegExp(`\\[\\[${escapeRegex(oldPathNoExt)}(\\|[^\\]]*)?\\]\\]`, 'g');
      const next = content.replace(reFullPath, (_, alias) => `[[${newPathNoExt}${alias || ''}]]`);
      if (next !== content) { content = next; changed = true; }
    }

    // Replace [[basename]] references (only when basename actually changed)
    if (oldBasename !== newBasename) {
      const reBase = new RegExp(`\\[\\[${escapeRegex(oldBasename)}(\\|[^\\]]*)?\\]\\]`, 'g');
      const next = content.replace(reBase, (_, alias) => `[[${newBasename}${alias || ''}]]`);
      if (next !== content) { content = next; changed = true; }
    }

    if (changed) {
      await fsp.writeFile(abs, content, 'utf8');
      updated.push(f.path);
    }
  }

  return updated;
}

async function handle(req, res, fileRelPath, vaultRoot) {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // GET /api/vault/files — list all files (metadata only)
  if (!fileRelPath) {
    if (req.method !== 'GET' && req.method !== 'HEAD')
      return sendJson(req, res, 405, { error: 'Method not allowed' });
    const files = await walkVault(vaultRoot, vaultRoot);
    return sendJson(req, res, 200, { files });
  }

  const abs = safeJoin(vaultRoot, fileRelPath);
  if (!abs) return sendJson(req, res, 400, { error: 'Invalid path' });

  // GET /api/vault/files/:path — read single file
  if (req.method === 'GET' || req.method === 'HEAD') {
    let content;
    try { content = await fsp.readFile(abs, 'utf8'); }
    catch { return sendJson(req, res, 404, { error: 'Not found' }); }
    return sendJson(req, res, 200, { path: fileRelPath, content });
  }

  // POST /api/vault/files/:path — create (fail if exists)
  if (req.method === 'POST') {
    if (await exists(abs)) return sendJson(req, res, 409, { error: 'Already exists' });
    const body = parseJsonBody(await readBody(req));
    if (!body) return sendJson(req, res, 400, { error: 'Invalid JSON' });
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, body.content ?? '', 'utf8');
    return sendJson(req, res, 201, { path: fileRelPath });
  }

  // PUT /api/vault/files/:path — upsert
  if (req.method === 'PUT') {
    const body = parseJsonBody(await readBody(req));
    if (!body) return sendJson(req, res, 400, { error: 'Invalid JSON' });
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, body.content ?? '', 'utf8');
    return sendJson(req, res, 200, { path: fileRelPath });
  }

  // PATCH /api/vault/files/:path — rename/move + wikilink update
  if (req.method === 'PATCH') {
    const body = parseJsonBody(await readBody(req));
    if (!body || !body.newPath) return sendJson(req, res, 400, { error: 'newPath required' });
    const newAbs = safeJoin(vaultRoot, body.newPath);
    if (!newAbs) return sendJson(req, res, 400, { error: 'Invalid newPath' });
    if (!await exists(abs)) return sendJson(req, res, 404, { error: 'Not found' });
    if (await exists(newAbs)) return sendJson(req, res, 409, { error: 'Target already exists' });
    await fsp.mkdir(path.dirname(newAbs), { recursive: true });
    await fsp.rename(abs, newAbs);
    const updatedRefs = await updateWikilinks(vaultRoot, fileRelPath, body.newPath);
    return sendJson(req, res, 200, { path: body.newPath, updatedRefs });
  }

  // DELETE /api/vault/files/:path — move to .trash/
  if (req.method === 'DELETE') {
    if (!await exists(abs)) return sendJson(req, res, 404, { error: 'Not found' });
    const trashDir = path.join(vaultRoot, '.trash');
    await fsp.mkdir(trashDir, { recursive: true });
    let dest = path.join(trashDir, path.basename(abs));
    if (await exists(dest)) {
      const ext = path.extname(dest);
      const base = path.basename(dest, ext);
      let i = 1;
      while (await exists(path.join(trashDir, `${base}.${i}${ext}`))) i++;
      dest = path.join(trashDir, `${base}.${i}${ext}`);
    }
    await fsp.rename(abs, dest);
    return sendJson(req, res, 200, { trashed: path.basename(dest) });
  }

  return sendJson(req, res, 405, { error: 'Method not allowed' });
}

module.exports = { handle, walkVault };
