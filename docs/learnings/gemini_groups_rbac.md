# Repository Groups and RBAC

**Source:** [Manage repository groups](https://cloud.google.com/gemini/docs/codeassist/manage-repositories)

## Overview
Repository groups allow you to group repositories within a code repository index and apply IAM policies to control access. This enables granular Role-Based Access Control (RBAC) for code customization.

## Managing Groups

### Create a Group
Use `gcloud gemini code-repository-indexes repository-groups create` to create a group. You specify the repositories and branch patterns to include.

### IAM and RBAC
To control access to a repository group, you manage its IAM policy.
- **Role:** `roles/cloudaicompanion.repositoryGroupsUser` (or similar custom roles) grants access to use the group.
- **Grant Access:** Update the IAM policy to add a user or group with the required role.
- **Revoke Access:** Update the IAM policy to remove the user or group.

## Extension Tools
This extension provides tools to simplify these operations:
- `create_repository_group`: Creates a new group.
- `list_repository_groups`: Lists existing groups.
- `delete_repository_group`: Deletes a group.
- `grant_repository_group_access`: Grants a user access to a group.
- `revoke_repository_group_access`: Revokes a user's access to a group.
