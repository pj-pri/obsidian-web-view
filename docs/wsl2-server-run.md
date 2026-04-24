# Running The Server In WSL2

## Purpose

This project runs as a small Node server.

The same server can do two things:

- serve the frontend
- expose `GET /api/vault` when a vault directory is configured

## Prerequisites

- WSL2 with Node installed
- this repo checked out inside WSL
- optionally, an Obsidian vault path accessible from WSL

Check Node:

```bash
node -v
```

## Start the frontend only

If you just want the UI with sample data or local session data:

```bash
cd /home/ubuntu/test/obsidian-web-view
PORT=3002 node server.js
```

Open:

- `http://localhost:3002/`

## Start the frontend with live vault API

If you want the same server to also return real markdown files from a vault:

```bash
cd /home/ubuntu/test/obsidian-web-view
OBSIDIAN_VAULT_DIR="/path/to/your/vault" PORT=3002 node server.js
```

Open:

- frontend: `http://localhost:3002/`
- API: `http://localhost:3002/api/vault`

## Run the API as a separate service later

The frontend is already prepared for this.

If the API moves to another project or port:

1. Run that API service separately
2. Keep a compatible `GET /api/vault` response
3. Update [config.js](/home/ubuntu/test/obsidian-web-view/config.js:1)

Example:

```js
window.OBSIDIAN_WEB_VAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:4010',
};
```

Then:

- frontend: `http://localhost:3002/`
- external API: `http://localhost:4010/api/vault`

See also [rest-api-integration.md](/home/ubuntu/test/obsidian-web-view/docs/rest-api-integration.md:1).

## Stop the server

If it is running in the current terminal:

```bash
Ctrl+C
```

If you started it in the background and need to find the process:

```bash
ss -ltnp | rg ':3002\b'
```

## WSL2 notes

### 1. Use WSL paths, not Windows paths

Prefer:

```bash
OBSIDIAN_VAULT_DIR="/mnt/c/Users/<you>/Documents/MyVault"
```

Not:

```bash
OBSIDIAN_VAULT_DIR="C:\Users\<you>\Documents\MyVault"
```

This server runs inside Linux, so it must receive a Linux-visible path.

### 2. Windows browser access should use `localhost`

In normal WSL2 usage, if the server listens on `3002` inside WSL, Windows can usually open:

- `http://localhost:3002/`

If that fails, verify the server is actually running in your own WSL terminal and not inside some isolated tool session.

### 3. Port conflicts are easy to miss

If `3002` is already in use, the server will fail to start.

Check:

```bash
ss -ltnp | rg ':3002\b'
```

If needed, pick another port:

```bash
PORT=3003 node server.js
```

### 4. API and frontend origin matter

If the API is moved to another port or project, the browser is making a cross-origin request.

That means:

- `config.js` must point to the API origin
- the API must allow CORS

The bundled `vault-api/index.js` already returns:

- `Access-Control-Allow-Origin: *`

### 5. This project is currently read-only for live vault files

The API reads markdown files from disk and returns them to the frontend.

It does not write changes back to the Obsidian vault yet.

### 6. Hidden folders are skipped

The current API ignores:

- `.obsidian`
- `.git`
- `node_modules`
- hidden directories beginning with `.`

This is intentional to avoid pulling app metadata and unrelated files into the note tree.

## Quick smoke test

After starting the server with a live vault:

```bash
curl -s http://127.0.0.1:3002/api/vault
```

You should see JSON with:

- `files`
- `defaultFile`
- `fileCount`
