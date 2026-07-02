# Generic MCP Client

Any application that supports the [Model Context Protocol](https://modelcontextprotocol.io) can use this server.

---

## Running the server

### Via npx (no install)

```bash
npx gemini-code-assist-admin-mcp
```

The server starts in `stdio` mode, which is what most MCP clients expect.

### Via global install

```bash
npm install -g gemini-code-assist-admin-mcp
gemini-code-assist-admin-mcp
```

### Via local build

```bash
git clone https://github.com/pauldatta/gemini-code-assist-admin-mcp.git
cd gemini-code-assist-admin-mcp
npm run build
node mcp/dist/index.js
```

---

## Stdio transport config

The standard config block for any MCP client:

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

## Environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | Override the default GCP project (optional) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a service account key JSON (optional) |

---

## Transport

The server uses **stdio** transport only. There is no HTTP server mode — the MCP client spawns the process and communicates over stdin/stdout.

---

## Capabilities

| Capability | Supported |
|-----------|-----------|
| Tools | ✅ 16 tools |
| Sampling (AI explanations) | ✅ when client supports it |
| Resources | ❌ |
| Prompts | ❌ |

---

## Verifying the server works

You can test it directly with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector npx gemini-code-assist-admin-mcp
```

This opens a browser UI where you can call tools interactively.
