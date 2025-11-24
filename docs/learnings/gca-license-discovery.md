# Gemini Code Assist License Discovery

## Overview
This document outlines the programmatic approach to discovering Gemini Code Assist (GCA) licenses without requiring manual Billing Account ID and Order ID input.

## Discovery Logic
The `list_licenses` tool has been enhanced with an automatic discovery mechanism:

1.  **Billing Account Scanning**:
    *   Lists all accessible billing accounts using `gcloud beta billing accounts list`.
    *   Iterates through each open account.

2.  **Project Billing Lookup**:
    *   Explicitly looks up the billing account for the target project using `gcloud beta billing projects describe`.
    *   Adds this account to the scan list if not already present (crucial for cases where the account isn't in the global list).

3.  **Order Enumeration**:
    *   For each billing account, lists orders using the `Cloud Commerce Consumer Procurement API`.
    *   Endpoint: `https://cloudcommerceconsumerprocurement.googleapis.com/v1/billingAccounts/{accountId}/orders`

4.  **Filtering**:
    *   Filters orders by `displayName` containing "Gemini Code Assist" or "Duet AI".

## Read-Only Considerations
To respect read-only constraints:
*   **API Status Check**: The tool checks if `cloudcommerceconsumerprocurement.googleapis.com` is enabled in the quota project before making requests.
*   **No Auto-Enablement**: If the API is disabled, it logs a warning/error instead of attempting to enable it automatically. This prevents unintended configuration changes.

## Troubleshooting
*   **Missing Orders**: Ensure the `Cloud Commerce Consumer Procurement API` is enabled in the project used for quota (usually the target project or default project).
*   **Permissions**: The user needs permissions to view billing accounts and orders (e.g., `roles/billing.viewer`, `roles/consumerprocurement.viewer`).
