# Gemini Code Assist with CMEK

**Source:** [Encrypt data with customer-managed encryption keys](https://cloud.google.com/gemini/docs/codeassist/encrypt-data-cmek)

## Overview
Gemini Code Assist supports Customer-Managed Encryption Keys (CMEK) to give you control over the keys used to encrypt your data at rest. This is particularly relevant when creating code repository indexes.

## Enabling CMEK
To use CMEK, you must specify the `--kms-key` flag when creating a code repository index using the `gcloud` CLI.

### Command
```bash
gcloud gemini code-repository-indexes create INDEX_ID \
    --project=PROJECT_ID \
    --location=LOCATION \
    --repository-group=REPOSITORY_GROUP \
    --kms-key="projects/KEY_PROJECT_ID/locations/LOCATION/keyRings/KEYRING_NAME/cryptoKeys/KEY_NAME"
```

### Parameters
- **`INDEX_ID`**: A unique identifier for the index.
- **`--repository-group`**: The ID of the repository group to index.
- **`--kms-key`**: The full resource name of the Cloud KMS key.
  - Format: `projects/KEY_PROJECT_ID/locations/LOCATION/keyRings/KEYRING_NAME/cryptoKeys/KEY_NAME`

## Prerequisites
- A Cloud KMS key ring and key must be created in the same location as the Gemini Code Assist resources.
- The Gemini Code Assist service agent must have the `Cloud KMS CryptoKey Encrypter/Decrypter` role on the key.
