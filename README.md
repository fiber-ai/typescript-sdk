# @fiberai/sdk

Official TypeScript/JavaScript SDK for the [Fiber AI](https://fiber.ai) API - Reach anyone on the planet with verified contacts

[![npm version](https://img.shields.io/npm/v/@fiberai/sdk.svg)](https://www.npmjs.com/package/@fiberai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## For AI agents (Cursor / Claude / Codex / ChatGPT / Copilot)

Do NOT guess operation names — read the canonical agent-facing docs first:

- **Routing index + critical rules:** https://api.fiber.ai/llms.txt
- **Per-operation markdown:** `https://api.fiber.ai/ai-docs/<operationId>.md`
  (e.g. [`companySearch`](https://api.fiber.ai/ai-docs/companySearch.md),
  [`syncQuickContactReveal`](https://api.fiber.ai/ai-docs/syncQuickContactReveal.md),
  [`triggerExhaustiveContactEnrichment`](https://api.fiber.ai/ai-docs/triggerExhaustiveContactEnrichment.md))
- **Operation index:** https://api.fiber.ai/ai-docs/index.md
- **Full corpus (single file):** https://api.fiber.ai/llms-full.txt
- **OpenAPI spec:** `https://api.fiber.ai/openapi.json`
  (send `Accept: text/markdown` for the agent-friendly variant)
- **MCP server:** `https://mcp.fiber.ai/mcp/v2` (also see [fiber-ai/mcp](https://github.com/fiber-ai/mcp))

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Core Features](#core-features)
  - [Company & People Search](#company--people-search)
  - [Contact Enrichment](#contact-enrichment)
  - [LinkedIn Live Enrichment](#linkedin-live-enrichment)
  - [Exclusion Lists](#exclusion-lists)
  - [Google Maps Search](#google-maps-search)
  - [AI-Powered Research](#ai-powered-research)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
  - [Runtime Validation with Zod](#runtime-validation-with-zod)
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
import { peopleSearch, companySearch, getOrgCredits } from "@fiberai/sdk";

// Check your organization's credit balance
const credits = await getOrgCredits({
  query: { apiKey: "your-api-key" },
});

console.log(`Available credits: ${credits.data?.output.available}`);

// Search for companies
const companies = await companySearch({
  body: {
    apiKey: "your-api-key",
    searchParams: {
      industriesV2: {
        anyOf: ["Software", "Information Technology"],
      },
      employeeCountV2: {
        lowerBoundExclusive: 100,
        upperBoundInclusive: 1000,
      },
      headquartersCountryCode: {
        anyOf: ["USA"],
      },
    },
    pageSize: 25,
  },
});

// Search for people
const people = await peopleSearch({
  body: {
    apiKey: "your-api-key",
    searchParams: {
      jobTitleV2: {
        anyOf: [
          { type: "term", term: "CEO" },
          { type: "term", term: "CTO" },
          { type: "static-groups", groups: ["c-suite"] },
        ],
      },
      country3LetterCode: { anyOf: ["USA"] },
    },
    pageSize: 25,
  },
});

// Every successful response also carries a `chargeInfo` envelope alongside
// `output`. Source of truth for cost — prefer this over the static table below.
console.log(people.data?.chargeInfo);
// e.g. { method: 'charged-now', creditsCharged: 25, lowCreditAlert: null }
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
    searchParams: {
      /* ... */
    },
  },
});

// GET request example
await getOrgCredits({
  query: { apiKey: process.env.FIBERAI_API_KEY },
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
import { companySearch, companyCount } from "@fiberai/sdk";

// Advanced company search
const result = await companySearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: {
      // Industry filters
      industriesV2: {
        anyOf: ["Software", "Cloud"],
      },

      // Size filters
      employeeCountV2: {
        lowerBoundExclusive: 50,
        upperBoundInclusive: 500,
      },

      // Location filters
      headquartersCountryCode: {
        anyOf: ["USA"],
      },

      // Funding filters
      totalFundingUSD: {
        lowerBound: 1000000,
      },

      // Keywords filter
      keywords: {
        containsAny: ["venture-backed-startup"],
      },
    },
    pageSize: 50,
    cursor: null, // For pagination
  },
});

console.log(`Found ${result.data?.output.data.length} companies`);
console.log(
  `Cursor for next page: ${result.data?.output.nextCursor ?? "none"}`,
);

// Get total count before searching
const count = await companyCount({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    searchParams: {
      /* same filters */
    },
  },
});

console.log(`Total companies matching: ${count.data?.output.count}`);
```

#### People Search

Find decision-makers and key contacts with precise targeting.

```typescript
import { peopleSearch, peopleSearchCount } from "@fiberai/sdk";

const people = await peopleSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    searchParams: {
      // Job title filter. Mix free-form `term` matches with curated
      // `static-groups` ('founder' | 'c-suite' | 'board-member') and
      // `dynamic-groups` ('vp' | 'director' | 'management' | 'entry-level' | ...).
      jobTitleV2: {
        anyOf: [
          { type: "term", term: "CEO" },
          { type: "term", term: "Chief Executive Officer" },
          { type: "static-groups", groups: ["founder", "c-suite"] },
        ],
      },

      // Country filter — ISO 3166-1 alpha-3 codes, not city names.
      country3LetterCode: { anyOf: ["USA"] },

      // Geographic radius filter (use this, not "cities"/"countries").
      location: {
        unionAll: [
          {
            strategy: "radial-distance",
            center: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
            radius: { unit: "miles", quantity: 50 },
          },
        ],
      },

      // Curated tags. Allowed values include 'decision-maker', 'c-suite',
      // 'experienced-executive', 'second-time-founder', 'phd', etc.
      tags: { anyOf: ["decision-maker", "c-suite"] },

      // Education filter — match by school identifier (LinkedIn id, slug,
      // or domain), not by free-form school name.
      education: {
        anyOf: [
          {
            school: {
              anyOf: [{ domain: "stanford.edu" }, { domain: "harvard.edu" }],
            },
          },
        ],
      },

      getDetailedWorkExperience: true,
      getDetailedEducation: true,
    },

    // `currentCompanies` is a TOP-LEVEL body field, NOT inside searchParams.
    // It expects concrete identifiers, not industry filters. To filter by
    // industry/size/etc, use `syncCombinedSearch` and put company filters
    // under `companyParams`.
    currentCompanies: [
      { domain: "example.com" },
      { linkedinSlugOrURL: "https://linkedin.com/company/example" },
    ],

    pageSize: 100,
  },
});

// Access profile data — `output.data` is a direct array, no `.items` wrapper.
people.data?.output.data.forEach((profile) => {
  console.log(`${profile.name} — ${profile.headline}`);
  console.log(`LinkedIn: ${profile.url}`);

  // There is no `profile.currentJob` field. Current role lives in
  // `experiences[]` filtered by `is_current`.
  const currentRole = profile.experiences?.find((e) => e.is_current);
  if (currentRole) {
    console.log(`Current: ${currentRole.title} at ${currentRole.company_name}`);
  }
});

console.log(`Charged: ${people.data?.chargeInfo.method}`);
```

#### Combined Search (Companies + People)

Return matching companies and their employees in a single synchronous call. Filter on the company side (`companyParams`) and the person side (`profileParams`) at the same time. For larger result sets you can also run `companySearch` and `peopleSearch` independently and paginate each.

```typescript
import { syncCombinedSearch } from "@fiberai/sdk";

const result = await syncCombinedSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    companyParams: {
      industriesV2: {
        anyOf: ["Software"],
      },
      employeeCountV2: {
        lowerBoundExclusive: 100,
      },
    },
    profileParams: {
      jobTitleV2: {
        anyOf: [
          { type: "term", term: "VP of Sales" },
          { type: "term", term: "Sales Director" },
          { type: "static-groups", groups: ["c-suite"] },
          { type: "dynamic-groups", groups: ["vp", "director"] },
        ],
      },
    },
    companyItemLimit: 25,
    profileItemLimit: 100,
  },
});

result.data?.output.companies?.forEach((company) => {
  console.log(company.preferred_name);
});

result.data?.output.profiles?.forEach((profile) => {
  console.log(`${profile.name} - ${profile.headline}`);
});
```

> See [`syncCombinedSearch`](https://api.fiber.ai/ai-docs/syncCombinedSearch.md) for the full parameter surface, or drive the two-step flow via `companySearch` + `peopleSearch` when you need cursor-based pagination.

### Contact Enrichment

Reveal emails and phone numbers for a known LinkedIn profile. Fiber exposes a **three-tier public contract** — pick the tier that matches your latency, coverage, and cost tradeoffs:

| Tier       | Operation                                                                      | Shape                 | When to use                                                                                                   |
| ---------- | ------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Default    | `syncQuickContactReveal`                                                       | Sync, one HTTP call   | Default single-profile reveal. Fast, good coverage.                                                           |
| Premium    | `syncTurboContactEnrichment`                                                   | Sync, one HTTP call   | You need the absolute fastest response and want the widest first-pass waterfall. Premium cost.                |
| Exhaustive | `triggerExhaustiveContactEnrichment` + `pollExhaustiveContactEnrichmentResult` | Async, trigger + poll | Highest coverage. Kick off a background waterfall that tries every available provider, then poll for results. |

For lists of 10–2000 identifiers, use the batch endpoints instead (see [Batch Contact Reveal](#batch-contact-reveal)).

#### Default — `syncQuickContactReveal`

```typescript
import { syncQuickContactReveal } from "@fiberai/sdk";

const result = await syncQuickContactReveal({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    linkedinUrl: "https://www.linkedin.com/in/example",
    enrichmentType: {
      getWorkEmails: true,
      getPersonalEmails: true,
      getPhoneNumbers: true,
    },
    // Emails are bounce-validated by default. Set validateEmails: false to skip.
  },
});

console.log("Emails:", result.data?.output.profile?.emails);
console.log("Phones:", result.data?.output.profile?.phoneNumbers);
```

#### Premium — `syncTurboContactEnrichment`

```typescript
import { syncTurboContactEnrichment } from "@fiberai/sdk";

const result = await syncTurboContactEnrichment({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    linkedinUrl: "https://www.linkedin.com/in/example",
    enrichmentType: {
      getWorkEmails: true,
      getPersonalEmails: true,
      getPhoneNumbers: true,
    },
  },
});

console.log("Emails:", result.data?.output.profile?.emails);
```

#### Exhaustive (async waterfall) — `triggerExhaustiveContactEnrichment` + `pollExhaustiveContactEnrichmentResult`

`triggerExhaustiveContactEnrichment` starts a background waterfall that returns the highest coverage at the cost of latency. It returns a `taskId` immediately; poll `pollExhaustiveContactEnrichmentResult` every 5–15s until `output.done === true`.

```typescript
import {
  triggerExhaustiveContactEnrichment,
  pollExhaustiveContactEnrichmentResult,
} from "@fiberai/sdk";

const trigger: Awaited<ReturnType<typeof triggerExhaustiveContactEnrichment>> =
  await triggerExhaustiveContactEnrichment({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      linkedinUrl: "https://www.linkedin.com/in/example",
      enrichmentType: {
        getWorkEmails: true,
        getPersonalEmails: true,
        getPhoneNumbers: true,
      },
    },
  });

const taskId: string = trigger.data!.output.taskId;

let done: boolean = false;
while (!done) {
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));

  const poll: Awaited<ReturnType<typeof pollExhaustiveContactEnrichmentResult>> =
    await pollExhaustiveContactEnrichmentResult({
      body: { apiKey: process.env.FIBERAI_API_KEY!, taskId },
    });

  done = poll.data?.output.done ?? false;
  if (done) {
    console.log("Emails:", poll.data?.output.profile.emails);
    console.log("Phones:", poll.data?.output.profile.phoneNumbers);
    console.log("Status:", poll.data?.output.profile.status);
  }
}
```

#### Batch Contact Reveal — `startBatchContactEnrichment` + `pollBatchContactEnrichment`

For 10–2000 LinkedIn identifiers in one task. `startBatchContactEnrichment` charges credits up front and returns a `taskId`; `pollBatchContactEnrichment` returns paginated results with both per-task progress (`output.overallStats`) and `output.done` to gate the loop. For larger lists or repeatable workflows, upload a CSV-backed audience and enrich it through the audience workflow instead.

```typescript
import {
  startBatchContactEnrichment,
  pollBatchContactEnrichment,
} from "@fiberai/sdk";

