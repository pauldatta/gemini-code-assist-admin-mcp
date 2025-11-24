# Gemini Code Assist Code Customization (JSON)

**Source:** [Code Customization - JSON](https://cloud.google.com/gemini/docs/codeassist/code-customization#json)

## Overview
Gemini Code Assist allows you to customize code suggestions based on your private repositories. You can define a group of repositories to be indexed using a JSON file.

## JSON Format
The configuration file is a JSON array of objects, where each object represents a repository to be included in the index.

### Structure
```json
[
  {
    "resource": "REPOSITORY_RESOURCE_NAME",
    "branchPattern": "BRANCH_PATTERN"
  }
]
```

### Fields
- **`resource`**: The full resource name of the repository.
  - Format: `projects/PROJECT_ID/locations/LOCATION/connections/CONNECTION_ID/gitRepositoryLinks/LINK_ID`
  - **Note**: You can use the `link_git_repository` tool to create these links.
- **`branchPattern`**: A pipe-separated string of branch names or patterns to index.
  - Example: `main|dev` (indexes both `main` and `dev` branches)
  - Example: `dev` (indexes only the `dev` branch)

## Usage
This JSON file is used with the `gcloud` command to create a repository group.

```bash
gcloud gemini code-repository-indexes repository-groups create GROUP_ID \
    --project=PROJECT_ID \
    --location=LOCATION \
    --repositories=FILE_PATH
```

*   `GROUP_ID`: A unique identifier for the repository group.
*   `PROJECT_ID`: Your Google Cloud project ID.
*   `LOCATION`: The region (e.g., `us-central1`).
*   `FILE_PATH`: The path to your JSON configuration file.

## Extension Enhancement Opportunities
- **Configuration Management:** The extension could provide a UI or command to generate this JSON file based on the user's workspace or selected repositories.
- **Validation:** The extension could validate the JSON structure and ensure repository resource names are correctly formatted.
- **Automation:** The extension could wrap the `gcloud` command to apply the configuration directly from the editor.
