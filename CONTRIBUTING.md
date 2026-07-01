# Contributing to GCA Admin Helper

Thank you for your interest in improving the GCA Admin Helper! We welcome contributions from humans and AI agents alike.

## 🛣️ Development Roadmap
- [ ] Add unit tests for `gcloud` output parsers.
- [ ] Implement GitHub Actions for automated releases.
- [ ] Add support for multiple Cloud Billing Accounts in `list_licenses`.
- [ ] Create a web-based dashboard for GCA metrics.

## 🛠️ Setup Instructions
1.  **Fork and Clone** the repository.
2.  **Install Dependencies**: `npm install`.
3.  **Build**: `npm run build`.
4.  **Link for Testing**: `agy plugin link plugins/gca-admin`.

## 📜 Code of Conduct
- Be respectful and professional.
- Prioritize security: Never expose sensitive tokens or PII in logs.
- Follow the modular pattern: Keep tools decoupled.

## 📤 Pull Request Process
1.  Ensure all code is built and linted.
2.  Update the `AGENTS.md` and `.agents/skills/` if you add new capabilities.
3.  Describe your changes in detail, including how you tested them.

## 🤖 AI Contribution Guidelines
If you are an AI agent:
- Follow the instructions in `AGENTS.md` strictly.
- Provide a clear summary of your changes in your PR description.
- Use the `feat:` or `fix:` commit message conventions.