const start: Awaited<ReturnType<typeof startBatchContactEnrichment>> =
  await startBatchContactEnrichment({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      personDetails: [
        { linkedinUrl: { value: "https://www.linkedin.com/in/example1" } },
        { linkedinUrl: { value: "https://www.linkedin.com/in/example2" } },
      ],
      enrichmentTypes: {
        getWorkEmails: true,
        getPersonalEmails: true,
        getPhoneNumbers: true,
      },
    },
  });

const taskId: string = start.data!.output.taskId;
console.log(`Queued ${start.data!.output.numPeopleEnqueued} profiles`);

let cursor: string | null | undefined = undefined;
let done: boolean = false;

while (!done) {
  await new Promise<void>((resolve) => setTimeout(resolve, 10000));

  const poll: Awaited<ReturnType<typeof pollBatchContactEnrichment>> =
    await pollBatchContactEnrichment({
      body: {
        apiKey: process.env.FIBERAI_API_KEY!,
        taskId,
        cursor,
        take: 100,
      },
    });

  if (!poll.data) break;

  for (const row of poll.data.output.pageResults) {
    console.log(row.inputs.linkedinUrl.value, row.outputs?.emails);
  }

  done = poll.data.output.done;
  cursor = poll.data.output.nextCursor ?? null;

  // `nextCursor` may go null before `done` flips — pause and re-poll if so.
  if (!done && !cursor) await new Promise<void>((r) => setTimeout(r, 5000));
}
```

### LinkedIn Live Enrichment

Get real-time data from LinkedIn with live scraping.

#### Live Profile Enrichment

```typescript
import { profileLiveEnrich } from "@fiberai/sdk";

