# Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) supports MCP servers natively via the `claude mcp add` command.

---

## One-command setup

```bash
claude mcp add gemini-code-assist-admin-mcp npx gemini-code-assist-admin-mcp
```

This registers the server globally in Claude Code's config.

---

## Manual setup

If you prefer to edit the config file directly, add this to `~/.claude/claude_desktop_config.json`:

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

Restart Claude Code after editing.

---

## From a local clone

If you're developing against a local build:

```bash
cd /path/to/gemini-code-assist-admin-mcp
npm run build --workspace=mcp
```

Then in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gemini-code-assist-admin": {
      "command": "node",
      "args": ["/path/to/gemini-code-assist-admin-mcp/mcp/dist/index.js"]
    }
  }
}
```

---

## Verify

Open Claude Code and try:

```
Is GCA enabled in project my-gcp-project?
```

Claude will call `check_gca_status` and report back. You can also ask:

- *"List all GCA licenses in billing account 01AB23-CD4EF5-67GH89"*
- *"Show me GCA usage metrics for the last 14 days"*
- *"Do I have admin permissions to manage GCA?"*

---

## Using the CLAUDE.md project file

If you clone this repo and open it in Claude Code, the included `CLAUDE.md` file provides Claude with automatic context about the project architecture and available tools — no extra prompting needed.
