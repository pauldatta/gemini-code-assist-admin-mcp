/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const server = new McpServer({
    name: 'gca-admin-helper',
    version: '1.0.0',
});

// Helper function to run gcloud commands
async function runGcloud(command: string): Promise<string> {
    try {
        const { stdout } = await execAsync(`gcloud ${command} -q`);
        return stdout.trim();
    } catch (error: any) {
        throw new Error(`gcloud command failed: ${error.message}`);
    }
}

// Helper to get project ID if not provided
async function getProjectId(providedId?: string): Promise<string> {
    if (providedId) return providedId;
    try {
        const projectId = await runGcloud('config get-value project');
        if (!projectId) throw new Error('No project ID provided and no default project set in gcloud.');
        return projectId;
    } catch (error: any) {
        throw new Error(`Failed to get current project ID: ${error.message}`);
    }
}

// Helper for MCP Sampling
async function sampleMessage(server: any, prompt: string, systemPrompt?: string): Promise<string | null> {
    try {
        // Check if server has capabilities or if we can just try
        // The SDK might not expose capabilities easily on the server instance, so we try/catch
        const result = await server.server.request(
            {
                method: "sampling/createMessage",
                params: {
                    messages: [
                        { role: "user", content: { type: "text", text: prompt } }
                    ],
                    systemPrompt: systemPrompt,
                    maxTokens: 1024,
                }
            },
            z.any() // Expect any response
        );

        if (result && result.content && result.content.type === 'text') {
            return result.content.text;
        }
        return null;
    } catch (error) {
        // console.error("Sampling failed or not supported:", error);
        return null;
    }
}

// Helper for error handling with sampling
async function handleToolError(server: any, error: any, context: string): Promise<{ content: { type: "text", text: string }[], isError: true }> {
    const errorMessage = error.message || String(error);
    const systemPrompt = "You are a helpful Google Cloud expert. Explain the error and suggest a fix.";
    const prompt = `I encountered an error while ${context}:\n${errorMessage}\n\nPlease explain what went wrong and how to fix it.`;

    const explanation = await sampleMessage(server, prompt, systemPrompt);
    const text = explanation ? `Error: ${errorMessage}\n\nAnalysis:\n${explanation}` : `Error: ${errorMessage}`;

    return {
        content: [{ type: 'text', text }],
        isError: true,
    };
}

