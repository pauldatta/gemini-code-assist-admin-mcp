# 🤖 Agent Instructions (AGENTS.md)

Welcome, fellow agent! This file provides the context and constraints you need to effectively work with the **GCA Admin Helper** codebase.

## 🎯 Project Purpose
This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides administrative tools for **Gemini Code Assist (GCA)**. It acts as a bridge between LLMs and the `gcloud` CLI.

## 🏗️ Architecture
- **Modular Tools**: Each administrative domain has its own file in `src/tools/` (e.g., `license.ts`, `metrics.ts`).
- **Safe Execution**: Never use `child_process.exec`. Always use the `spawn` wrappers in `src/utils/gcloud.ts` to prevent shell injection.
- **AI-Powered Errors**: When a `gcloud` command fails, use `analyzeErrorWithSampling` from `src/utils/mcp.ts`. This allows you to leverage the host's LLM to explain errors in plain English.
- **Zod Schemas**: All tool inputs MUST be strictly validated using Zod.

## 🛠️ Adding a New Tool
1.  **Define Logic**: Create or update a file in `src/tools/`. Use the `defineTool` pattern.
2.  **Schema**: Define a clear Zod schema for inputs.
3.  **Registration**: Import and call your new tool function in `src/index.ts`.
4.  **Skill Update**: Update `.agents/skills/gca-admin.md` if the new tool should be exposed via slash commands.

## 🧪 Testing & Verification
- **Local Run**: `npm run build && node dist/index.js`
- **MCP Inspector**: Use the MCP Inspector to verify tool signatures and execution.
- **Antigravity**: Test via `agy /gca-admin` if you have it installed locally.

## ⚠️ Critical Constraints
- **Preserve Comments**: Do not remove existing JSDoc comments or architecture notes.
- **No Placeholders**: Never leave `TODO` items. Either implement the logic or return a descriptive error.
- **Project Context**: Most tools default to the active `gcloud` project. Always allow a `projectId` override in the schema.
