# Creating a Gemini CLI Extension

## Overview
This document summarizes the process of creating a Gemini CLI extension, based on the [official documentation](https://geminicli.com/docs/extensions/getting-started-extensions/).

## Prerequisites
- **Gemini CLI** installed.
- **Node.js** and **TypeScript** knowledge.

## 1. Initialization
The easiest way to start is using the built-in template:

```bash
gemini extensions new my-extension-name mcp-server
```

This creates a directory with:
- `gemini-extension.json`: The manifest file.
- `example.ts` (or `src/index.ts`): The MCP server source code.
- `package.json` & `tsconfig.json`: Standard TypeScript configuration.

## 2. Key Files

### `gemini-extension.json`
The manifest file that tells Gemini CLI how to load the extension.

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "mcpServers": {
    "nodeServer": {
      "command": "node",
      "args": ["${extensionPath}/dist/index.js"],
      "cwd": "${extensionPath}"
    }
  }
}
```
- `${extensionPath}` is a variable replaced by the absolute path to the extension directory.

### MCP Server (`src/index.ts` / `example.ts`)
Uses `@modelcontextprotocol/sdk` to define tools and resources.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'my-server',
  version: '1.0.0',
});

server.tool('my_tool', { ... }, async () => { ... });

const transport = new StdioServerTransport();
await server.connect(transport);
```

## 3. Build and Link
To use the extension locally:

1.  **Install dependencies**: `npm install`
2.  **Build**: `npm run build` (compiles TS to JS in `dist/`)
3.  **Link**: `gemini extensions link .`

Changes to the code require a rebuild (`npm run build`) and a restart of the Gemini CLI session. The `link` command only needs to be run once.

## 4. Custom Commands
You can add shortcut commands by creating `.toml` files in a `commands/` directory.

**Example**: `commands/fs/grep.toml`
```toml
prompt = """Summarize these search results:
!{grep -r {{args}} .}
"""
```
Usage: `/fs:grep "pattern"`

## 5. Persistent Context (`GEMINI.md`)
Placing a `GEMINI.md` file in the root of the extension directory provides persistent instructions or context to the model whenever the extension is active.

## 6. Releasing
Extensions can be shared via a public Git repository or GitHub Releases.
