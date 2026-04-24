# REST API Integration

## Purpose

The frontend can load markdown notes from either:

- the same project, via the local Node server
- a different project or service that exposes the same REST endpoint

The integration point is a single `GET /api/vault` request.

## Frontend configuration

The frontend reads `window.OBSIDIAN_WEB_VAULT_CONFIG.apiBaseUrl` from [config.js](/home/ubuntu/test/obsidian-web-view/config.js:1).

Default:

```js
window.OBSIDIAN_WEB_VAULT_CONFIG = {
  apiBaseUrl: '',
};
```

Meaning:

- `''` means same-origin, so the frontend calls `/api/vault` on the same host/port as the page
- `'http://localhost:4010'` means the frontend calls `http://localhost:4010/api/vault`

Example for a separate API project:

```js
window.OBSIDIAN_WEB_VAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:4010',
};
```

## Request/response contract

Request:

```http
GET /api/vault
```

Success response:

```json
{
  "root": "/path/to/vault",
  "fileCount": 2,
  "defaultFile": "Daily/Today.md",
  "files": {
    "Daily/Today.md": "# Today\n\n#journal\n",
    "Root.md": "# Root note\n\nSee [[Daily/Today]].\n"
  }
}
```

Required fields:

- `files`: object keyed by vault-relative markdown path
- `defaultFile`: initial file to open, or `null`

Optional but useful fields:

- `root`: absolute vault path for diagnostics
- `fileCount`: count summary for status/debugging

Error responses should return a non-2xx status plus JSON:

```json
{
  "error": "Vault directory is not configured."
}
```

## How the frontend uses it

The frontend startup flow in [app.jsx](/home/ubuntu/test/obsidian-web-view/app.jsx:324) is:

1. Read `apiBaseUrl` from `window.OBSIDIAN_WEB_VAULT_CONFIG`
2. Build the vault URL as `{apiBaseUrl}/api/vault` or `/api/vault`
3. Fetch the vault snapshot
4. If the response is `200`, initialize the file tree from `files`
5. If the request fails, fall back to local session data or the bundled sample vault

That means the API implementation can move to another project as long as:

- the endpoint path stays `/api/vault`, or the frontend URL builder is updated
- the JSON response shape stays compatible
- CORS allows the frontend origin when using a different host or port

## Same-project mode

Current same-project wiring:

- [server.js](/home/ubuntu/test/obsidian-web-view/server.js:13) serves the static site
- [vault-api/index.js](/home/ubuntu/test/obsidian-web-view/vault-api/index.js:1) handles `/api/vault`

In this mode, keep `apiBaseUrl: ''`.

## Separate-project mode

If you move the API folder into another repo/service:

1. Run that API service on its own port or host
2. Keep a `GET /api/vault` endpoint with the same JSON contract
3. Enable CORS for the frontend origin
4. Set `apiBaseUrl` in [config.js](/home/ubuntu/test/obsidian-web-view/config.js:1) to that service origin

Example:

- frontend: `http://localhost:3002`
- API service: `http://localhost:4010`
- frontend request target: `http://localhost:4010/api/vault`

## Minimal external API requirements

At minimum, an external implementation must do three things:

1. Read markdown files from the target Obsidian vault
2. Return them as `{ [relativePath]: content }`
3. Allow browser access from the frontend origin
