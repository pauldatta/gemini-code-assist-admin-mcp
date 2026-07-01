/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGcloud, getProjectId } from '../utils/gcloud.js';
import { handleToolError } from '../utils/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function registerRepoTools(server: McpServer) {
    // Tool: list_code_repository_indexes
    server.tool(
        'list_code_repository_indexes',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        },
        async ({ projectId, location }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const stdout = await runGcloud([
                    'gemini', 'code-repository-indexes', 'list',
                    '--project', targetProject,
                    '--location', location,
                    '--format', 'json'
                ]);
                return { content: [{ type: 'text', text: stdout }] };
            } catch (error: any) {
                return handleToolError(server, error, 'listing code repository indexes');
            }
        }
    );

    // Tool: create_code_repository_index
    server.tool(
        'create_code_repository_index',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
            repositoryGroup: z.string().describe('The Repository Group ID to index'),
            indexId: z.string().describe('The ID for the new index'),
            kmsKey: z.string().optional().describe('The Cloud KMS key resource name for CMEK'),
        },
        async ({ projectId, location, repositoryGroup, indexId, kmsKey }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const args = [
                    'gemini', 'code-repository-indexes', 'create', indexId,
                    '--project', targetProject,
                    '--location', location,
                    '--repository-group', repositoryGroup
                ];
                if (kmsKey) args.push('--kms-key', kmsKey);

                const stdout = await runGcloud(args);
                return { content: [{ type: 'text', text: stdout || `Index ${indexId} creation initiated.` }] };
            } catch (error: any) {
                return handleToolError(server, error, 'creating code repository index');
            }
        }
    );

    // Tool: create_repository_group
    server.tool(
        'create_repository_group',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
            indexId: z.string().describe('The Code Repository Index ID'),
            groupId: z.string().describe('The ID for the new Repository Group'),
            repositories: z.array(z.object({
                resource: z.string(),
                branchPattern: z.string()
            })).describe('List of repositories to include'),
        },
        async ({ projectId, location, indexId, groupId, repositories }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const repoConfig = repositories.map(r => `resource=${r.resource},branchPattern=${r.branchPattern}`).join(',');
                const stdout = await runGcloud([
                    'gemini', 'code-repository-indexes', 'repository-groups', 'create', groupId,
                    `--code-repository-index=${indexId}`,
                    `--project=${targetProject}`,
                    `--location=${location}`,
                    `--repositories=${repoConfig}`
                ]);
                return { content: [{ type: 'text', text: stdout || `Group ${groupId} creation initiated.` }] };
            } catch (error: any) {
                return handleToolError(server, error, 'creating repository group');
            }
        }
    );

    // Tool: list_repository_groups
    server.tool(
        'list_repository_groups',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
            indexId: z.string().describe('The Code Repository Index ID'),
        },
        async ({ projectId, location, indexId }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const stdout = await runGcloud([
                    'gemini', 'code-repository-indexes', 'repository-groups', 'list',
                    `--code-repository-index=${indexId}`,
                    `--project=${targetProject}`,
                    `--location=${location}`,
                    '--format', 'json'
                ]);
                return { content: [{ type: 'text', text: stdout }] };
            } catch (error: any) {
                return handleToolError(server, error, 'listing repository groups');
            }
        }
    );

    // Tool: delete_repository_group
    server.tool(
        'delete_repository_group',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
            indexId: z.string().describe('The Code Repository Index ID'),
            groupId: z.string().describe('The Repository Group ID to delete'),
        },
        async ({ projectId, location, indexId, groupId }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const stdout = await runGcloud([
                    'gemini', 'code-repository-indexes', 'repository-groups', 'delete', groupId,
                    `--code-repository-index=${indexId}`,
                    `--project=${targetProject}`,
                    `--location=${location}`
                ]);
                return { content: [{ type: 'text', text: stdout || `Group ${groupId} deleted.` }] };
            } catch (error: any) {
                return handleToolError(server, error, 'deleting repository group');
            }
        }
    );

    // Tool: grant_repository_group_access
    server.tool(
        'grant_repository_group_access',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
            indexId: z.string().describe('The Code Repository Index ID'),
            groupId: z.string().describe('The Repository Group ID'),
            email: z.string().email().describe('The email to grant access to'),
            role: z.string().default('roles/cloudaicompanion.repositoryGroupsUser').describe('The IAM role'),
        },
        async ({ projectId, location, indexId, groupId, email, role }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const policyJson = await runGcloud([
                    'gemini', 'code-repository-indexes', 'repository-groups', 'get-iam-policy', groupId,
                    `--code-repository-index=${indexId}`,
                    `--project=${targetProject}`,
                    `--location=${location}`,
                    '--format', 'json'
                ]);

                const tempFilePath = path.join(os.tmpdir(), `iam-policy-${Date.now()}.json`);
                let policy = JSON.parse(policyJson);
                let binding = policy.bindings?.find((b: any) => b.role === role);
                if (!binding) {
                    binding = { role: role, members: [] };
                    policy.bindings = [...(policy.bindings || []), binding];
                }
                if (!binding.members.includes(`user:${email}`)) binding.members.push(`user:${email}`);
                fs.writeFileSync(tempFilePath, JSON.stringify(policy));

                await runGcloud([
                    'gemini', 'code-repository-indexes', 'repository-groups', 'set-iam-policy', groupId, tempFilePath,
                    `--code-repository-index=${indexId}`,
                    `--project=${targetProject}`,
                    `--location=${location}`
                ]);
                fs.unlinkSync(tempFilePath);

                return { content: [{ type: 'text', text: `Granted ${role} to ${email} on group ${groupId}.` }] };
            } catch (error: any) {
                return handleToolError(server, error, 'granting access');
            }
        }
    );

    // Tool: list_developer_connect_connections
    server.tool(
        'list_developer_connect_connections',
        {
            projectId: z.string().optional().describe('The Google Cloud Project ID.'),
            location: z.string().default('us-central1').describe('The location'),
        },
        async ({ projectId, location }) => {
            try {
                const targetProject = await getProjectId(projectId);
                const stdout = await runGcloud([
                    'developer-connect', 'connections', 'list',
                    '--project', targetProject,
                    '--location', location,
                    '--format', 'json'
                ]);
                return { content: [{ type: 'text', text: stdout }] };
            } catch (error: any) {
                return handleToolError(server, error, 'listing Developer Connect connections');
            }
        }
    );
}
