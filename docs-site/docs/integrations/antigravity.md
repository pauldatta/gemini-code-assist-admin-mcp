# Antigravity (agy)

[Antigravity](https://antigravity.google) (also referred to as `agy` or `agy-cli`) is Google's AI coding agent. This repo ships a purpose-built plugin for it.

---

## Install the plugin globally

The `plugins/gca-admin/` directory is a ready-to-install Antigravity plugin. Installing it globally makes the MCP server and skills available across **all your workspaces**.

```bash
agy plugin install https://github.com/pauldatta/gemini-code-assist-admin-mcp/tree/main/plugins/gca-admin
```

Or from a local clone:

```bash
agy plugin install ./plugins/gca-admin
```

The plugin registers:

- **MCP server** — all 16 admin tools become available to the agent
- **Skills** — the agent gains knowledge of GCA administration workflows

---

## Workspace-level skill (auto-discovery)

When you open this repo directory in Antigravity, the workspace skill in `.agents/skills/gca-admin.md` is **automatically discovered**. No installation needed — just open the repo and the `/gca-admin` skill is available.

```bash
cd /path/to/gemini-code-assist-admin-mcp
agy  # skill is auto-loaded
```

---

## plugin.json reference

The plugin is defined in `plugins/gca-admin/plugin.json`:

```json
{
  "$schema": "https://antigravity.google/schemas/v1/plugin.json",
  "name": "gca-admin",
  "version": "1.0.0",
  "description": "Administrative tools for Gemini Code Assist license management and analytics",
  "author": "Paul Datta"
}
```

---

## MCP config used by the plugin

`plugins/gca-admin/mcp_config.json` points to the built MCP server:

```json
{
  "mcpServers": {
    "gemini-code-assist-admin": {
      "command": "npx",
      "args": ["-y", "gemini-code-assist-admin-mcp"]
    }
  }
}
```

---

## Example prompts

Once the plugin is installed, talk to your agent naturally:

- *"Who has GCA licenses in my organisation? Pull the full list."*
- *"Enable the GCA API in project staging-env-9821 and verify it's working."*
- *"Create a code repository index for my GitHub org and set up two groups — backend and frontend."*
- *"Show me which developers actually used Gemini Code Assist last month."*

The agent will orchestrate multiple tool calls automatically.
