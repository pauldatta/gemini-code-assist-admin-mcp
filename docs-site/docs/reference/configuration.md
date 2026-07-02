# Configuration

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | `gcloud` config | Override the active GCP project |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC chain | Path to a service account key JSON |

## Default project resolution

If `projectId` is not passed to a tool, the server calls:

```
gcloud config get-value project
```

to resolve the active project. Set a default with:

```bash
gcloud config set project YOUR_PROJECT_ID
```

## CMEK for repository indexes

When creating a code repository index, pass the full KMS key resource name:

```
projects/MY_PROJECT/locations/us-central1/keyRings/MY_RING/cryptoKeys/MY_KEY
```

Ensure the GCA service account has `roles/cloudkms.cryptoKeyEncrypterDecrypter`.