// Tool: check_gca_status
server.tool(
    'check_gca_status',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
    },
    async ({ projectId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            // Check if API is enabled
            const apiCheck = await runGcloud(`services list --enabled --project ${targetProject} --filter="config.name:cloudaicompanion.googleapis.com" --format="value(config.name)"`);
            const isEnabled = apiCheck === 'cloudaicompanion.googleapis.com';

            return {
                content: [{
                    type: 'text',
                    text: `Gemini Code Assist API (cloudaicompanion.googleapis.com) is ${isEnabled ? 'ENABLED' : 'DISABLED'} in project ${targetProject}.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'checking GCA status');
        }
    }
);

// Tool: list_licenses
server.tool(
    'list_licenses',
    {
        billingAccountId: z.string().optional().describe('The Billing Account ID. If not provided, attempts to discover it.'),
        orderId: z.string().optional().describe('The Order ID. If not provided, attempts to discover it.'),
        projectId: z.string().optional().describe('The Project ID for quota usage. Defaults to current gcloud project.'),
    },
    async ({ billingAccountId, orderId, projectId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const token = await runGcloud('auth print-access-token');

            let targetBillingAccount = billingAccountId;
            let targetOrder = orderId;

            // Discovery logic if IDs are not provided
            if (!targetBillingAccount || !targetOrder) {
                console.error('No Billing Account or Order ID provided. Attempting discovery...');

                // 0. Ensure API is enabled
                try {
                    const apiCheck = await runGcloud(`services list --enabled --project ${targetProject} --filter="config.name:cloudcommerceconsumerprocurement.googleapis.com" --format="value(config.name)" -q`);
                    if (apiCheck !== 'cloudcommerceconsumerprocurement.googleapis.com') {
                        console.error(`Cloud Commerce Consumer Procurement API is not enabled in ${targetProject}. Skipping discovery using this project as quota project.`);
                        // We cannot proceed with discovery using this project.
                        // We could try to fall back to the user's default project if it's different, but for now we'll just warn.
                    }
                } catch (err) {
                    console.error(`Failed to check API status in ${targetProject}:`, err);
                }

                // 1. List Billing Accounts
                let billingAccounts: any[] = [];
                try {
                    const billingAccountsJson = await runGcloud('beta billing accounts list --format="json"');
                    billingAccounts = JSON.parse(billingAccountsJson);
                } catch (err) {
                    console.error('Failed to list billing accounts:', err);
                }

                // 2. Add Project's Billing Account (if not already in list)
                try {
                    const projectBillingJson = await runGcloud(`beta billing projects describe ${targetProject} --format="json"`);
                    const projectBilling = JSON.parse(projectBillingJson);
                    if (projectBilling.billingAccountName) {
                        const projectAccountId = projectBilling.billingAccountName.split('/').pop();
                        const exists = billingAccounts.some((a: any) => a.name.endsWith(projectAccountId));
                        if (!exists) {
                            console.error(`Adding project's billing account ${projectAccountId} to scan list.`);
                            billingAccounts.push({
                                name: projectBilling.billingAccountName,
                                open: projectBilling.billingEnabled
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Failed to get billing info for project ${targetProject}:`, err);
                }

                for (const account of billingAccounts) {
                    if (!account.open) continue; // Skip closed accounts

                    const accountId = account.name.split('/').pop();
                    const ordersUrl = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${accountId}/orders`;

                    try {
                        const ordersCommand = `curl -s -X GET -H "Authorization: Bearer ${token}" -H "X-Goog-User-Project: ${targetProject}" "${ordersUrl}"`;
                        const { stdout: ordersStdout } = await execAsync(ordersCommand);

                        let ordersResponse;
                        try {
                            ordersResponse = JSON.parse(ordersStdout);
                        } catch (e) {
                            // If response is not JSON (e.g. HTML error), ignore
                            continue;
                        }

                        if (ordersResponse.error) {
                            console.error(`Error listing orders for account ${accountId}: ${ordersResponse.error.message}`);
                            continue;
                        }

                        if (ordersResponse.orders) {
                            for (const order of ordersResponse.orders) {
                                if (order.displayName && (order.displayName.includes('Gemini Code Assist') || order.displayName.includes('Duet AI'))) {
                                    targetBillingAccount = accountId;
                                    targetOrder = order.name.split('/').pop();
                                    console.error(`Found GCA order: ${targetOrder} in billing account: ${targetBillingAccount}`);
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to check orders for account ${accountId}:`, err);
                        // Continue to next account
                    }

                    if (targetBillingAccount && targetOrder) break;
                }

                if (!targetBillingAccount || !targetOrder) {
                    const systemPrompt = "You are a helpful Google Cloud expert.";
                    const prompt = "I could not automatically find a Gemini Code Assist license order. Please explain to the user how they can find their Billing Account ID and Order ID in the Google Cloud Console, and ask them to provide these manually.";
                    const explanation = await sampleMessage(server, prompt, systemPrompt);

                    return {
                        content: [{
                            type: 'text',
                            text: explanation || 'Could not automatically find a Gemini Code Assist or Duet AI license order. Please provide Billing Account ID and Order ID manually.'
                        }]
                    };
                }
            }

            const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${targetBillingAccount}/orders/${targetOrder}/licensePool:enumerateLicensedUsers/`;

            const command = `curl -s -X GET -H "Authorization: Bearer ${token}" -H "X-Goog-User-Project: ${targetProject}" "${url}"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'listing licenses');
        }
    }
);

// Tool: assign_license
server.tool(
    'assign_license',
    {
        billingAccountId: z.string().describe('The Billing Account ID'),
        orderId: z.string().describe('The Order ID'),
        projectId: z.string().optional().describe('The Project ID for quota usage. Defaults to current gcloud project.'),
        email: z.string().email().describe('The email of the user to assign the license to'),
    },
    async ({ billingAccountId, orderId, projectId, email }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const token = await runGcloud('auth print-access-token');
            const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${billingAccountId}/orders/${orderId}/licensePool:assign/`;
            const data = JSON.stringify({ usernames: [email] });

            // Escape double quotes for shell
            const escapedData = data.replace(/"/g, '\\"');

            const command = `curl -s -X POST -d "${escapedData}" -H "Authorization: Bearer ${token}" -H "X-Goog-User-Project: ${targetProject}" -H "Content-Type: application/json" "${url}"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || 'License assigned successfully.'
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'assigning license');
        }
    }
);

// Tool: unassign_license
server.tool(
    'unassign_license',
    {
        billingAccountId: z.string().describe('The Billing Account ID'),
        orderId: z.string().describe('The Order ID'),
        projectId: z.string().optional().describe('The Project ID for quota usage. Defaults to current gcloud project.'),
        email: z.string().email().describe('The email of the user to unassign the license from'),
    },
    async ({ billingAccountId, orderId, projectId, email }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const token = await runGcloud('auth print-access-token');
            const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${billingAccountId}/orders/${orderId}/licensePool:unassign/`;
            const data = JSON.stringify({ usernames: [email] });

            // Escape double quotes for shell
            const escapedData = data.replace(/"/g, '\\"');

            const command = `curl -s -X POST -d "${escapedData}" -H "Authorization: Bearer ${token}" -H "X-Goog-User-Project: ${targetProject}" -H "Content-Type: application/json" "${url}"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || 'License unassigned successfully.'
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'unassigning license');
        }
    }
);

// Tool: get_metrics
server.tool(
    'get_metrics',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        days: z.number().default(28).describe('Number of days to look back'),
    },
    async ({ projectId, days }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const filter = `resource.type="cloudaicompanion.googleapis.com/Instance" labels.user_id:*`;
            const format = `csv(timestamp.date('%Y-%m-%d'),labels.user_id)`;
            const command = `gcloud logging read '${filter}' --freshness ${days}d --project ${targetProject} --format "${format}"`;

            const { stdout } = await execAsync(command);

            // Simple processing to count unique users
            const lines = stdout.split('\n').filter(line => line.trim() !== '');
            const uniqueUsers = new Set();
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length > 1) {
                    uniqueUsers.add(parts[1]);
                }
            });

            const summary = `Found ${uniqueUsers.size} unique users in the last ${days} days in project ${targetProject}.`;

            // Try sampling for deeper analysis
            const systemPrompt = "You are a data analyst. Summarize the usage trends based on the provided CSV data.";
            const prompt = `Here is the GCA usage data (Date, UserID) for the last ${days} days:\n${stdout}\n\nPlease provide a brief summary of usage trends, such as active users per day or growth.`;

            const analysis = await sampleMessage(server, prompt, systemPrompt);

            return {
                content: [{
                    type: 'text',
                    text: analysis ? `${summary}\n\nAnalysis:\n${analysis}\n\nRaw Data:\n${stdout}` : `${summary}\n\nRaw Data:\n${stdout}`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'getting metrics');
        }
    }
);

// Tool: list_code_repository_indexes
server.tool(
    'list_code_repository_indexes',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
    },
    async ({ projectId, location }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const command = `gcloud gemini code-repository-indexes list --project ${targetProject} --location ${location} --format="json"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'listing code repository indexes');
        }
    }
);

// Tool: create_code_repository_index
server.tool(
    'create_code_repository_index',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        repositoryGroup: z.string().describe('The Repository Group ID to index'),
        indexId: z.string().describe('The ID for the new index'),
        kmsKey: z.string().optional().describe('The Cloud KMS key resource name for CMEK (optional)'),
    },
    async ({ projectId, location, repositoryGroup, indexId, kmsKey }) => {
        try {
            const targetProject = await getProjectId(projectId);
            let command = `gcloud gemini code-repository-indexes create ${indexId} --project ${targetProject} --location ${location} --repository-group ${repositoryGroup}`;

            if (kmsKey) {
                command += ` --kms-key "${kmsKey}"`;
            }

            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || `Code repository index ${indexId} creation initiated.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'creating code repository index');
        }
    }
);

// Tool: create_repository_group
server.tool(
    'create_repository_group',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        indexId: z.string().describe('The Code Repository Index ID'),
        groupId: z.string().describe('The ID for the new Repository Group'),
        repositories: z.array(z.object({
            resource: z.string().describe('The Developer Connect repository resource name'),
            branchPattern: z.string().describe('The branch pattern to index')
        })).describe('List of repositories to include in the group'),
    },
    async ({ projectId, location, indexId, groupId, repositories }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const repoConfig = repositories.map(r => `resource=${r.resource},branchPattern=${r.branchPattern}`).join(',');

            const command = `gcloud gemini code-repository-indexes repository-groups create ${groupId} --code-repository-index=${indexId} --project=${targetProject} --location=${location} --repositories=${repoConfig}`;

            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || `Repository group ${groupId} creation initiated.\n\nNext Step: Grant access to this group using the 'grant_repository_group_access' tool.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'creating repository group');
        }
    }
);

// Tool: list_repository_groups
server.tool(
    'list_repository_groups',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        indexId: z.string().describe('The Code Repository Index ID'),
    },
    async ({ projectId, location, indexId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const command = `gcloud gemini code-repository-indexes repository-groups list --code-repository-index=${indexId} --project=${targetProject} --location=${location} --format="json"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'listing repository groups');
        }
    }
);

// Tool: delete_repository_group
server.tool(
    'delete_repository_group',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        indexId: z.string().describe('The Code Repository Index ID'),
        groupId: z.string().describe('The Repository Group ID to delete'),
    },
    async ({ projectId, location, indexId, groupId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const command = `gcloud gemini code-repository-indexes repository-groups delete ${groupId} --code-repository-index=${indexId} --project=${targetProject} --location=${location} -q`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || `Repository group ${groupId} deleted.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'deleting repository group');
        }
    }
);

// Tool: grant_repository_group_access
server.tool(
    'grant_repository_group_access',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        indexId: z.string().describe('The Code Repository Index ID'),
        groupId: z.string().describe('The Repository Group ID'),
        email: z.string().email().describe('The email of the user to grant access to'),
        role: z.string().default('roles/cloudaicompanion.repositoryGroupsUser').describe('The IAM role to grant'),
    },
    async ({ projectId, location, indexId, groupId, email, role }) => {
        try {
            const targetProject = await getProjectId(projectId);
            // 1. Get current policy
            const getPolicyCmd = `gcloud gemini code-repository-indexes repository-groups get-iam-policy ${groupId} --code-repository-index=${indexId} --project=${targetProject} --location=${location} --format="json"`;
            const { stdout: policyJson } = await execAsync(getPolicyCmd);

            // 2. Write policy to temp file (simulated by passing file content to set-iam-policy via stdin if supported, or using a temp file.
            // gcloud set-iam-policy accepts a file path. We will use a temp file.)
            const fs = require('fs');
            const path = require('path');
            const os = require('os');

            const tempFilePath = path.join(os.tmpdir(), `iam-policy-${Date.now()}.json`);
            let policy = JSON.parse(policyJson);

            // Add binding
            let binding = policy.bindings?.find((b: any) => b.role === role);
            if (!binding) {
                binding = { role: role, members: [] };
                policy.bindings = [...(policy.bindings || []), binding];
            }
            if (!binding.members.includes(`user:${email}`)) {
                binding.members.push(`user:${email}`);
            }

            fs.writeFileSync(tempFilePath, JSON.stringify(policy));

            // 3. Set new policy
            const setPolicyCmd = `gcloud gemini code-repository-indexes repository-groups set-iam-policy ${groupId} ${tempFilePath} --code-repository-index=${indexId} --project=${targetProject} --location=${location}`;
            await execAsync(setPolicyCmd);

            fs.unlinkSync(tempFilePath); // Cleanup

            return {
                content: [{
                    type: 'text',
                    text: `Granted ${role} to ${email} on repository group ${groupId}.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'granting repository group access');
        }
    }
);

// Tool: revoke_repository_group_access
server.tool(
    'revoke_repository_group_access',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        indexId: z.string().describe('The Code Repository Index ID'),
        groupId: z.string().describe('The Repository Group ID'),
        email: z.string().email().describe('The email of the user to revoke access from'),
        role: z.string().default('roles/cloudaicompanion.repositoryGroupsUser').describe('The IAM role to revoke'),
    },
    async ({ projectId, location, indexId, groupId, email, role }) => {
        try {
            const targetProject = await getProjectId(projectId);
            // 1. Get current policy
            const getPolicyCmd = `gcloud gemini code-repository-indexes repository-groups get-iam-policy ${groupId} --code-repository-index=${indexId} --project=${targetProject} --location=${location} --format="json"`;
            const { stdout: policyJson } = await execAsync(getPolicyCmd);

            const fs = require('fs');
            const path = require('path');
            const os = require('os');

            const tempFilePath = path.join(os.tmpdir(), `iam-policy-${Date.now()}.json`);
            let policy = JSON.parse(policyJson);

            // Remove binding
            if (policy.bindings) {
                const binding = policy.bindings.find((b: any) => b.role === role);
                if (binding) {
                    binding.members = binding.members.filter((m: string) => m !== `user:${email}`);
                    if (binding.members.length === 0) {
                        policy.bindings = policy.bindings.filter((b: any) => b.role !== role);
                    }
                }
            }

            fs.writeFileSync(tempFilePath, JSON.stringify(policy));

            // 3. Set new policy
            const setPolicyCmd = `gcloud gemini code-repository-indexes repository-groups set-iam-policy ${groupId} ${tempFilePath} --code-repository-index=${indexId} --project=${targetProject} --location=${location}`;
            await execAsync(setPolicyCmd);

            fs.unlinkSync(tempFilePath); // Cleanup

            return {
                content: [{
                    type: 'text',
                    text: `Revoked ${role} from ${email} on repository group ${groupId}.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'revoking repository group access');
        }
    }
);

// Tool: list_developer_connect_connections
server.tool(
    'list_developer_connect_connections',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
    },
    async ({ projectId, location }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const command = `gcloud developer-connect connections list --project ${targetProject} --location ${location} --format="json"`;
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'listing Developer Connect connections');
        }
    }
);

// Tool: create_developer_connect_connection
server.tool(
    'create_developer_connect_connection',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        connectionId: z.string().describe('The ID for the new connection'),
        githubConfigAppInstallationId: z.string().optional().describe('The GitHub App Installation ID (required for GitHub connections)'),
    },
    async ({ projectId, location, connectionId, githubConfigAppInstallationId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            let command = `gcloud developer-connect connections create ${connectionId} --project ${targetProject} --location ${location}`;

            if (githubConfigAppInstallationId) {
                command += ` --github-config-app-installation-id=${githubConfigAppInstallationId}`;
            } else {
                // Default to interactive flow or error if not supported
                // For now, we assume GitHub is the primary use case and warn if missing
                // But we can also just run the command and let gcloud prompt (which might fail in non-interactive)
                // Better to be explicit
            }

            // Note: This might trigger an interactive flow in the browser
            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || `Connection ${connectionId} creation initiated. Please check your browser if an authorization flow was triggered.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'creating Developer Connect connection');
        }
    }
);

// Tool: link_git_repository
server.tool(
    'link_git_repository',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
        location: z.string().default('us-central1').describe('The location (e.g., us-central1)'),
        connectionId: z.string().describe('The Developer Connect Connection ID'),
        linkId: z.string().describe('The ID for the new Git repository link'),
        gitRepositoryUri: z.string().describe('The URI of the Git repository (e.g., https://github.com/owner/repo.git)'),
    },
    async ({ projectId, location, connectionId, linkId, gitRepositoryUri }) => {
        try {
            const targetProject = await getProjectId(projectId);
            const command = `gcloud developer-connect connections git-repository-links create ${linkId} --connection=${connectionId} --project=${targetProject} --location=${location} --git-repository-uri=${gitRepositoryUri}`;

            const { stdout } = await execAsync(command);

            return {
                content: [{
                    type: 'text',
                    text: stdout || `Git repository link ${linkId} created successfully.`
                }]
            };
        } catch (error: any) {
            return handleToolError(server, error, 'linking Git repository');
        }
    }
);

// Tool: check_admin_permissions
server.tool(
    'check_admin_permissions',
    {
        projectId: z.string().optional().describe('The Google Cloud Project ID. Defaults to current gcloud project.'),
    },
    async ({ projectId }) => {
        try {
            const targetProject = await getProjectId(projectId);
            // Get current user email
            const currentUserEmail = await runGcloud('config get-value account');

            // Get IAM policy for the user
            // We filter for roles that might indicate admin status for GCA or general project admin
            const command = `gcloud projects get-iam-policy ${targetProject} --flatten="bindings[].members" --format="json" --filter="bindings.members:user:${currentUserEmail}"`;
            const { stdout } = await execAsync(command);

            const bindings = JSON.parse(stdout);
            const roles = bindings.map((b: any) => b.bindings.role);

            const adminRoles = [
                'roles/admin',
                'roles/owner',
                'roles/editor',
                'roles/cloudaicompanion.admin',
                'roles/resourcemanager.projectIamAdmin',
                'roles/serviceusage.serviceUsageAdmin'
            ];

            const hasAdminRole = roles.some((role: string) => adminRoles.includes(role));
            const rawData = {
                is_admin: hasAdminRole,
                current_user: currentUserEmail,
                project: targetProject,
                roles: roles,
                admin_roles_checked: adminRoles
            };

            // Try sampling
            const systemPrompt = "You are a helpful Google Cloud expert. Explain the user's permissions in the context of Gemini Code Assist administration.";
            const prompt = `Here is the permission data for user ${currentUserEmail} in project ${targetProject}:\n${JSON.stringify(rawData, null, 2)}\n\nPlease explain what this user can and cannot do regarding Gemini Code Assist (GCA) management. Mention if they have admin privileges or if they are missing key roles.`;

            const explanation = await sampleMessage(server, prompt, systemPrompt);

            if (explanation) {
                return {
                    content: [{
                        type: 'text',
                        text: explanation
                    }]
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(rawData, null, 2)
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: 'text',
                    text: `Error checking admin permissions: ${error.message}`
                }],
                isError: true,
            };
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GCA Admin Helper MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
