# @fiberai/sdk

Official TypeScript/JavaScript SDK for the [Fiber AI](https://fiber.ai) API - Enterprise B2B data intelligence platform.

[![npm version](https://img.shields.io/npm/v/@fiberai/sdk.svg)](https://www.npmjs.com/package/@fiberai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Core Features](#core-features)
  - [Company & People Search](#company--people-search)
  - [Contact Enrichment](#contact-enrichment)
  - [LinkedIn Live Enrichment](#linkedin-live-enrichment)
  - [Saved Searches (Audiences)](#saved-searches-audiences)
  - [Exclusion Lists](#exclusion-lists)
  - [Google Maps Search](#google-maps-search)
  - [AI-Powered Research](#ai-powered-research)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Rate Limits & Credits](#rate-limits--credits)
- [Support](#support)

## Installation

```bash
npm install @fiberai/sdk
# or
yarn add @fiberai/sdk
# or
pnpm add @fiberai/sdk
```

**Requirements:** Node.js 18.0.0 or higher

## Quick Start

```typescript
import { peopleSearch, companySearch, getOrgCredits } from '@fiberai/sdk';

// Check your organization's credit balance
const credits = await getOrgCredits({
  query: { apiKey: 'your-api-key' }
});

console.log(`Available credits: ${credits.data.output.available}`);

// Search for companies
const companies = await companySearch({
  body: {
    apiKey: 'your-api-key',
    searchParams: {
      standardIndustries: ['Software', 'Information Technology'],
      employeeCountRange: { gte: 100, lte: 1000 },
      location: {
        countries: ['USA']
      }
    },
    pageSize: 25
  }
});

// Search for people
const people = await peopleSearch({
  body: {
    apiKey: 'your-api-key',
    searchParams: {
      title: ['CEO', 'CTO', 'VP Engineering'],
      location: {
        cities: ['San Francisco, CA']
      }
    },
    pageSize: 25
  }
});
```

## Authentication

All API requests require an API key. Get yours at [fiber.ai/app/api](https://fiber.ai/app/api).

**Include your API key in every request:**

- **POST requests**: Pass `apiKey` in the request body
- **GET requests**: Pass `apiKey` as a query parameter

```typescript
// POST request example
await companySearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: { /* ... */ }
  }
});

// GET request example
await getOrgCredits({
  query: { apiKey: process.env.FIBERAI_API_KEY }
});
```

**Best Practice:** Store your API key in environment variables:

```bash
# .env
FIBERAI_API_KEY=your_api_key_here
```

## Core Features

### Company & People Search

#### Company Search

Search for companies using 40+ filters including industry, location, revenue, funding, and more.

```typescript
import { companySearch, companyCount } from '@fiberai/sdk';

// Advanced company search
const result = await companySearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: {
      // Industry filters
      standardIndustries: ['Software', 'Cloud'],
      
      // Size filters
      employeeCountRange: { gte: 50, lte: 500 },
      revenueRange: { gte: 1000000, lte: 50000000 },
      
      // Location filters
      location: {
        countries: ['USA'],
        states: ['CA', 'NY', 'TX']
      },
      
      // Funding filters
      totalFundingRange: { gte: 1000000 },
      tags: ['venture-backed-startup'],
      
      // Technology filters (if available)
      // Advanced criteria
      foundedOnRange: { gte: '2015-01-01' }
    },
    pageSize: 50,
    cursor: null // For pagination
  }
});

console.log(`Found ${result.data.output.data.items.length} companies`);

// Get total count before searching
const count = await companyCount({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: { /* same filters */ }
  }
});

console.log(`Total companies matching: ${count.data.output.count}`);
```

#### People Search

Find decision-makers and key contacts with precise targeting.

```typescript
import { peopleSearch, peopleSearchCount } from '@fiberai/sdk';

const people = await peopleSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: {
      // Job title filters
      title: ['CEO', 'Chief Executive Officer', 'Founder'],
      
      // Seniority and function
      seniority: ['Executive'],
      jobFunction: ['Entrepreneurship'],
      
      // Location filters
      location: {
        cities: ['San Francisco, CA', 'New York, NY'],
        countries: ['USA']
      },
      
      // Company filters (search within specific companies)
      currentCompany: {
        domains: ['example.com'],
        linkedinUrls: ['https://linkedin.com/company/example']
      },
      
      // Tags and special filters
      tags: ['decision-maker', 'c-suite'],
      
      // Education filters
      schools: ['Stanford University', 'Harvard University']
    },
    pageSize: 100,
    getDetailedWorkExperience: true,
    getDetailedEducation: true
  }
});

// Access profile data
people.data.output.data.items.forEach(profile => {
  console.log(`${profile.name} - ${profile.headline}`);
  console.log(`LinkedIn: ${profile.url}`);
  if (profile.currentJob) {
    console.log(`Current: ${profile.currentJob.title} at ${profile.currentJob.company_name}`);
  }
});
```

#### Combined Search (Companies + People)

Search for companies and their employees in one workflow.

```typescript
import { combinedSearch, pollCombinedSearch } from '@fiberai/sdk';

// Start async search
const searchTask = await combinedSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    companySearchParams: {
      standardIndustries: ['Software'],
      employeeCountRange: { gte: 100 }
    },
    personSearchParams: {
      title: ['VP of Sales', 'Sales Director'],
      seniority: ['Director', 'Executive']
    },
    maxCompanies: 100,
    maxProspects: 500
  }
});

const searchId = searchTask.data.output.searchId;

// Poll for companies
let companyCursor = null;
do {
  const companies = await pollCombinedSearch({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      searchId,
      entityType: 'company',
      cursor: companyCursor,
      pageSize: 25
    }
  });
  
  // Process companies
  companies.data.output.data.items.forEach(company => {
    console.log(company.preferred_name);
  });
  
  companyCursor = companies.data.output.nextCursor;
} while (companyCursor);

// Poll for prospects
let prospectCursor = null;
do {
  const prospects = await pollCombinedSearch({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      searchId,
      entityType: 'profile',
      cursor: prospectCursor,
      pageSize: 100
    }
  });
  
  // Process profiles
  prospects.data.output.data.items.forEach(profile => {
    console.log(`${profile.name} - ${profile.headline}`);
  });
  
  prospectCursor = prospects.data.output.nextCursor;
} while (prospectCursor);
```

### Contact Enrichment

Get emails and phone numbers for LinkedIn profiles.

#### Single Contact Enrichment (Async)

```typescript
import { triggerContactEnrichment, pollContactEnrichmentResult } from '@fiberai/sdk';

// Start enrichment
const task = await triggerContactEnrichment({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/in/example',
    dataToFetch: {
      workEmail: true,
      personalEmail: true,
      phoneNumber: true
    },
    liveFetch: false // Set to true for real-time LinkedIn scraping (+1 credit)
  }
});

// Poll for results
let done = false;
while (!done) {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  const result = await pollContactEnrichmentResult({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      taskId: task.data.output.taskId
    }
  });
  
  done = result.data.output.done;
  
  if (done) {
    const profile = result.data.output.profile;
    console.log('Emails:', profile.emails);
    console.log('Phone numbers:', profile.phoneNumbers);
  }
}
```

#### Single Contact Enrichment (Sync)

```typescript
import { syncContactEnrichment } from '@fiberai/sdk';

// Synchronous enrichment (waits for completion)
const result = await syncContactEnrichment({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/in/example',
    dataToFetch: {
      workEmail: true,
      personalEmail: false,
      phoneNumber: false
    }
  }
});

console.log('Work emails:', result.data.output.profile.emails);
```

#### Batch Contact Enrichment

Enrich up to 10,000 contacts in one request.

```typescript
import { startBatchContactEnrichment, pollBatchContactEnrichment } from '@fiberai/sdk';

// Start batch enrichment
const batch = await startBatchContactEnrichment({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    people: [
      { linkedinUrl: { value: 'https://linkedin.com/in/person1' } },
      { linkedinUrl: { value: 'https://linkedin.com/in/person2' } },
      // ... up to 10,000 people
    ],
    dataToFetch: {
      workEmail: true,
      personalEmail: true,
      phoneNumber: true
    }
  }
});

// Poll for results with pagination
let cursor = null;
let allDone = false;

while (!allDone) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const results = await pollBatchContactEnrichment({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      taskId: batch.data.output.taskId,
      cursor,
      take: 100
    }
  });
  
  allDone = results.data.output.done;
  cursor = results.data.output.nextCursor;
  
  // Process page results
  results.data.output.pageResults.forEach(person => {
    if (person.outputs) {
      console.log('LinkedIn:', person.inputs.linkedinUrl.value);
      console.log('Emails:', person.outputs.emails);
      console.log('Phones:', person.outputs.phoneNumbers);
      console.log('---');
    }
  });
}
```

### LinkedIn Live Enrichment

Get real-time data from LinkedIn with live scraping.

#### Live Profile Enrichment

```typescript
import { profileLiveEnrich } from '@fiberai/sdk';

const profile = await profileLiveEnrich({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/in/example'
  }
});

console.log(profile.data.output.name);
console.log(profile.data.output.summary);
console.log(profile.data.output.experiences);
console.log(profile.data.output.education);
```

#### Live Company Enrichment

```typescript
import { companyLiveEnrich } from '@fiberai/sdk';

const company = await companyLiveEnrich({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/company/example'
  }
});

console.log(company.data.output.preferred_name);
console.log(company.data.output.li_description);
console.log(company.data.output.li_follower_count);
```

#### Fetch LinkedIn Posts

```typescript
import { profilePostsLiveFetch, companyPostsLiveFetch } from '@fiberai/sdk';

// Get profile posts
const profilePosts = await profilePostsLiveFetch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/in/example',
    cursor: null // For pagination
  }
});

// Get company posts
const companyPosts = await companyPostsLiveFetch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    linkedinUrl: 'https://www.linkedin.com/company/example',
    cursor: null
  }
});
```

### Saved Searches (Audiences)

Create, manage, and run saved searches with automatic updates.

```typescript
import {
  createSavedSearch,
  listSavedSearch,
  manuallySpawnSavedSearchRun,
  getSavedSearchRunStatus,
  getSavedSearchRunCompanies,
  getSavedSearchRunProfiles
} from '@fiberai/sdk';

// Create a saved search
const savedSearch = await createSavedSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    name: 'Tech Executives in SF',
    searchParams: {
      companySearchParams: {
        standardIndustries: ['Software'],
        location: { cities: ['San Francisco, CA'] }
      },
      personSearchParams: {
        title: ['CEO', 'CTO'],
        seniority: ['Executive']
      }
    }
  }
});

// List all saved searches
const searches = await listSavedSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY
  }
});

// Manually run a saved search
const run = await manuallySpawnSavedSearchRun({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    savedSearchId: savedSearch.data.output.savedSearchId
  }
});

// Check run status
const status = await getSavedSearchRunStatus({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    runId: run.data.output.runId
  }
});

// Get companies from run
const companies = await getSavedSearchRunCompanies({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    runId: run.data.output.runId,
    pageSize: 100
  }
});

// Get profiles from run
const profiles = await getSavedSearchRunProfiles({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    runId: run.data.output.runId,
    pageSize: 100
  }
});
```

### Exclusion Lists

Manage exclusion lists to filter out companies or prospects from searches.

```typescript
import {
  createCompanyExclusionList,
  addCompaniesToExclusionList,
  getExcludedCompaniesForExclusionList,
  createCompanyExclusionListFromAudience
} from '@fiberai/sdk';

// Create an exclusion list
const list = await createCompanyExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    name: 'Competitors',
    isOrganizationWide: true
  }
});

// Add companies to the list
await addCompaniesToExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    listId: list.data.output.listId,
    companies: [
      { domain: 'competitor1.com', linkedinUrl: null },
      { domain: 'competitor2.com', linkedinUrl: null }
    ]
  }
});

// Create exclusion list from an existing audience
const audienceList = await createCompanyExclusionListFromAudience({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    audienceId: 'audience-123',
    name: 'Existing Customers',
    isOrganizationWide: true
  }
});

// View excluded companies
const excluded = await getExcludedCompaniesForExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    exclusionListId: list.data.output.listId,
    pageSize: 100
  }
});
```

### Google Maps Search

Search for local businesses on Google Maps.

```typescript
import {
  googleMapsSearch,
  checkGoogleMapsResults,
  pollGoogleMapsResults
} from '@fiberai/sdk';

// Start Google Maps search
const search = await googleMapsSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    query: 'coffee shops',
    location: 'San Francisco, CA',
    maxResults: 100
  }
});

// Check search progress
const progress = await checkGoogleMapsResults({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchID: search.data.output.projectID
  }
});

console.log(`Progress: ${progress.data.output.percentageCompleted}%`);

// Poll for results when complete
if (progress.data.output.status === 'COMPLETED') {
  const results = await pollGoogleMapsResults({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      projectID: search.data.output.projectID,
      pageSize: 50
    }
  });
  
  results.data.output.results.forEach(place => {
    console.log(`${place.name} - ${place.address}`);
    console.log(`Rating: ${place.rating}, Reviews: ${place.numReviews}`);
    console.log(`Website: ${place.website}`);
  });
}
```

### AI-Powered Research

Use AI agents for intelligent company research and domain lookup.

```typescript
import { domainLookupTrigger, domainLookupPolling } from '@fiberai/sdk';

// Trigger domain lookup for company names
const lookup = await domainLookupTrigger({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    companyNames: [
      'OpenAI',
      'Anthropic',
      'Stripe'
    ]
  }
});

// Poll for results
let lookupDone = false;
while (!lookupDone) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const results = await domainLookupPolling({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      domainAgentRunId: lookup.data.output.domainAgentRunId,
      pageSize: 10
    }
  });
  
  lookupDone = results.data.output.status === 'DONE';
  
  if (lookupDone) {
    results.data.output.data.forEach(company => {
      console.log(`${company.companyName}: ${company.bestDomain}`);
      console.log(`Confidence: ${company.confidence}/10`);
      console.log(`Rationale: ${company.rationale}`);
    });
  }
}
```

## Advanced Usage

### Custom Client Configuration

```typescript
import { createClient } from '@fiberai/sdk';

// Create a custom client
const customClient = createClient({
  baseUrl: 'https://api.fiber.ai', // Production URL
  // Add custom headers, interceptors, etc.
});

// Use with any SDK function
import { companySearch } from '@fiberai/sdk';

const result = await companySearch({
  client: customClient,
  body: { /* ... */ }
});
```

### Pagination Helper

```typescript
async function* paginateSearch(searchFn, params) {
  let cursor = null;
  
  do {
    const result = await searchFn({
      ...params,
      body: {
        ...params.body,
        cursor
      }
    });
    
    yield result.data.output.data.items;
    cursor = result.data.output.nextCursor;
  } while (cursor);
}

// Usage
for await (const companies of paginateSearch(companySearch, {
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: { /* ... */ },
    pageSize: 100
  }
})) {
  console.log(`Processing batch of ${companies.length} companies`);
  // Process batch
}
```

### Utility Endpoints

```typescript
import {
  getRegions,
  getLanguages,
  getTimeZones,
  getIndustries,
  getTags,
  getNaicsCodes,
  getAccelerators
} from '@fiberai/sdk';

// Get available regions for filtering
const regions = await getRegions({
  query: { apiKey: process.env.FIBERAI_API_KEY }
});

// Get available industries
const industries = await getIndustries({
  query: { apiKey: process.env.FIBERAI_API_KEY }
});

// Get profile and company tags
const tags = await getTags({
  query: { apiKey: process.env.FIBERAI_API_KEY }
});
```

## Error Handling

### Standard Error Handling

```typescript
import { companySearch } from '@fiberai/sdk';

const result = await companySearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: { /* ... */ }
  }
});

if (result.error) {
  console.error('API Error:', result.error);
  // Handle specific error codes
  if (result.error.message.includes('401')) {
    console.error('Invalid API key');
  } else if (result.error.message.includes('402')) {
    console.error('Insufficient credits');
  } else if (result.error.message.includes('429')) {
    console.error('Rate limit exceeded');
  }
} else {
  console.log('Success:', result.data);
}
```

### Throwing on Errors

```typescript
try {
  const result = await companySearch<true>({
    body: {
      apiKey: process.env.FIBERAI_API_KEY,
      searchParams: { /* ... */ }
    },
    throwOnError: true
  });
  
  // result.data is guaranteed to exist
  console.log(result.data.output);
} catch (error) {
  console.error('Request failed:', error);
}
```

### Common HTTP Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check your request parameters |
| 401 | Unauthorized | Verify your API key is valid |
| 402 | Payment Required | Insufficient credits - top up your account |
| 403 | Forbidden | You don't have access to this resource |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded - slow down requests |
| 500 | Internal Server Error | Contact support at adi@fiber.ai |

## TypeScript Support

All SDK methods are fully typed with TypeScript.

```typescript
import type {
  CompanySearchData,
  CompanySearchResponse,
  PeopleSearchData,
  PeopleSearchResponse,
  TriggerContactEnrichmentData,
  PollContactEnrichmentResultResponse
} from '@fiberai/sdk';

// Type-safe request
const searchParams: CompanySearchData = {
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    searchParams: {
      standardIndustries: ['Software'],
      employeeCountRange: { gte: 100, lte: 1000 }
    },
    pageSize: 25
  }
};

const result: CompanySearchResponse = await companySearch(searchParams);
```

### Runtime Validation (Optional)

The SDK includes Zod schemas for runtime validation. Install Zod separately to use them:

```bash
npm install zod
```

```typescript
import { z } from 'zod';
import { zCompanySearchData } from '@fiberai/sdk/dist/generated/zod.gen';

const requestData = {
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: { /* ... */ }
  }
};

// Validate at runtime
const validatedData = zCompanySearchData.parse(requestData);
```

## Rate Limits & Credits

### Rate Limits

Each endpoint has its own rate  limit. Common limits:

- **Company/People Search**: 180 requests/minute
- **Contact Enrichment**: 120 requests/minute (single), 10 requests/minute (batch)
- **Live Enrichment**: 60 requests/minute
- **Utility Endpoints**: 10-50 requests/minute

### Credit Costs

**Default pricing** (may vary - check your organization settings):

| Operation | Cost (credits) |
|-----------|----------------|
| Company search | 1 per company found |
| People search | 1 per profile found |
| Combined search | 1 per company + 1 per profile |
| Work email reveal | 2 |
| Personal email reveal | 2 |
| Phone number reveal | 3 |
| All contact data | 5 |
| Live profile enrichment | 2 |
| Live company enrichment | 2 |
| LinkedIn posts (per page) | 2 |
| Google Maps search | 3 per result |

### Free Endpoints

The following endpoints are **completely free** (no credits charged):

- `getOrgCredits` - Check credit balance
- `getRegions`, `getLanguages`, `getTimeZones`, `getIndustries`, `getTags`, `getNaicsCodes`, `getAccelerators` - Utility endpoints
- All exclusion list management endpoints

### Check Your Credits

```typescript
import { getOrgCredits } from '@fiberai/sdk';

const credits = await getOrgCredits({
  query: { apiKey: process.env.FIBERAI_API_KEY }
});

console.log(`Available: ${credits.data.output.available}`);
console.log(`Used: ${credits.data.output.used}`);
console.log(`Max: ${credits.data.output.max}`);
console.log(`Resets on: ${credits.data.output.usagePeriodResetsOn}`);
```

## Support

- **Documentation**: [alpha.api.fiber.ai/scalar](https://alpha.api.fiber.ai/scalar)
- **Email**: adi@fiber.ai
- **Website**: [fiber.ai](https://fiber.ai)
- **Get API Key**: [fiber.ai/app/api](https://fiber.ai/app/api)

## Development

### Regenerating the SDK

```bash
# Clean and regenerate
rm -rf src/generated/ dist/
npm install
npm run generate
npm run build
npm run typecheck
```

### Deployment

1. Update version in `package.json`
2. Commit and push to `main` branch
3. GitHub Action automatically publishes to npm

## License

MIT

---

Made with ❤️ by [Fiber AI](https://fiber.ai)
