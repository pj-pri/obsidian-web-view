const fs = require('fs');
const path = require('path');

const fsp = fs.promises;
const IGNORED_DIRS = new Set(['.git', '.obsidian', 'node_modules']);

function getVaultRoot() {
  const configured = process.env.OBSIDIAN_VAULT_DIR || process.env.VAULT_DIR;
  return configured ? path.resolve(configured) : null;
}

async function buildVaultFiles(dirPath, vaultRoot, files) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue;
      await buildVaultFiles(path.join(dirPath, entry.name), vaultRoot, files);
      continue;
    }
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
    const abs = path.join(dirPath, entry.name);
    const rel = path.relative(vaultRoot, abs).split(path.sep).join('/');
    files[rel] = await fsp.readFile(abs, 'utf8');
  }
}

async function readVaultSnapshot() {
  const vaultRoot = getVaultRoot();
  if (!vaultRoot) {
    return {
      status: 404,
      body: {
        error: 'Vault directory is not configured. Set OBSIDIAN_VAULT_DIR or VAULT_DIR before starting the server.',
      },
    };
  }

  let stat;
  try {
    stat = await fsp.stat(vaultRoot);
  } catch (error) {
    return {
      status: 404,
      body: {
        error: `Vault directory not found: ${vaultRoot}`,
      },
    };
  }

  if (!stat.isDirectory()) {
    return {
      status: 400,
      body: {
        error: `Vault path is not a directory: ${vaultRoot}`,
      },
    };
  }

  const files = {};
  await buildVaultFiles(vaultRoot, vaultRoot, files);
  const paths = Object.keys(files).sort();
  return {
    status: 200,
    body: {
      root: vaultRoot,
      fileCount: paths.length,
      defaultFile: paths.includes('Welcome.md') ? 'Welcome.md' : (paths[0] || null),
      files,
    },
  };
}

function sendJson(req, res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

function handleVaultApi(req, res, pathname) {
  if (pathname !== '/api/vault') return false;

  void readVaultSnapshot()
    .then(({ status, body }) => sendJson(req, res, status, body))
    .catch((error) => {
      sendJson(req, res, 500, {
        error: error && error.message ? error.message : 'Failed to read vault',
      });
    });

  return true;
}

module.exports = {
  getVaultRoot,
  handleVaultApi,
};