const profile = await profileLiveEnrich({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    // `identifier` accepts a slug ('williamhgates'), a full LinkedIn URL,
    // a Sales Navigator URN ('ACwAAA...'), or a numeric LinkedIn user ID.
    identifier: "https://www.linkedin.com/in/example",
  },
});

// Profile fields live under `output.profile`, not directly on `output`.
console.log(profile.data?.output.profile.name);
console.log(profile.data?.output.profile.summary);
console.log(profile.data?.output.profile.experiences);
console.log(profile.data?.output.profile.education);
```

#### Live Company Enrichment

```typescript
import { companyLiveEnrich } from "@fiberai/sdk";

const company = await companyLiveEnrich({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    // The `type` discriminator picks how `value` is interpreted:
    //   'slug'   — LinkedIn slug, e.g. 'microsoft'
    //   'orgId'  — LinkedIn organization id, e.g. '1441'
    //   'liUrl'  — full LinkedIn URL, e.g. 'https://www.linkedin.com/company/microsoft'
    type: "liUrl",
    value: "https://www.linkedin.com/company/example",
  },
});

// Company fields live under `output.company`, not directly on `output`.
console.log(company.data?.output.company.headline);
console.log(company.data?.output.company.description);
console.log(company.data?.output.company.follower_count);
```

#### Fetch LinkedIn Posts

```typescript
import { profilePostsLiveFetch, companyPostsLiveFetch } from "@fiberai/sdk";

