# Developer Connect & Gemini Code Assist Integration

**Source:** [Configure Developer Connect](https://cloud.google.com/developer-connect/docs/configure)

## Overview
Gemini Code Assist Enterprise uses **Developer Connect** to securely access and index private repositories for code customization (RAG).

## Workflow

### 1. Create a Connection
First, you create a connection to your source code management (SCM) provider (GitHub, GitLab, etc.).

```bash
gcloud developer-connect connections create CONNECTION_ID \
    --location=REGION \
    --github-config-app-installation-id=INSTALLATION_ID \
    --project=PROJECT_ID
```
*   This usually requires authorizing the Google Cloud Developer Connect app on your SCM provider.

### 2. Link Repositories
Once the connection is established, you link specific Git repositories to it.

```bash
gcloud developer-connect connections git-repository-links create LINK_ID \
    --connection=CONNECTION_ID \
    --region=REGION \
    --git-repository-uri=https://github.com/OWNER/REPO.git \
    --project=PROJECT_ID
```

### 3. Use in Gemini Code Assist
When creating a **Repository Group** for Gemini Code Assist, you reference these linked repositories.

The `resource` field in the JSON configuration for `create_repository_group` refers to the Developer Connect repository link resource name:

`projects/PROJECT_ID/locations/REGION/connections/CONNECTION_ID/gitRepositoryLinks/LINK_ID`

## Extension Implications
The current extension tools for creating repository groups expect a `resource` name.
*   **Current State**: The user must manually create the connection and link using `gcloud` or Console, then provide the full resource path to the extension.
*   **Future Enhancement**: The extension could wrap the `developer-connect` commands to streamline this process, but it involves OAuth flows (for GitHub) which might be complex to handle purely via CLI/MCP without a browser redirect handler.
