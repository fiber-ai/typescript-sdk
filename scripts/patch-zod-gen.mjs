#!/usr/bin/env node
/**
 * Patch src/generated/zod.gen.ts after openapi-ts generation.
 *
 * @hey-api/openapi-ts renders an OpenAPI `default` as a Zod 4 `.default(...)`
 * call, but the two mean different things. OpenAPI — and Zod 3, which the
 * backend uses to declare these schemas — treats a default as raw *input* that
 * still gets parsed, so a partial default picks up the schema's own inner
 * defaults. Zod 4's `.default()` instead returns the value verbatim and types
 * it against the schema's *output*, so any default that omits a field carrying
 * its own `.default()` fails to compile:
 *
 *   category: z.optional(z.union([
 *     z.object({
 *       propertyCategory: z.enum(['hotel']),
 *       freeCancellation: z.optional(z.boolean()).default(false),
 *       // ...
 *     }),
 *     // ...
 *   ])).default({ propertyCategory: 'hotel' })
 *   // TS2769: missing freeCancellation, specialOffers, ecoCertified
 *
 * `.prefault()` is Zod 4's name for the Zod 3 behaviour: it validates against
 * the input type and runs the value through the schema. Rewriting `.default(`
 * to `.prefault(` therefore compiles, and also makes the SDK's runtime
 * validation agree with what the API does for an omitted field — parsing an
 * absent `category` now yields the three booleans the type promises instead of
 * a bare `{ propertyCategory: 'hotel' }`.
 *
 * This supersedes the previous approach of stripping `.default({})` outright,
 * which only matched empty object literals (so partial defaults still broke the
 * build) and silently discarded the default instead of honouring it.
 *
 * Run via `npm run generate` (postgenerate hook).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TARGET = resolve(__dirname, "..", "src", "generated", "zod.gen.ts");

if (!existsSync(TARGET)) {
  // Generated output not present — most likely the zod plugin was disabled in
  // openapi-ts.config.ts. Skip silently so the postgenerate hook stays a no-op.
  console.log(`[patch-zod-gen] ${TARGET} not found — skipping`);
  process.exit(0);
}

const before = readFileSync(TARGET, "utf8");

// Every `.default(` in this file is a Zod method call — the generator never
// emits the token inside a string literal or a doc comment — so a global
// rewrite is safe.
const DEFAULT_CALL = /\.default\(/g;
const occurrences = (before.match(DEFAULT_CALL) ?? []).length;

if (occurrences === 0) {
  console.log("[patch-zod-gen] no .default( sites found — already patched");
  process.exit(0);
}

const after = before.replace(DEFAULT_CALL, ".prefault(");

writeFileSync(TARGET, after, "utf8");
console.log(
  `[patch-zod-gen] rewrote ${occurrences} .default( call(s) to .prefault( in zod.gen.ts`
);