// Get profile posts. `identifier` accepts a slug, full LinkedIn URL,
// or Sales Navigator URN — same shape as `profileLiveEnrich`.
const profilePosts = await profilePostsLiveFetch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    identifier: "https://www.linkedin.com/in/example",
    cursor: null, // For pagination
  },
});

// Get company posts. `identifier` accepts a LinkedIn slug, URL, or org ID.
const companyPosts = await companyPostsLiveFetch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    identifier: "https://www.linkedin.com/company/example",
    cursor: null,
  },
});
```

### Exclusion Lists

Manage exclusion lists to filter out companies or prospects from searches.

```typescript
import {
  createCompanyExclusionList,
  addCompaniesToExclusionList,
  getExcludedCompaniesForExclusionList,
  createCompanyExclusionListFromAudience,
} from "@fiberai/sdk";

// Create an exclusion list
const list = await createCompanyExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    name: "Competitors",
    isOrganizationWide: true,
  },
});

// Add companies to the list
await addCompaniesToExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    listId: list.data.output.listId,
    companies: [
      { domain: "competitor1.com", linkedinUrl: null },
      { domain: "competitor2.com", linkedinUrl: null },
    ],
  },
});

// Create exclusion list from an existing audience
const audienceList = await createCompanyExclusionListFromAudience({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    audienceId: "audience-123",
    name: "Existing Customers",
    isOrganizationWide: true,
  },
});

