# Gemini Code Assist Extension - User Guide

This guide lists the natural language queries you can ask the Gemini CLI to manage and monitor Gemini Code Assist (GCA).

## 👥 For Admins

### 🔑 License Management
Manage user licenses for Gemini Code Assist.

*   **Check Licenses**:
    *   "Show me all Gemini Code Assist licenses"
    *   "List GCA licenses in billing account `012345-678901-ABCDEF`"
    *   "Who has a license assigned?"

*   **Assign/Revoke Licenses**:
    *   "Assign a GCA license to `jane.doe@example.com`"
    *   "Give a license to `new.dev@example.com` in project `my-project`"
    *   "Unassign the license from `old.dev@example.com`"
    *   "Remove `contractor@example.com` from GCA"

### 📊 Usage & Insights
Track adoption and usage of Gemini Code Assist.

*   **Check Status**:
    *   "Is Gemini Code Assist enabled in this project?"
    *   "Check GCA status for project `vital-octagon-19612`"

*   **View Metrics**:
    *   "How many users used Gemini Code Assist in the last 28 days?"
    *   "Show me GCA usage trends for the last 6 months"
    *   "Summarize the active users for project `my-project`"

### 🛡️ Permissions & Security
Understand your administrative capabilities.

*   **Check Permissions**:
    *   "Am I a Gemini Admin?"
    *   "What permissions do I have for GCA?"
    *   "Why can't I assign licenses?"

---

## 💻 For Developers & Platform Engineers

### 🧠 Code Customization (RAG)
Manage private codebase awareness (RAG) for better code suggestions.

*   **Manage Indexes**:
    *   "List all code repository indexes"
    *   "Create a new code index called `main-index` in `us-central1`"

*   **Manage Developer Connect (Prerequisite)**:
    *   "List my Developer Connect connections"
    *   "Create a GitHub connection named `my-conn` in `us-central1`"
    *   "Link the `react-app` repo to my `github-connection`"
    *   "Link `https://github.com/owner/repo` to connection `my-conn`"

*   **Manage Repository Groups**:
    *   "Create a repository group for the `frontend-team`"
    *   "Add the `react-app` repo to the `frontend` group"
    *   "List all repository groups in index `main-index`"
    *   "Delete the `legacy-repos` group"

*   **Access Control (RBAC)**:
    *   "Grant `frontend-team@example.com` access to the `frontend` repository group"
    *   "Revoke access for `intern@example.com` from the `sensitive-repos` group"
    *   "Who has access to the `backend` repository group?"

---

## 📸 Examples

> *[Placeholders for GIFs/Screenshots of the above interactions]*

### Example: License Assignment
> *[Insert GIF of assigning a license]*

### Example: Usage Insights
> *[Insert Screenshot of the metrics summary]*

### Example: Permission Check
> *[Insert Screenshot of the permission explanation]*
