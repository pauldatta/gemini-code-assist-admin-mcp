# Gemini CLI

[Gemini CLI](https://github.com/google-gemini/gemini-cli) supports extensions that bundle MCP servers, slash commands, and skills together.

---

## Install as an extension

```bash
gemini extensions install https://github.com/pauldatta/gemini-code-assist-admin-mcp
```

This installs the MCP server, registers the custom `/gca:*` slash commands, and makes the workspace skill available.

---

## Custom slash commands

Once installed, the following `/gca:*` commands are available directly in the Gemini CLI chat:

| Command | What it does |
|---------|-------------|
| `/gca:status` | Check GCA API enablement and IAM status |
| `/gca:admin` | Verify your admin permissions |
| `/gca:metrics` | Show usage metrics (defaults to last 28 days) |
| `/gca:create_index` | Create a new code repository index |
| `/gca:create_group` | Create a repository group |
| `/gca:list_groups` | List all repository groups |
| `/gca:delete_group` | Delete a repository group |
| `/gca:grant_access` | Grant a user access to a repository group |
| `/gca:revoke_access` | Revoke a user's access from a repository group |

---

## Manual MCP config

If you prefer to configure it manually, add to your Gemini CLI `settings.json`:

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

## GEMINI.md

The repo includes a `GEMINI.md` file that provides Gemini CLI with workspace-level context when you open this directory — tool descriptions, architecture notes, and example prompts are automatically surfaced.

---

## Example session

```
> /gca:status

Checking GCA status for project my-org-prod...
✅ Gemini Code Assist API (cloudaicompanion.googleapis.com) is ENABLED
✅ You have roles/cloudaicompanion.admin
```
