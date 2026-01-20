# @fiberai/sdk

Official TypeScript SDK for the [Fiber AI](https://fiber.ai) API.

## Installation

```bash
npm install @fiberai/sdk
# or
yarn add @fiberai/sdk
# or
pnpm add @fiberai/sdk
```

## Quick Start

```typescript
import {
  createClient,
  combinedSearch,
  pollCombinedSearch,
  type Client,
} from "@fiberai/sdk";

// Create a custom client (optional - a default client is pre-configured)
const client: Client = createClient({
  baseUrl: "https://api.fiber.ai",
});

// Submit a combined search
const submitResponse = await combinedSearch({
  body: {
    apiKey: "your-api-key",
    filters: {
      title: ["Software Engineer"],
      location: ["San Francisco, CA"],
    },
  },
  client, // Optional - uses default client if not provided
});

if (submitResponse.data?.requestId) {
  // Poll for results
  const pollResponse = await pollCombinedSearch({
    body: {
      apiKey: "your-api-key",
      requestId: submitResponse.data.requestId,
    },
    client,
  });

  console.log(pollResponse.data);
}
```

## Using the Default Client

The SDK comes with a pre-configured client that connects to `https://alpha.api.fiber.ai`:

```typescript
import { healthCheck, getOrgCredits } from "@fiberai/sdk";

// Uses the default client automatically
const healthResponse = await healthCheck();
console.log(healthResponse.data);

// Get organization credits
const creditsResponse = await getOrgCredits({
  query: { apiKey: "your-api-key" },
});
console.log(creditsResponse.data);
```

## Configuration

### Custom Client

Create a custom client with different settings:

```typescript
import { createClient, type Client } from "@fiberai/sdk";

// Production
const prodClient: Client = createClient({
  baseUrl: "https://api.fiber.ai",
});

// Alpha/Development
const alphaClient: Client = createClient({
  baseUrl: "https://alpha.api.fiber.ai",
});
```

### API Key

Your API key is typically passed in the request body or query parameters:

```typescript
// In body (POST requests)
await combinedSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    filters: { /* ... */ },
  },
});

// In query (GET requests)
await getOrgCredits({
  query: { apiKey: process.env.FIBERAI_API_KEY },
});
```

## TypeScript Support

This SDK is fully typed. All request and response types are generated from the OpenAPI specification:

```typescript
import type {
  CombinedSearchData,
  CombinedSearchResponse,
  PollCombinedSearchData,
  PollCombinedSearchResponse,
  TriggerContactEnrichmentData,
  TriggerContactEnrichmentResponse,
} from "@fiberai/sdk";
```

## Available Methods

The SDK provides methods for all Fiber AI API endpoints:

### Search
- `combinedSearch` - Submit a combined search for companies and people
- `pollCombinedSearch` - Poll for search results
- `syncCombinedSearch` - Synchronous combined search
- `companySearch` - Search for companies
- `peopleSearch` - Search for people

### Contact Enrichment
- `triggerContactEnrichment` - Start contact enrichment
- `pollContactEnrichmentResult` - Poll for enrichment results
- `syncContactEnrichment` - Synchronous contact enrichment
- `startBulkContactEnrichment` - Bulk contact enrichment
- `pollBulkContactEnrichmentResult` - Poll bulk results

### Live Enrichment
- `profileLiveEnrich` - Real-time LinkedIn profile enrichment
- `companyLiveEnrich` - Real-time company enrichment
- `profilePostsLiveFetch` - Fetch LinkedIn profile posts
- `companyPostsLiveFetch` - Fetch company posts

### Company Information
- `companyTypeahead` - Company name autocomplete
- `locationTypeahead` - Location autocomplete
- `bulkCompanyLogos` - Get company logos in bulk

### Utilities
- `healthCheck` - API health check
- `getOrgCredits` - Get organization credit balance
- `emailBounceDetection` - Check email deliverability

Refer to the [API documentation](https://alpha.api.fiber.ai/scalar) for the complete list.

## Error Handling

```typescript
import { combinedSearch } from "@fiberai/sdk";

const response = await combinedSearch({
  body: {
    apiKey: "your-key",
    filters: {},
  },
});

if (response.error) {
  // API returned an error response
  console.error("API Error:", response.error);
} else {
  // Success
  console.log("Data:", response.data);
}
```

### Throwing on Errors

You can configure the SDK to throw errors instead:

```typescript
import { combinedSearch } from "@fiberai/sdk";

try {
  const response = await combinedSearch<true>({
    body: { apiKey: "your-key", filters: {} },
    throwOnError: true,
  });
  // response.data is guaranteed to exist
  console.log(response.data);
} catch (error) {
  console.error("Request failed:", error);
}
```

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Generate SDK from OpenAPI spec
npm run generate

# Build the SDK
npm run build

# Type check
npm run typecheck
```

### Regenerating the SDK

To regenerate the SDK from the latest OpenAPI specification:

```bash
npm run generate
npm run build
```

This will fetch the OpenAPI spec from `https://alpha.api.fiber.ai/openapi.json` and regenerate the TypeScript types and SDK methods.

## License

MIT
