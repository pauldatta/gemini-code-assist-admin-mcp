/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGcloud, getProjectId } from '../utils/gcloud.js';
import { handleToolError, sampleMessage } from '../utils/mcp.js';

export function registerAdminTools(server: McpServer) {
  // Tool: check_gca_status
  server.tool(
    'check_gca_status',
    {
      projectId: z
        .string()
        .optional()
        .describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
    },
    async ({ projectId }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const apiCheck = await runGcloud([
          'services',
          'list',
          '--enabled',
          '--project',
          targetProject,
          '--filter',
          'config.name:cloudaicompanion.googleapis.com',
          '--format',
          'value(config.name)',
        ]);
        const isEnabled = apiCheck === 'cloudaicompanion.googleapis.com';

        return {
          content: [
            {
              type: 'text',
              text: `Gemini Code Assist API (cloudaicompanion.googleapis.com) is ${isEnabled ? 'ENABLED' : 'DISABLED'} in project ${targetProject}.`,
            },
          ],
        };
      } catch (error: any) {
        return handleToolError(server, error, 'checking GCA status');
      }
    },
  );

  // Tool: check_admin_permissions
  server.tool(
    'check_admin_permissions',
    {
      projectId: z
        .string()
        .optional()
        .describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
    },
    async ({ projectId }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const currentUserEmail = await runGcloud(['config', 'get-value', 'account']);

        const policyJson = await runGcloud([
          'projects',
          'get-iam-policy',
          targetProject,
          '--flatten',
          'bindings[].members',
          '--format',
          'json',
          '--filter',
          `bindings.members:user:${currentUserEmail}`,
        ]);

        const bindings = JSON.parse(policyJson);
        const roles = bindings.map((b: any) => b.bindings.role);

        const adminRoles = [
          'roles/admin',
          'roles/owner',
          'roles/editor',
          'roles/cloudaicompanion.admin',
          'roles/resourcemanager.projectIamAdmin',
          'roles/serviceusage.serviceUsageAdmin',
        ];

        const hasAdminRole = roles.some((role: string) => adminRoles.includes(role));
        const rawData = {
          is_admin: hasAdminRole,
          current_user: currentUserEmail,
          project: targetProject,
          roles: roles,
          admin_roles_checked: adminRoles,
        };

        const systemPrompt =
          "You are a helpful Google Cloud expert. Explain the user's permissions in the context of Gemini Code Assist administration.";
        const prompt = `Here is the permission data for user ${currentUserEmail} in project ${targetProject}:\n${JSON.stringify(rawData, null, 2)}\n\nPlease explain what this user can and cannot do regarding Gemini Code Assist (GCA) management. Mention if they have admin privileges or if they are missing key roles.`;

        const explanation = await sampleMessage(server, prompt, systemPrompt);

        return {
          content: [
            {
              type: 'text',
              text: explanation || JSON.stringify(rawData, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return handleToolError(server, error, 'checking admin permissions');
      }
    },
  );
}
