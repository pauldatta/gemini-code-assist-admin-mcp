# Gemini Code Assist Admin MCP

[![CI](https://github.com/pauldatta/gemini-code-assist-admin-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/pauldatta/gemini-code-assist-admin-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/gemini-code-assist-admin-mcp?color=CB3837&logo=npm)](https://www.npmjs.com/package/gemini-code-assist-admin-mcp)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/pauldatta/gemini-code-assist-admin-mcp/blob/main/LICENSE)

A **Model Context Protocol (MCP) server** that gives AI coding assistants the ability to manage [Gemini Code Assist](https://cloud.google.com/gemini/docs/codeassist/overview) on your behalf — without you ever having to leave the chat.

---

## What it does

Gemini Code Assist Admin MCP exposes a set of tools your AI assistant can call to:

<div class="grid cards" markdown>

-   :material-key: **License Management**

    ---
    List, assign, and unassign Gemini Code Assist licenses across your organisation.

-   :material-chart-bar: **Usage Metrics**

    ---
    Pull unique active user counts from Cloud Logging for any time window.

-   :material-source-repository: **Repository Indexing**

    ---
    Create and manage code repository indexes, groups, and Developer Connect connections.

-   :material-shield-check: **IAM & Status Checks**

    ---
    Verify the GCA API is enabled, and check your own admin permissions.

</div>

---

## Supported clients

| Client | Method |
|--------|--------|
| **Claude Code** | `claude mcp add` |
| **Gemini CLI** | `gemini extensions install` |
| **Antigravity (agy)** | `agy plugin install` |
| **Cursor / Windsurf** | `mcp_config.json` |
| **Any MCP client** | `npx gemini-code-assist-admin-mcp` |

---

## Five-second start

```bash
npx gemini-code-assist-admin-mcp
```

Follow the interactive prompts to add it to your assistant of choice. That's it.

→ [Full installation guide](getting-started.md)
