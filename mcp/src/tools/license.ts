/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runGcloud, runCurl, getProjectId } from '../utils/gcloud.js';
import { handleToolError, sampleMessage } from '../utils/mcp.js';

export function registerLicenseTools(server: McpServer) {
  // Tool: list_licenses
  server.tool(
    'list_licenses',
    {
      billingAccountId: z.string().optional().describe('The Billing Account ID.'),
      orderId: z.string().optional().describe('The Order ID.'),
      projectId: z.string().optional().describe('The Project ID for quota usage.'),
    },
    async ({ billingAccountId, orderId, projectId }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const token = await runGcloud(['auth', 'print-access-token']);

        let targetBillingAccount = billingAccountId;
        let targetOrder = orderId;

        // Discovery logic
        if (!targetBillingAccount || !targetOrder) {
          console.error('Attempting discovery...');
          const billingAccountsJson = await runGcloud([
            'beta',
            'billing',
            'accounts',
            'list',
            '--format=json',
          ]);
          const billingAccounts = JSON.parse(billingAccountsJson);

          // Add project's billing account if missing
          try {
            const projectBillingJson = await runGcloud([
              'beta',
              'billing',
              'projects',
              'describe',
              targetProject,
              '--format=json',
            ]);
            const projectBilling = JSON.parse(projectBillingJson);
            if (projectBilling.billingAccountName) {
              const projectAccountId = projectBilling.billingAccountName.split('/').pop();
              if (!billingAccounts.some((a: any) => a.name.endsWith(projectAccountId))) {
                billingAccounts.push({
                  name: projectBilling.billingAccountName,
                  open: projectBilling.billingEnabled,
                });
              }
            }
          } catch (_e) {}

          for (const account of billingAccounts) {
            if (!account.open) continue;
            const accountId = account.name.split('/').pop();
            const ordersUrl = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${accountId}/orders`;

            try {
              const ordersStdout = await runCurl([
                '-H',
                `Authorization: Bearer ${token}`,
                '-H',
                `X-Goog-User-Project: ${targetProject}`,
                ordersUrl,
              ]);
              const ordersResponse = JSON.parse(ordersStdout);

              if (ordersResponse.orders) {
                for (const order of ordersResponse.orders) {
                  if (
                    order.displayName &&
                    (order.displayName.includes('Gemini Code Assist') ||
                      order.displayName.includes('Duet AI'))
                  ) {
                    targetBillingAccount = accountId;
                    targetOrder = order.name.split('/').pop();
                    break;
                  }
                }
              }
            } catch (_e) {}
            if (targetBillingAccount && targetOrder) break;
          }

          if (!targetBillingAccount || !targetOrder) {
            const explanation = await sampleMessage(
              server,
              'Explain how to find Billing Account and Order ID for Gemini Code Assist in Cloud Console.',
            );
            return {
              content: [
                { type: 'text', text: explanation || 'Could not find GCA order automatically.' },
              ],
            };
          }
        }

        const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${targetBillingAccount}/orders/${targetOrder}/licensePool:enumerateLicensedUsers/`;
        const stdout = await runCurl([
          '-H',
          `Authorization: Bearer ${token}`,
          '-H',
          `X-Goog-User-Project: ${targetProject}`,
          url,
        ]);

        return { content: [{ type: 'text', text: stdout }] };
      } catch (error: any) {
        return handleToolError(server, error, 'listing licenses');
      }
    },
  );

  // Tool: assign_license
  server.tool(
    'assign_license',
    {
      billingAccountId: z.string().describe('The Billing Account ID'),
      orderId: z.string().describe('The Order ID'),
      projectId: z.string().optional().describe('The Project ID for quota usage.'),
      email: z.string().email().describe('The email of the user to assign the license to'),
    },
    async ({ billingAccountId, orderId, projectId, email }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const token = await runGcloud(['auth', 'print-access-token']);
        const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${billingAccountId}/orders/${orderId}/licensePool:assign/`;
        const data = JSON.stringify({ usernames: [email] });

        const stdout = await runCurl([
          '-X',
          'POST',
          '-d',
          data,
          '-H',
          `Authorization: Bearer ${token}`,
          '-H',
          `X-Goog-User-Project: ${targetProject}`,
          '-H',
          'Content-Type: application/json',
          url,
        ]);

        return { content: [{ type: 'text', text: stdout || 'License assigned successfully.' }] };
      } catch (error: any) {
        return handleToolError(server, error, 'assigning license');
      }
    },
  );

  // Tool: unassign_license
  server.tool(
    'unassign_license',
    {
      billingAccountId: z.string().describe('The Billing Account ID'),
      orderId: z.string().describe('The Order ID'),
      projectId: z.string().optional().describe('The Project ID for quota usage.'),
      email: z.string().email().describe('The email of the user to unassign the license from'),
    },
    async ({ billingAccountId, orderId, projectId, email }) => {
      try {
        const targetProject = await getProjectId(projectId);
        const token = await runGcloud(['auth', 'print-access-token']);
        const url = `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/${billingAccountId}/orders/${orderId}/licensePool:unassign/`;
        const data = JSON.stringify({ usernames: [email] });

        const stdout = await runCurl([
          '-X',
          'POST',
          '-d',
          data,
          '-H',
          `Authorization: Bearer ${token}`,
          '-H',
          `X-Goog-User-Project: ${targetProject}`,
          '-H',
          'Content-Type: application/json',
          url,
        ]);

        return { content: [{ type: 'text', text: stdout || 'License unassigned successfully.' }] };
      } catch (error: any) {
        return handleToolError(server, error, 'unassigning license');
      }
    },
  );
}