// View excluded companies
const excluded = await getExcludedCompaniesForExclusionList({
  body: {
    apiKey: process.env.FIBERAI_API_KEY,
    exclusionListId: list.data.output.listId,
    pageSize: 100,
  },
});
```

### Google Maps Search

Search for local businesses on Google Maps.

```typescript
import {
  googleMapsSearch,
  checkGoogleMapsResults,
  pollGoogleMapsResults,
} from "@fiberai/sdk";

// Start Google Maps search. `query` is the keywords only (no location info)
// and `strategy` is required — see below for the available strategies.
const search = await googleMapsSearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    query: "coffee shops",
    maxResults: 100,
    strategy: {
      // Options:
      //   { strategy: 'whole-usa' }
      //   { strategy: 'specific-areas', unionAll: [{ regionType: 'circle', center: {latitude, longitude}, radiusMiles }] }
      //   { strategy: 'world-cities', countriesAndRegions: { unionAll: ['USA', 'GBR', ...] } }
      strategy: "specific-areas",
      unionAll: [
        {
          regionType: "circle",
          center: { latitude: 37.7749, longitude: -122.4194 },
          radiusMiles: 10,
        },
      ],
    },
  },
});

const searchID = search.data!.output.searchID;

// Check search progress.
const progress = await checkGoogleMapsResults({
  body: { apiKey: process.env.FIBERAI_API_KEY!, searchID },
});

console.log(`Progress: ${progress.data?.output.percentageCompleted}%`);

// Poll for results once complete.
if (progress.data?.output.status === "COMPLETED") {
  const results = await pollGoogleMapsResults({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      searchID,
      pageSize: 50,
    },
  });

  results.data?.output.results.forEach((place) => {
    console.log(`${place.name} — ${place.address}`);
    console.log(`Rating: ${place.rating}, Reviews: ${place.numReviews}`);
    console.log(`Website: ${place.website}`);
  });
}
```

### AI-Powered Research

Use AI agents for intelligent company research and domain lookup.

```typescript
import { domainLookupTrigger, domainLookupPolling } from "@fiberai/sdk";

// Trigger domain lookup. `overAllContext` is required and helps the agent
// disambiguate similar names; `companyInfo` is an array of objects (not
// a list of bare strings).
const lookup = await domainLookupTrigger({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    overAllContext: "YC startups in the US",
    companyInfo: [
      { name: "Acme Corp" },
      { name: "Globex", country: "USA" },
      { name: "Initech" },
    ],
  },
});

const domainAgentRunId = lookup.data!.output.domainAgentRunId;

// Poll for results.
let lookupDone = false;
while (!lookupDone) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const results = await domainLookupPolling({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      domainAgentRunId,
      pageSize: 10,
    },
  });

  lookupDone = results.data?.output.status === "DONE";

  if (lookupDone) {
    results.data?.output.data.forEach((company) => {
      console.log(`${company.companyName}: ${company.bestDomain}`);
      console.log(`Confidence: ${company.confidence}/10`);
      console.log(`Rationale: ${company.rationale}`);
    });
  }
}
```

## Advanced Usage

### Configuring the built-in client

The SDK exports a pre-configured `client` that already points at `https://api.fiber.ai`. Every operation uses it by default — you do **not** need to call `createClient` to make requests.

If you need to customize headers, swap in a custom `fetch`, or add request/response interceptors, mutate the shared instance:

```typescript
import { client } from "@fiberai/sdk";

// One-time configuration: extra headers, a custom fetch, etc.
client.setConfig({
  headers: { "X-Trace-Id": "my-app/1.0.0" },
});

// Log every outgoing request — handy as a poor man's debug mode.
client.interceptors.request.use((request) => {
  console.log(`[fiberai] ${request.method} ${request.url}`);
  return request;
});
```

`createClient` from the package is for the rare case where you want a second, independent client (e.g. multi-tenant apps). Pass it via the `client:` option on any operation.

### Pagination Helper

