# Canary API Endpoint

This API endpoint manages the canary enablement of Claude Sonnet 3.5 for selected clients.

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Configure the environment variables:
   - `ADMIN_API_KEY`: Your admin API key
   - `ADMIN_API_BASE`: Base URL for the admin API

## Usage

Send a POST request to `/api/admin/canary/enable` with:

### Headers
- `Content-Type: application/json`
- `x-api-key`: Your admin API key

### Body
```json
{
  "model": "claude-sonnet-3.5",
  "clients": "client1,client2",  // Optional: specific clients
  "canaryCount": 2,             // Optional: number of random clients if no specific clients
  "apply": false                // Optional: set to true to actually apply changes
}
```

### Example (dry run)
```bash
curl -X POST https://your-vercel-app.vercel.app/api/admin/canary/enable \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-admin-key" \
  -d '{"model": "claude-sonnet-3.5", "canaryCount": 2}'
```

### Example (apply changes)
```bash
curl -X POST https://your-vercel-app.vercel.app/api/admin/canary/enable \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-admin-key" \
  -d '{"model": "claude-sonnet-3.5", "clients": "client1,client2", "apply": true}'
```

## Response

```json
{
  "success": true,
  "dryRun": true,
  "changes": [
    {
      "clientId": "client1",
      "model": "claude-sonnet-3.5",
      "status": "would_enable",
      "dryRun": true
    }
  ],
  "timestamp": "2025-10-23T12:00:00Z"
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 400: Bad Request (missing/invalid parameters)
- 403: Forbidden (invalid API key)
- 405: Method Not Allowed (not POST)
- 500: Internal Server Error (with error details)

## Rate Limiting

The API includes built-in rate limiting of 1 request per second when applying changes.