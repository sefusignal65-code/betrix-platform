# BETRIX Platform Documentation

## Overview

BETRIX is a betting platform that enables secure and reliable sports betting with affiliate capabilities.

## Project Structure

```plaintext
frontend/
├── api/          # API endpoints and utilities
├── src/          # Source code
├── tests/        # Test files
└── config/       # Configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Building

```bash
npm run build
```

## API Documentation

### Canary Endpoints

#### POST /api/admin/canary/enable

Enable a model for specific clients in canary mode.

Headers:

- X-API-Key: Admin API key for authentication

Body:

```json
{
  "model": "string",
  "clients": "string[]",
  "canaryCount": "number",
  "apply": "boolean"
}
```

### Environment Variables

- `ADMIN_API_KEY`: Admin API key for authentication
- `ADMIN_API_BASE`: Base URL for admin API endpoints

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## CI/CD

The project uses GitHub Actions for CI/CD:

- Runs on push to main and pull requests
- Executes linting and tests
- Deploys to Vercel on successful main branch builds