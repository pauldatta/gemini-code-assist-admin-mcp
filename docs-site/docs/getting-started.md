# Quick Start

## Prerequisites

- **Node.js 18+** — for the MCP server itself
- **`gcloud` CLI** — authenticated with an account that has appropriate GCA admin roles
- An AI assistant that supports MCP (Claude Code, Gemini CLI, Cursor, etc.)

!!! tip "Available on npm"
    `gemini-code-assist-admin-mcp` is published on [npmjs.com](https://www.npmjs.com/package/gemini-code-assist-admin-mcp) — no git clone needed.

---

## Option 1 — Interactive setup (recommended)

Run the interactive installer. It auto-detects which AI clients are installed and patches their config:

```bash
npx gemini-code-assist-admin-mcp
```

You'll see a menu like:

```
? Where would you like to add the MCP server? (Use arrow keys)
❯ Claude Code (claude_desktop_config.json)
  Gemini CLI (settings.json)
  Antigravity / agy
  Manual (show config snippet)
```

## Option 2 — Global install

If you prefer a persistent install with the short `gca-admin` alias:

```bash
npm install -g gemini-code-assist-admin-mcp
gca-admin
```

---

## Option 2 — Client-specific guides

Pick your client:

- [Claude Code](integrations/claude-code.md)
- [Gemini CLI](integrations/gemini-cli.md)
- [Antigravity (agy)](integrations/antigravity.md)
- [Cursor / Windsurf](integrations/cursor-windsurf.md)
- [Any MCP client](integrations/generic-mcp.md)

---

## Verify it's working

Once installed, ask your assistant:

> *"Is Gemini Code Assist enabled in my current GCP project?"*

The assistant should call `check_gca_status` and return the API enablement status.

---

## Authentication

The MCP server inherits your local `gcloud` credentials. Make sure you're authenticated:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

!!! tip "Service Accounts"
    For CI/CD or automated pipelines, set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to a service account key file with the required IAM roles.