```typescript
import type { CompanySearchData, CompanySearchResponse } from "@fiberai/sdk";

async function* paginateCompanies(
  initial: CompanySearchData,
): AsyncGenerator<
  NonNullable<CompanySearchResponse["data"]>["output"]["data"]
> {
  let cursor: string | null | undefined = initial.body.cursor ?? null;

  do {
    const result = await companySearch({
      ...initial,
      body: { ...initial.body, cursor },
    });

    if (!result.data) break;
    yield result.data.output.data;
    cursor = result.data.output.nextCursor;
  } while (cursor);
}

// Usage
for await (const companies of paginateCompanies({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    searchParams: {
      /* ... */
    },
    pageSize: 100,
  },
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
  getAccelerators,
} from "@fiberai/sdk";

// Get available regions for filtering
const regions = await getRegions({
  query: { apiKey: process.env.FIBERAI_API_KEY },
});

// Get available industries
const industries = await getIndustries({
  query: { apiKey: process.env.FIBERAI_API_KEY },
});

// Get profile and company tags
const tags = await getTags({
  query: { apiKey: process.env.FIBERAI_API_KEY },
});
```

## Error Handling

### Standard Error Handling

By default, every operation returns `{ data, error, response }`. Branch on the HTTP status from `response.status` rather than string-matching the error body — error payloads are not guaranteed to contain a parseable `message` for every failure mode.

```typescript
import { companySearch } from "@fiberai/sdk";

const result = await companySearch({
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    searchParams: {
      /* ... */
    },
  },
});

if (result.error) {
  switch (result.response.status) {
    case 400:
      console.error("Bad request:", result.error);
      break;
    case 401:
      console.error("Invalid API key");
      break;
    case 402:
      // 402 errors carry an `outOfCreditsAlert` with a top-up link.
      console.error("Insufficient credits:", result.error);
      break;
    case 429:
      console.error("Rate limit exceeded — back off and retry");
      break;
    default:
      console.error(
        `Request failed (${result.response.status}):`,
        result.error,
      );
  }
} else {
  console.log("Success:", result.data?.output);
  console.log("Charged:", result.data?.chargeInfo);
}
```

### Throwing on Errors

```typescript
try {
  const result = await companySearch({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      searchParams: {
        /* ... */
      },
    },
    throwOnError: true,
  });

  // result.data is guaranteed to exist when throwOnError is true.
  console.log(result.data.output);
} catch (error) {
  console.error("Request failed:", error);
}
```

### Common HTTP Error Codes

| Code | Meaning               | Solution                                   |
| ---- | --------------------- | ------------------------------------------ |
| 400  | Bad Request           | Check your request parameters              |
| 401  | Unauthorized          | Verify your API key is valid               |
| 402  | Payment Required      | Insufficient credits - top up your account |
| 403  | Forbidden             | You don't have access to this resource     |
| 404  | Not Found             | Resource doesn't exist                     |
| 429  | Too Many Requests     | Rate limit exceeded - slow down requests   |
| 500  | Internal Server Error | Contact support                            |

## TypeScript Support

All SDK methods are fully typed with TypeScript.

```typescript
import { companySearch } from "@fiberai/sdk";
import type { CompanySearchData } from "@fiberai/sdk";

// `<Op>Data` types describe the *input* shape — body, query, path, and headers.
// Use them to pre-build requests that you'll later pass into the SDK function.
const searchParams: CompanySearchData = {
  body: {
    apiKey: process.env.FIBERAI_API_KEY!,
    searchParams: {
      industriesV2: {
        anyOf: ["Software"],
      },
      employeeCountV2: {
        lowerBoundExclusive: 100,
        upperBoundInclusive: 1000,
      },
    },
    pageSize: 25,
  },
};

// SDK functions return `{ data, error, response }`. The body shape lives at
// `result.data`, and the exported `<Op>Response` / `<Op>Errors` types describe
// the inner body union — NOT the wrapper. To annotate the awaited call,
// use `Awaited<ReturnType<typeof fn>>`.
const result: Awaited<ReturnType<typeof companySearch>> =
  await companySearch(searchParams);

if (result.data) {
  console.log(result.data.output.data.length, "companies");
  console.log(result.data.chargeInfo);
}
```

> **Naming convention:** every operation `foo` ships three companion types:
> `FooData` (input), `FooResponse` (200 body union), and `FooErrors` (4xx/5xx body union). The same convention applies to `peopleSearch`, `syncQuickContactReveal`, etc.

