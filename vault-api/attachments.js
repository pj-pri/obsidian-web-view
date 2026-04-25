const path = require('path');
const fsp = require('fs').promises;
const fs = require('fs');
const { sendJson, readBody, safeJoin, exists, parseJsonBody } = require('./utils');

const ATTACHMENT_DIR = 'attachments';

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

function attDir(vaultRoot) {
  return path.join(vaultRoot, ATTACHMENT_DIR);
}

async function handle(req, res, attRelPath, vaultRoot) {
  const dir = attDir(vaultRoot);

  // POST /api/vault/attachments — upload (base64 JSON body)
  if (!attRelPath && req.method === 'POST') {
    const body = parseJsonBody(await readBody(req));
    if (!body || !body.filename || !body.data)
      return sendJson(req, res, 400, { error: 'filename and data required' });

    const safeName = path.basename(body.filename).replace(/[^a-zA-Z0-9._\-() ]/g, '_');
    if (!safeName) return sendJson(req, res, 400, { error: 'Invalid filename' });

    await fsp.mkdir(dir, { recursive: true });

    // Handle name collision
    let dest = path.join(dir, safeName);
    if (await exists(dest)) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      let i = 1;
      while (await exists(path.join(dir, `${base}.${i}${ext}`))) i++;
      dest = path.join(dir, `${base}.${i}${ext}`);
    }

    let buf;
    try {
      const dataUrl = body.data;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      buf = Buffer.from(base64, 'base64');
    } catch {
      return sendJson(req, res, 400, { error: 'Invalid base64 data' });
    }

    await fsp.writeFile(dest, buf);
    const relPath = `${ATTACHMENT_DIR}/${path.basename(dest)}`;
    return sendJson(req, res, 201, { path: relPath, filename: path.basename(dest) });
  }

  // GET /api/vault/attachments/:file — serve file
  if (attRelPath && (req.method === 'GET' || req.method === 'HEAD')) {
    const abs = safeJoin(dir, attRelPath);
    if (!abs) return sendJson(req, res, 400, { error: 'Invalid path' });

    let stat;
    try { stat = await fsp.stat(abs); }
    catch { return sendJson(req, res, 404, { error: 'Not found' }); }
    if (!stat.isFile()) return sendJson(req, res, 404, { error: 'Not found' });

    const ext = path.extname(abs).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(abs).pipe(res);
    return;
  }

  return sendJson(req, res, 405, { error: 'Method not allowed' });
}

module.exports = { handle };
