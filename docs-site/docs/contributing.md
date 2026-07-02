# Contributing

Contributions are welcome. This is an Apache 2.0-licensed open source project.

## Development setup

```bash
git clone https://github.com/pauldatta/gemini-code-assist-admin-mcp.git
cd gemini-code-assist-admin-mcp

# Install MCP server deps
cd mcp && npm install && npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## Working on the docs

The docs site uses [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and is managed with `uv`.

```bash
cd docs-site
uv run mkdocs serve     # live-reload preview at http://localhost:8000
uv run mkdocs build     # build static site to docs-site/site/
```

## Project structure

```
mcp/src/tools/    ← Add new MCP tools here
mcp/src/utils/    ← Shared gcloud/MCP helpers
commands/gca/     ← Gemini CLI slash command .toml files
plugins/gca-admin/ ← Antigravity plugin definition
docs-site/docs/   ← Documentation source (Markdown)
```

## Adding a new tool

1. Implement the tool in `mcp/src/tools/<category>.ts` using `server.tool(...)`
2. Export and register it in `mcp/src/index.ts`
3. Add tests in the corresponding `*.test.ts` file
4. Document it in `docs-site/docs/reference/tools.md`

## Submitting a PR

- Run `npm run lint` and `npm test` before pushing
- Keep PRs focused — one tool or feature per PR
- Update `docs-site/docs/reference/tools.md` if you add or change a tool