### Runtime Validation with Zod

Every request and response shape is also published as a [Zod](https://zod.dev) schema, generated from the same OpenAPI spec as the TypeScript types. They live behind the dedicated `@fiberai/sdk/zod` subpath so apps that don't need runtime validation pay zero bundle cost — the main entry stays under 50 KB while the Zod bundle (~3–6 MB depending on the API surface) is only loaded if you import it.

```typescript
import { zPeopleSearchData, zCompanySearchData } from "@fiberai/sdk/zod";
import { peopleSearch } from "@fiberai/sdk";

const rawInput: unknown = JSON.parse(req.body);

const parsed: ReturnType<typeof zPeopleSearchData.parse> =
  zPeopleSearchData.parse(rawInput);

const result: Awaited<ReturnType<typeof peopleSearch>> =
  await peopleSearch(parsed);
```

Use `safeParse` if you want to handle validation failures without throwing. Zod 4 ships top-level error helpers — use `z.flattenError` for form-friendly output or `z.treeifyError` for nested shapes:

```typescript
import { z } from "zod";
import { zCompanySearchData } from "@fiberai/sdk/zod";

const parsed: ReturnType<typeof zCompanySearchData.safeParse> =
  zCompanySearchData.safeParse(req.body);

if (!parsed.success) {
  return res.status(400).json({ errors: z.flattenError(parsed.error) });
}
```

> **Naming convention:** every TypeScript type `Foo` has a matching `zFoo` schema. So `PeopleSearchData` ↔ `zPeopleSearchData`, `CompanySearchResponse` ↔ `zCompanySearchResponse`, etc.

`zod` ships as a runtime dependency of `@fiberai/sdk` and is externalized from the bundle (so package managers dedupe with whatever Zod copy your app already has). If you don't import `@fiberai/sdk/zod`, your bundler tree-shakes the schemas out and you never pay for them.

## Rate Limits & Credits

### Rate Limits

Each endpoint has its own rate limit. Common limits:

- **Company/People Search**: 180 requests/minute
- **Contact Enrichment**: 120 requests/minute (single), 10 requests/minute (batch)
- **Live Enrichment**: 60 requests/minute
- **Utility Endpoints**: 10-50 requests/minute

### Credit Costs

Pricing varies by plan and is configured per-organization. **Don't hard-code costs into your app** — every successful response carries a `chargeInfo` envelope alongside `output` that tells you exactly what was charged for that call:

```typescript
const result = await peopleSearch({
  /* ... */
});

console.log(result.data?.chargeInfo);
// {
//   method: 'charged-now',          // 'charged-now' | 'charging-later' | 'charged-for-async-process' | 'free'
//   creditsCharged: 25,             // present when method !== 'free'
//   lowCreditAlert: null            // populated with a top-up URL when running low
// }
```

For a non-charging dry-run estimate of contact enrichment costs, use [`estimateEnrichmentCost`](https://api.fiber.ai/ai-docs/estimateEnrichmentCost.md). For the per-org pricing breakdown across operations, inspect `getOrgCredits().data.output.creditsPerOperation`.

### Free Endpoints

The following endpoints never charge credits:

- `getOrgCredits` — Check credit balance
- `getRegions`, `getLanguages`, `getTimeZones`, `getIndustries`, `getTags`, `getNaicsCodes`, `getAccelerators` — Utility endpoints
- All exclusion-list management endpoints

### Check Your Credits

```typescript
import { getOrgCredits } from "@fiberai/sdk";

const credits = await getOrgCredits({
  query: { apiKey: process.env.FIBERAI_API_KEY! },
});

console.log(`Available: ${credits.data?.output.available}`);
console.log(`Used: ${credits.data?.output.used}`);
console.log(`Max: ${credits.data?.output.max}`);
console.log(`Resets on: ${credits.data?.output.usagePeriodResetsOn}`);
```

## Support

- **Documentation**: [api.fiber.ai/docs](https://api.fiber.ai/docs)
- **Email**: team@fiber.ai
- **Website**: [fiber.ai](https://fiber.ai)
- **Get API Key**: [fiber.ai/app/api](https://fiber.ai/app/api)

## License

MIT

---

Made with ❤️ by [Fiber AI](https://fiber.ai)
