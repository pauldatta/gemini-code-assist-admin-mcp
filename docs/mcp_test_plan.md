# gcaAdminServer MCP Test Plan

This document outlines the test procedures for verifying the `gcaAdminServer` MCP tools. It is designed to be repeatable and covers both read-only and write operations (with appropriate cautions).

## Prerequisites

1.  **Gcloud Authentication**: Ensure you are authenticated with `gcloud auth login` and `gcloud auth application-default login`.
2.  **Project Selection**: Identify a target Google Cloud Project ID (e.g., `vital-octagon-19612` or `pauldatta-sandbox-237531`).
3.  **MCP Server**: Ensure the `gcaAdminServer` is running and connected.

## Test Scenarios

### Scenario 1: Health & Permissions Check
**Objective**: Verify the environment is ready for GCA management.

*   **Step 1.1**: Check GCA API Status.
    *   **Tool**: `check_gca_status`
    *   **Expected Output**: "Gemini Code Assist API ... is ENABLED".
*   **Step 1.2**: Check Admin Permissions.
    *   **Tool**: `check_admin_permissions`
    *   **Expected Output**: JSON object with `is_admin: true` and list of roles.

### Scenario 2: License Discovery
**Objective**: Verify license listing and auto-discovery behavior.
*   **Note**: This tool attempts to auto-discover Billing Account and Order IDs. If it fails, it may ask for manual input. We want to verify it handles "no licenses found" gracefully if possible, or clearly indicates missing IDs.

*   **Step 2.1**: List Licenses (Auto-discovery).
    *   **Tool**: `list_licenses` (no arguments other than `projectId` if needed).
    *   **Expected Output**:
        *   *Case A (Licenses exist)*: List of license assignments.
        *   *Case B (No licenses/Discovery failed)*: "Could not automatically find...".
        *   **Verification**: Ensure it doesn't hang or crash.

### Scenario 3: Observability
**Objective**: Verify metrics retrieval.

*   **Step 3.1**: Get Metrics.
    *   **Tool**: `get_metrics` (e.g., `days: 28`).
    *   **Expected Output**: "Found X unique users...".

### Scenario 4: RAG Engine (Code Customization)
**Objective**: Verify access to Code Repository Indexes and Groups.

*   **Step 4.1**: List Indexes.
    *   **Tool**: `list_code_repository_indexes`.
    *   **Expected Output**: JSON list of indexes (or empty list `[]`).
*   **Step 4.2**: List Repository Groups (if Index exists).
    *   **Tool**: `list_repository_groups` (requires `indexId`).
    *   **Expected Output**: JSON list of groups.

---

## Future / Destructive Tests (CAUTION)
**Status**: **SKIP** for initial verification.
**Objective**: Verify creation and deletion of resources.

> [!CAUTION]
> These tests modify cloud resources. Ensure you are using a sandbox project.

*   **Step 5.1**: Create Code Repository Index.
    *   **Tool**: `create_code_repository_index`.
*   **Step 5.2**: Create Repository Group.
    *   **Tool**: `create_repository_group`.
*   **Step 5.3**: Delete Repository Group.
    *   **Tool**: `delete_repository_group`.
