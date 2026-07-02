# Requirements

## Runtime

- **Node.js 18+**
- **`gcloud` CLI** — installed and authenticated

## Authentication

```bash
gcloud auth login
gcloud auth application-default login
```

## IAM Roles

| Capability | Required role |
|-----------|--------------|
| Check API status | `roles/serviceusage.serviceUsageViewer` |
| Enable/disable APIs | `roles/serviceusage.serviceUsageAdmin` |
| List/assign licenses | `roles/cloudaicompanion.admin` |
| View metrics | `roles/logging.viewer` |
| Manage repo indexes | `roles/cloudaicompanion.admin` |
| Developer Connect | `roles/developerconnect.admin` |

!!! tip
    `roles/cloudaicompanion.admin` covers most operations. For read-only auditing, use `roles/cloudaicompanion.viewer` + `roles/logging.viewer`.
