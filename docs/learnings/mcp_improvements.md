# MCP Improvements: Sampling & Elicitation

## Overview
This document outlines how the **Model Context Protocol (MCP)** features—specifically **Sampling** and **Elicitation**—can be leveraged to improve the `gca-admin-helper` extension.

## 1. Elicitation (`elicitation/requestInput`)
**Concept:** Allows the server to request input from the user via the client interface. This is superior to erroring out and asking the user to retry with arguments.

### Opportunities in `gca-admin-helper`:

#### A. Interactive License Management (`list_licenses`)
- **Current Behavior:** If `billingAccountId` or `orderId` are missing, the tool attempts auto-discovery. If that fails or finds nothing, it returns a text message asking the user to provide them manually.
- **Improved Behavior:**
    - If auto-discovery fails, use `elicitation/requestInput` to ask the user for the Billing Account and Order ID.
    - If multiple Billing Accounts or Orders are found, use `elicitation/requestInput` with a schema defining an `enum` of the found options, allowing the user to select the correct one from a dropdown/list.

#### B. User Assignment (`assign_license` / `unassign_license`)
- **Current Behavior:** Requires `email` as an argument.
- **Improved Behavior:** If `email` is missing, use `elicitation/requestInput` to ask for the email address.

## 2. Sampling (`sampling/createMessage`)
**Concept:** Allows the server to request the client (IDE/Agent) to generate content using an LLM. This enables "agentic" capabilities within the tool execution.

### Opportunities in `gca-admin-helper`:

#### A. Intelligent Error Analysis
- **Current Behavior:** Returns raw `gcloud` error messages which can be cryptic.
- **Improved Behavior:** When a `gcloud` command fails, use `sampling/createMessage` to send the error to the LLM and ask for a user-friendly explanation and potential fix (e.g., "It looks like you're missing the `serviceusage.services.use` permission. Ask your admin to grant...").

#### B. Enhanced Metric Summaries (`get_metrics`)
- **Current Behavior:** Returns a simple count of unique users and raw CSV data.
- **Improved Behavior:** Use `sampling/createMessage` to analyze the raw CSV data and provide a natural language summary of usage trends (e.g., "Usage has increased by 20% over the last week...").

#### C. Permission Explanation (`check_admin_permissions`)
- **Current Behavior:** Returns a JSON object with boolean `is_admin` and a list of roles.
- **Improved Behavior:** Use `sampling/createMessage` to explain the user's permissions in plain English. For example, "You have the `roles/viewer` role, which allows read-only access, but you are missing `roles/resourcemanager.projectIamAdmin` needed to assign licenses."

## 3. Lifecycle & Capabilities
- **Implementation:**
    - Update `initialize` handler to check `client.capabilities.sampling` and `client.capabilities.roots` (or `experimental` capabilities for elicitation if it's still experimental).
    - Gracefully degrade if the client doesn't support these features (fallback to current behavior).

## Summary of Proposed Changes
1.  **Modify `list_licenses`**: Implement fallback to `elicitation/requestInput` for missing IDs.
2.  **Modify `check_admin_permissions`**: Add an optional `sampling` step to explain permissions if the client supports it.
3.  **Global Error Handler**: Wrap tool executions to catch errors and optionally sample an explanation.
