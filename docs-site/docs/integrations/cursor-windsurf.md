# Cursor & Windsurf

Both [Cursor](https://www.cursor.com) and [Windsurf](https://codeium.com/windsurf) support MCP servers through a JSON config file.

---

## Cursor

### Setup

Open **Cursor Settings** → **MCP** → **Add Server**, or edit `~/.cursor/mcp.json` directly:

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

Restart Cursor after saving.

### Using tools in Cursor

In the Cursor chat, switch to **Agent mode** and prompt naturally:

```
Check if GCA is enabled in project my-project and show me the current license list.
```

Cursor will call the MCP tools automatically and display the results inline.

---

## Windsurf

### Setup

Edit `~/.codeium/windsurf/mcp_config.json`:

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

Restart Windsurf after saving.

---

## Project-scoped config (both editors)

To scope the server to a specific project, create `.cursor/mcp.json` or `.windsurf/mcp.json` at the repo root:

```json
{
  "mcpServers": {
    "gemini-code-assist-admin": {
      "command": "node",
      "args": ["./mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "my-default-project"
      }
    }
  }
}
```

!!! note
    Setting `GOOGLE_CLOUD_PROJECT` here overrides the `gcloud config` default — useful when different repos target different GCP projects.
