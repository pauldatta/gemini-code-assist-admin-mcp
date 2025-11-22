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
        const { stdout } = await execAsync(`gcloud ${command}`);
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
            return {
                content: [{
                    type: 'text',
                    text: `Error checking status: ${error.message}`
                }],
                isError: true,
            };
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

                // 1. List Billing Accounts
                const billingAccountsJson = await runGcloud('beta billing accounts list --format="json"');
                const billingAccounts = JSON.parse(billingAccountsJson);

                for (const account of billingAccounts) {
                    if (!account.open) continue; // Skip closed accounts

                    const accountId = account.name.split('/').pop();
                    const ordersUrl = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${accountId}/orders`;

                    try {
                        const ordersCommand = `curl -s -X GET -H "Authorization: Bearer ${token}" -H "X-Goog-User-Project: ${targetProject}" "${ordersUrl}"`;
                        const { stdout: ordersStdout } = await execAsync(ordersCommand);
                        const ordersResponse = JSON.parse(ordersStdout);

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
                    return {
                        content: [{
                            type: 'text',
                            text: 'Could not automatically find a Gemini Code Assist or Duet AI license order. Please provide Billing Account ID and Order ID manually.'
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
            return {
                content: [{
                    type: 'text',
                    text: `Error listing licenses: ${error.message}`
                }],
                isError: true,
            };
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
            return {
                content: [{
                    type: 'text',
                    text: `Error assigning license: ${error.message}`
                }],
                isError: true,
            };
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
            return {
                content: [{
                    type: 'text',
                    text: `Error unassigning license: ${error.message}`
                }],
                isError: true,
            };
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
            const filter = `resource.type=cloudaicompanion.googleapis.com/Instance labels.product=~"code_assist"`;
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

            return {
                content: [{
                    type: 'text',
                    text: `Found ${uniqueUsers.size} unique users in the last ${days} days in project ${targetProject}.\n\nRaw Data:\n${stdout}`
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: 'text',
                    text: `Error getting metrics: ${error.message}`
                }],
                isError: true,
            };
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
            return {
                content: [{
                    type: 'text',
                    text: `Error listing code repository indexes: ${error.message}`
                }],
                isError: true,
            };
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

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        is_admin: hasAdminRole,
                        current_user: currentUserEmail,
                        project: targetProject,
                        roles: roles,
                        admin_roles_checked: adminRoles
                    }, null, 2)
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
