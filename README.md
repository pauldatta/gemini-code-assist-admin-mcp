# Gemini Code Assist Admin MCP

[![CI](https://github.com/pauldatta/gemini-code-assist-admin-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/pauldatta/gemini-code-assist-admin-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/gemini-code-assist-admin-mcp?color=CB3837&logo=npm)](https://www.npmjs.com/package/gemini-code-assist-admin-mcp)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-0a66c2?logo=readthedocs)](https://pauldatta.github.io/gemini-code-assist-admin-mcp/)

**📖 Full documentation: [pauldatta.github.io/gemini-code-assist-admin-mcp](https://pauldatta.github.io/gemini-code-assist-admin-mcp/)**

A toolkit for Google Cloud administrators to manage [Gemini Code Assist](https://cloud.google.com/gemini/docs/codeassist/overview) — licenses, metrics, and code repository indexing — directly from their AI coding assistant.

## What's in this repo

```
mcp/              ← MCP server (TypeScript, npm-published, npx-runnable)
  src/
    tools/        ← Tool implementations (admin, license, metrics, repo)
    utils/        ← gcloud helpers, MCP sampling utilities
    cli/          ← Interactive npx installer
  dist/           ← Compiled output (generated, not committed)

commands/         ← Gemini CLI custom slash commands (/gca:status, etc.)
  gca/

plugins/          ← Antigravity / Gemini CLI portable plugin
  gca-admin/
    plugin.json
    mcp_config.json

docs/             ← Additional documentation
  user_guide.md
  mcp_test_plan.md
```

## Quick Start

### Option 1 — npx (zero install)

```bash
npx gemini-code-assist-admin-mcp
```

Launches an interactive setup that patches your AI assistant's config automatically.

### Option 2 — Global install

```bash
npm install -g gemini-code-assist-admin-mcp
gca-admin   # short alias
```

### Option 3 — Gemini CLI extension

```bash
gemini extensions install https://github.com/pauldatta/gemini-code-assist-admin-mcp
```

### Option 4 — Manual MCP config

Add this to your MCP client's config (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "gca-admin": {
      "command": "npx",
      "args": ["-y", "gemini-code-assist-admin-mcp"]
    }
  }
}
```

Or if running from a local clone:

```json
{
  "mcpServers": {
    "gca-admin": {
      "command": "node",
      "args": ["mcp/dist/index.js"],
      "cwd": "/path/to/gemini-code-assist-admin-mcp"
    }
  }
}
```

---

## MCP Tools

| Tool | Description | Example prompt |
|------|-------------|----------------|
| `check_gca_status` | Checks if the GCA API is enabled in a project | _"Is GCA enabled in my-project?"_ |
| `check_admin_permissions` | Verifies your IAM admin roles | _"Do I have GCA admin rights?"_ |
| `list_licenses` | Lists all assigned GCA licenses | _"Who has GCA licenses in billing account X?"_ |
| `assign_license` | Assigns a license to a user | _"Give a GCA license to user@example.com"_ |
| `unassign_license` | Removes a license from a user | _"Remove GCA license from user@example.com"_ |
| `get_metrics` | Retrieves unique active user counts from Cloud Logging | _"Show GCA usage for the last 28 days"_ |
| `list_code_repository_indexes` | Lists code repository indexes | _"List indexes in my-project"_ |
| `create_code_repository_index` | Creates a code index (supports CMEK) | _"Create index my-index with key projects/..."_ |
| `create_repository_group` | Creates a repository group | _"Create group my-group in index my-index"_ |
| `list_repository_groups` | Lists repository groups | _"List groups in my-index"_ |
| `delete_repository_group` | Deletes a repository group | _"Delete group my-group"_ |
| `grant_repository_group_access` | Grants user access to a group | _"Grant user@example.com access to my-group"_ |
| `revoke_repository_group_access` | Revokes user access from a group | _"Revoke user@example.com from my-group"_ |
| `list_developer_connect_connections` | Lists Developer Connect connections | _"List my Developer Connect connections"_ |
| `create_developer_connect_connection` | Creates a Developer Connect connection | _"Create a GitHub connection in us-central1"_ |
| `link_git_repository` | Links a Git repo to a Developer Connect connection | _"Link github.com/owner/repo to my-conn"_ |

## Custom Commands (Gemini CLI)

| Command | Description |
|---------|-------------|
| `/gca:status` | Check GCA API and IAM status |
| `/gca:admin` | Check your admin permissions |
| `/gca:metrics` | Show usage metrics |
| `/gca:create_index` | Create a code repository index |
| `/gca:create_group` | Create a repository group |
| `/gca:list_groups` | List repository groups |
| `/gca:delete_group` | Delete a repository group |
| `/gca:grant_access` | Grant access to a repository group |
| `/gca:revoke_access` | Revoke access from a repository group |

## Intelligent Error Analysis

All tools use **MCP Sampling** to explain `gcloud` errors in plain English and suggest fixes — you see context-aware guidance instead of raw stack traces.

---

## For Developers

### Prerequisites

- Node.js 20+
- `gcloud` CLI installed and authenticated (`gcloud auth login`, `gcloud auth application-default login`)

### Build & test

```bash
cd mcp
npm install
npm run build   # compile TypeScript → dist/
npm test        # vitest
npm run lint    # eslint
```

### Publishing a new version (manual)

Publishing is intentionally manual — no CI automation.

```bash
# 1. bump the version
cd mcp && npm version patch   # or minor / major

# 2. publish to npm
npm publish --access public --registry=https://registry.npmjs.org/

# 3. tag and push
cd .. && git push && git push --tags
```

### Project structure notes

- **`mcp/`** is an independent npm package ([npmjs.com/package/gemini-code-assist-admin-mcp](https://www.npmjs.com/package/gemini-code-assist-admin-mcp)). Build, test, and publish standalone.
- **`plugins/gca-admin/`** is the Antigravity/Gemini CLI plugin definition. Its `mcp_config.json` references `mcp/dist/index.js`.
- **`commands/gca/`** contains `.toml` command definitions for Gemini CLI slash commands.

### Antigravity / Gemini CLI Plugin

Install globally so it's available in all workspaces:

```bash
agy plugin install ./plugins/gca-admin
```

The workspace also includes `.agents/skills/` for auto-discovery when you run `agy` in this directory.

---

## Requirements

- `gcloud` CLI, authenticated with appropriate IAM roles
- For license management: `roles/cloudaicompanion.admin` or `roles/cloudaicompanion.viewer`
- For metrics: `roles/logging.viewer`
- For repository indexing: `roles/cloudaicompanion.admin`
