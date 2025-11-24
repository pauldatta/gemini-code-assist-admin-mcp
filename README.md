# GCA Admin Helper Extension

A Gemini CLI extension for managing Gemini Code Assist (GCA) licenses, checking status, and viewing metrics.

## Installation

1.  **Clone or Download** this repository.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Build**:
    ```bash
    npm run build
    ```
4.  **Link Extension**:
    ```bash
    gemini extensions link .
    ```

## Tools

This extension provides the following tools:

| Tool Name | Description | Example Prompt |
| :--- | :--- | :--- |
| `check_gca_status` | Checks if GCA API is enabled and verifies IAM roles. | "Check GCA status for project `my-project`" |
| `check_admin_permissions` | Checks if current user has admin roles. | "Am I an admin in project `my-project`?" |
| `list_licenses` | Lists users with GCA licenses. | "List GCA licenses for billing account `X` and order `Y`" |
| `assign_license` | Assigns a GCA license to a user. | "Assign GCA license to `user@example.com`" |
| `unassign_license` | Unassigns a GCA license from a user. | "Unassign GCA license from `user@example.com`" |
| `get_metrics` | Retrieves unique user counts from Cloud Logging. | "Show me GCA usage metrics for the last 28 days" |
| `list_code_repository_indexes` | Lists code repository indexes. | "List code repository indexes in project `my-project`" |
| `create_code_repository_index` | Creates a code repository index (supports CMEK). | "Create index `my-index` with CMEK key `projects/...`" |
| `create_repository_group` | Creates a repository group. | "Create repository group `my-group` in index `my-index`" |
| `list_repository_groups` | Lists repository groups. | "List repository groups in index `my-index`" |
| `delete_repository_group` | Deletes a repository group. | "Delete repository group `my-group`" |
| `grant_repository_group_access` | Grants access to a repository group. | "Grant access to `user@example.com` for group `my-group`" |
| `grant_repository_group_access` | Grants access to a repository group. | "Grant access to `user@example.com` for group `my-group`" |
| `revoke_repository_group_access` | Revokes access from a repository group. | "Revoke access from `user@example.com` for group `my-group`" |
| `list_developer_connect_connections` | Lists Developer Connect connections. | "List my Developer Connect connections" |
| `create_developer_connect_connection` | Creates a Developer Connect connection. | "Create a GitHub connection named `my-conn` in `us-central1`" |
| `link_git_repository` | Links a Git repository to a connection. | "Link `https://github.com/owner/repo` to connection `my-conn`" |

## ✨ Features

### 🧠 Intelligent Insights (MCP Sampling)
This extension uses **MCP Sampling** to provide natural language explanations:
-   **Error Analysis**: Explains `gcloud` errors in plain English and suggests fixes.
-   **Permission Explanations**: Breaks down your IAM roles and what you can/cannot do.
-   **Metric Summaries**: Analyzes usage trends from raw data.

## Custom Commands

| Command | Description |
| :--- | :--- |
| `/gca:status` | Checks GCA status for the current project. |
| `/gca:admin` | Checks if you have admin permissions. |
| `/gca:metrics` | Gets GCA usage metrics. |
| `/gca:create_index` | Create a new code repository index. |
| `/gca:create_group` | Create a new repository group. |
| `/gca:list_groups` | List repository groups. |
| `/gca:delete_group` | Delete a repository group. |
| `/gca:grant_access` | Grant access to a repository group. |
| `/gca:revoke_access` | Revoke access from a repository group. |

## Requirements

- `gcloud` CLI installed and authenticated.
- Appropriate IAM roles (e.g., `roles/cloudaicompanion.admin`, `roles/serviceusage.serviceUsageConsumer`).
