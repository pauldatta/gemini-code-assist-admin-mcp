#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAdminTools } from './tools/admin.js';
import { registerLicenseTools } from './tools/license.js';
import { registerRepoTools } from './tools/repo.js';
import { registerMetricsTools } from './tools/metrics.js';
import { runInteractiveInstaller } from './cli/installer.js';

const server = new McpServer({
    name: 'gca-admin-helper',
    version: '1.0.0',
});

// Register all tools
registerAdminTools(server);
registerLicenseTools(server);
registerRepoTools(server);
registerMetricsTools(server);

async function main() {
    // If run via terminal (not as an MCP server), show interactive menu
    // MCP clients usually don't have a TTY or provide specific args
    if (process.stdout.isTTY && !process.argv.includes('--mcp')) {
        const shouldStartServer = await runInteractiveInstaller();
        if (!shouldStartServer) return;
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GCA Admin Helper MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
