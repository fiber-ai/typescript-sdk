#!/usr/bin/env node
/**
 * Patch src/generated/zod.gen.ts after openapi-ts generation.
 *
 * @hey-api/openapi-ts (≤ 0.90.x) emits `.default({})` on parent z.object(...)
 * schemas whose children chain `.optional(...).default(<primitive>)`. In
 * Zod 4 the inner `.default()` makes those fields *required* in the output
 * type, so the outer `.default({})` no longer satisfies the overload and
 * tsc/rollup-plugin-dts refuse to compile the file.
 *
 * Every problematic site is wrapped in `z.optional(...)` or
 * `z.union([..., z.null()])`, so the outer `.default({})` is a no-op for the
 * SDK request roundtrip — `undefined` and `{}` serialize identically when
 * omitted from JSON bodies, and the parent union already accepts both.
 * Consumers calling `.parse(...)` directly will see `undefined` instead of
 * `{}` for the affected fields, but the API request is unchanged.
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

// `.default({})` is always the offender — there's no legitimate reason to
// default a complex schema to an empty object literal. Strip every occurrence
// regardless of preceding token (`)})`, `})`, `]))`, etc).
const after = before.replace(/\.default\(\{\}\)/g, "");

if (after === before) {
  console.log("[patch-zod-gen] no .default({}) sites found — already patched");
  process.exit(0);
}

const removed =
  (before.match(/\.default\(\{\}\)/g) ?? []).length -
  (after.match(/\.default\(\{\}\)/g) ?? []).length;

writeFileSync(TARGET, after, "utf8");
console.log(`[patch-zod-gen] stripped ${removed} .default({}) call(s) from zod.gen.ts`);
