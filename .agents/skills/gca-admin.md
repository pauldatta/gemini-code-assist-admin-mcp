---
name: gca-admin
description: Manage Gemini Code Assist (GCA) licenses, API status, usage metrics, and code customization indexes.
---

# Gemini Code Assist (GCA) Admin Skill

This skill provides comprehensive administrative capabilities for Gemini Code Assist (GCA) in Google Cloud.

## Tools Overview

| Tool | Purpose |
| :--- | :--- |
| `check_gca_status` | Verify if GCA API is enabled in a project. |
| `check_admin_permissions` | Check your current IAM roles for GCA admin tasks. |
| `list_licenses` | List all users assigned a GCA license. |
| `assign_license` | Grant a license to a user email. |
| `get_metrics` | View unique user counts and trends from logs. |
| `list_code_repository_indexes` | View RAG/Code Customization status. |

## Usage Patterns

- **Automatic Discovery**: If you don't know your Billing Account or Order ID, simply call the tools without them. The server will automatically scan your accessible accounts to find the GCA license pool.
- **AI-Enhanced Errors**: Every failure is analyzed by a local "expert" model (via MCP Sampling) to give you plain-English instructions on how to fix permission or configuration issues.
- **Project Scope**: Defaults to the current `gcloud` project, but can be overridden per call.

## Examples

- "Who has a GCA license in project `my-corp-prod`?"
- "I need to assign a license to `new-hire@example.com`."
- "Show me usage stats for the last two weeks."
- "Am I allowed to manage repository groups in us-central1?"
