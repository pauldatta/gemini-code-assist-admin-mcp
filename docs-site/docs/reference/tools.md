# All Tools

The MCP server exposes 16 tools across four categories.

---

## Status & Permissions

### `check_gca_status`

Checks whether the Gemini Code Assist API (`cloudaicompanion.googleapis.com`) is enabled in a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | GCP project ID. Defaults to `gcloud config get-value project`. |

**Example prompt:** *"Is GCA enabled in project my-org-prod?"*

---

### `check_admin_permissions`

Checks whether the authenticated user holds GCA admin IAM roles.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | GCP project ID. |

**Example prompt:** *"Do I have GCA admin rights?"*

---

## License Management

### `list_licenses`

Lists all users with active GCA licenses under a billing account and order.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `billingAccountId` | string | No | Billing account ID. Auto-discovered if omitted. |
| `orderId` | string | No | Order ID. Auto-discovered if omitted. |
| `projectId` | string | No | GCP project for quota. |

**Example prompt:** *"List all GCA license holders."*

---

### `assign_license`

Assigns a GCA license to a user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `billingAccountId` | string | Yes | Billing account ID. |
| `orderId` | string | Yes | Order ID. |
| `email` | string | Yes | User email address. |
| `projectId` | string | No | GCP project for quota. |

**Example prompt:** *"Give a GCA license to engineer@example.com."*

---

### `unassign_license`

Removes a GCA license from a user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `billingAccountId` | string | Yes | Billing account ID. |
| `orderId` | string | Yes | Order ID. |
| `email` | string | Yes | User email address. |
| `projectId` | string | No | GCP project for quota. |

**Example prompt:** *"Remove the GCA license from contractor@example.com."*

---

## Metrics

### `get_metrics`

Retrieves unique active GCA user counts from Cloud Logging.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | GCP project ID. |
| `days` | number | No | Lookback window in days. Default: `28`. |

**Example prompt:** *"How many developers used GCA in the last 14 days?"*

---

## Repository Indexing

### `list_code_repository_indexes`

Lists code repository indexes in a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. Default: `us-central1`. |

---

### `create_code_repository_index`

Creates a new code repository index, optionally with CMEK encryption.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Unique index identifier. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. Default: `us-central1`. |
| `kmsKeyName` | string | No | CMEK key resource name. |

---

### `create_repository_group`

Creates a repository group inside an index.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Parent index ID. |
| `groupId` | string | Yes | Repository group ID. |
| `repositories` | array | No | List of repository resource names. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

### `list_repository_groups`

Lists all repository groups in an index.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Parent index ID. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

### `delete_repository_group`

Deletes a repository group.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Parent index ID. |
| `groupId` | string | Yes | Repository group ID. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

### `grant_repository_group_access`

Grants a user or service account access to a repository group.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Parent index ID. |
| `groupId` | string | Yes | Repository group ID. |
| `member` | string | Yes | IAM member (e.g. `user:dev@example.com`). |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

### `revoke_repository_group_access`

Revokes access from a repository group.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexId` | string | Yes | Parent index ID. |
| `groupId` | string | Yes | Repository group ID. |
| `member` | string | Yes | IAM member to remove. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

## Developer Connect

### `list_developer_connect_connections`

Lists Developer Connect connections in a project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |

---

### `create_developer_connect_connection`

Creates a new Developer Connect connection to a source control provider.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionId` | string | Yes | Unique connection identifier. |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. Default: `us-central1`. |

---

### `link_git_repository`

Links a Git repository to a Developer Connect connection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionId` | string | Yes | Developer Connect connection ID. |
| `remoteUri` | string | Yes | Git repository URL (e.g. `https://github.com/org/repo`). |
| `projectId` | string | No | GCP project ID. |
| `location` | string | No | Region. |
