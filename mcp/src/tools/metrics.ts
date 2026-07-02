/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGcloud, getProjectId } from '../utils/gcloud.js';
import { handleToolError, sampleMessage } from '../utils/mcp.js';

export function registerMetricsTools(server: McpServer) {
  server.tool(
    'get_metrics',
    {
      projectId: z.string().optional().describe('The Google Cloud Project ID.'),
      days: z.number().default(28).describe('Number of days to look back'),
    },
    async ({ projectId, days }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const filter = `resource.type="cloudaicompanion.googleapis.com/Instance" labels.user_id:*`;
        const format = `csv(timestamp.date('%Y-%m-%d'),labels.user_id)`;
        const stdout = await runGcloud([
          'logging',
          'read',
          filter,
          '--freshness',
          `${days}d`,
          '--project',
          targetProject,
          '--format',
          format,
        ]);

        const lines = stdout.split('\n').filter((line) => line.trim() !== '');
        const uniqueUsers = new Set();
        lines.forEach((line) => {
          const parts = line.split(',');
          if (parts.length > 1) uniqueUsers.add(parts[1]);
        });

        const summary = `Found ${uniqueUsers.size} unique users in the last ${days} days in project ${targetProject}.`;
        const analysis = await sampleMessage(
          server,
          `Analyze these GCA usage trends:\n${stdout}`,
          'You are a data analyst.',
        );

        return {
          content: [
            {
              type: 'text',
              text: analysis
                ? `${summary}\n\nAnalysis:\n${analysis}\n\nRaw Data:\n${stdout}`
                : `${summary}\n\nRaw Data:\n${stdout}`,
            },
          ],
        };
      } catch (error: any) {
        return handleToolError(server, error, 'getting metrics');
      }
    },
  );
}
