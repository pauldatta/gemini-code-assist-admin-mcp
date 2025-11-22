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

## Custom Commands

| Command | Description |
| :--- | :--- |
| `/gca:status` | Checks GCA status for the current project. |
| `/gca:admin` | Checks if you have admin permissions. |
| `/gca:metrics` | Gets GCA usage metrics. |

## Requirements

- `gcloud` CLI installed and authenticated.
- Appropriate IAM roles (e.g., `roles/cloudaicompanion.admin`, `roles/serviceusage.serviceUsageConsumer`).
