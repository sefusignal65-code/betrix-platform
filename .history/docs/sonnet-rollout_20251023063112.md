# Rollout plan: Enable Claude Sonnet 3.5

This document describes how to enable Claude Sonnet 3.5 for clients using the admin API.

Prerequisites
- Admin API base URL and API key with permissions to update client model settings.
- Node.js (14+) installed to run the provided scripts.

Files
- `scripts/enable-sonnet.js` - enables Sonnet for given client IDs (dry-run by default)
- `scripts/verify-sonnet.js` - verifies model availability for a client

Canary flow (recommended)
1. Prepare a short list of 2-5 canary client IDs.
2. Run a dry-run to validate calls and URLs:

   node scripts/enable-sonnet.js --apiBase=https://api.example.com --apiKey=XXX --clients=clientA,clientB --model=claude-sonnet-3.5 --canaryCount=2

3. If dry-run output looks correct, run with `--apply` to actually enable the model for the canary:

   node scripts/enable-sonnet.js --apiBase=https://api.example.com --apiKey=XXX --clients=clientA,clientB --model=claude-sonnet-3.5 --canaryCount=2 --apply

4. Verify with the verify script:

   node scripts/verify-sonnet.js --apiBase=https://api.example.com --apiKey=XXX --client=clientA --model=claude-sonnet-3.5

Global rollout
- After successful canary, run without `--canaryCount` (or set to 0) and `--apply` to enable for all provided clients.
- Monitor logs and metrics closely.

Rollback
- If the admin API supports disabling models, run the same script with `model=claude-sonnet-3.5&enabled=false` (or modify the script accordingly) in emergency.

Security
- Do not commit API keys. Use environment variables or a secrets manager.

Support
- If you want, I can adapt the scripts to your real admin API endpoints and run them for you after you provide credentials securely.
