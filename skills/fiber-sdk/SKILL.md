---
name: fiber-ai-sdk
description: Use the Fiber AI TypeScript SDK to call Fiber AI APIs (contact/people/company search and enrichment) and answer questions about what API methods to use, their input and output schemas.
---

# Fiber AI SDK Skill

Use the official `@fiber-ai/typescript-sdk` package to call Fiber AI APIs from Node/TypeScript. The SDK wraps Fiber AI's contact enrichment, people search, company search, and other endpoints.

## When to activate

- User asks how to integrate or call **Fiber AI APIs** from TypeScript/Node.
- User wants to know **which API method to use**, **what inputs it needs**, or **what output it returns**.
- User asks for code examples using the Fiber AI SDK.

## Instructions

1. Ensure the user has installed `@fiber-ai/typescript-sdk` and set an API key (e.g., via env vars).
2. **Use Context7 MCP**: Search for "fiber ai" or "fiber ai sdk" to pull up-to-date SDK docs. Use Context7 when the user asks which API to use, or about input/output schema — or look at types in `node_modules/@fiber-ai/typescript-sdk` (e.g. generated types) for exact request/response shapes.
3. Identify the correct SDK method (e.g., company search, people search, email-to-person enrichment).
4. Explain the **input schema** (which parameters are needed) and **output schema** (what fields are returned).
5. Provide a short TypeScript example using the SDK method.

## Examples

- Ask: "What are the inputs/outputs for company search with the Fiber AI SDK?"
- Respond by describing the parameters expected (e.g., filters like industry, location) and what fields the API returns (company name, domain, size, etc.).
- Provide a short TypeScript snippet showing how to call that method.
