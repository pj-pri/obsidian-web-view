# Vault API Module

This folder contains the markdown-vault REST API logic.

Current entrypoint:

- [index.js](/home/ubuntu/test/obsidian-web-view/vault-api/index.js:1)

Current route contract:

- `GET /api/vault`

To move this into another project:

1. Copy this folder
2. Mount `handleVaultApi(req, res, pathname)` in that server
3. Preserve the JSON response shape
4. Allow the frontend origin via CORS
5. Point the frontend `apiBaseUrl` to that server

Detailed integration notes live in [docs/rest-api-integration.md](/home/ubuntu/test/obsidian-web-view/docs/rest-api-integration.md:1).
