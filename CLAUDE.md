# Claude Code Instructions (CLAUDE.md)

Welcome! This file provides context and constraints for **Claude Code** to effectively work with the **GCA Admin Helper** codebase.

## 🎯 Project Purpose
This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides administrative tools for **Gemini Code Assist (GCA)**. It acts as a bridge between LLMs and the `gcloud` CLI.

## 🏗️ Architecture
- **Modular Tools**: Each administrative domain has its own file in `src/tools/` (e.g., [license.ts](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/src/tools/license.ts), [metrics.ts](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/src/tools/metrics.ts)).
- **Safe Execution**: Never use `child_process.exec`. Always use the `spawn` wrappers in [src/utils/gcloud.ts](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/src/utils/gcloud.ts) to prevent shell injection.
- **AI-Powered Errors**: When a `gcloud` command fails, use `analyzeErrorWithSampling` from [src/utils/mcp.ts](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/src/utils/mcp.ts). This allows you to leverage the host's LLM to explain errors in plain English.
- **Zod Schemas**: All tool inputs MUST be strictly validated using Zod.

## 🛠️ Adding a New Tool
1.  **Define Logic**: Create or update a file in `src/tools/`. Use the `defineTool` pattern.
2.  **Schema**: Define a clear Zod schema for inputs.
3.  **Registration**: Import and call your new tool function in [src/index.ts](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/src/index.ts).
4.  **Skill Update**: Update `.agents/skills/gca-admin.md` if the new tool should be exposed via slash commands (for Antigravity users).

## 🧪 Testing & Verification
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm test`
- **Manual Verification**: Run `node dist/index.js` and use the MCP Inspector to verify tool signatures.

## ⚠️ Critical Constraints
- **Preserve Comments**: Do not remove existing JSDoc comments or architecture notes.
- **No Placeholders**: Never leave `TODO` items. Either implement the logic or return a descriptive error.
- **Project Context**: Most tools default to the active `gcloud` project. Always allow a `projectId` override in the schema.
- **Antigravity Compatibility**: Maintain the [plugin.json](file:///Users/pauldatta/Code/demos/gemini-code-assist-admin-mcp/plugins/gca-admin/plugin.json) and `.agents/skills/` directory structure for Antigravity users.
