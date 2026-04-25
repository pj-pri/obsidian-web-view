FROM node:20-alpine

WORKDIR /app

# Copy application files
COPY app.jsx ./
COPY config.js ./
COPY graph.jsx ./
COPY markdown.js ./
COPY snippets.js ./
COPY styles.css ./
COPY vault-data.js ./
COPY server.js ./
COPY "Obsidian Web Vault.html" ./
COPY vault-api/ ./vault-api/

# Vault is mounted at runtime via OBSIDIAN_VAULT_DIR
# Default port
ENV PORT=5173

EXPOSE 5173

CMD ["node", "server.js"]
