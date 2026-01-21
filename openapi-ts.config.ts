import { defineConfig } from "@hey-api/openapi-ts";

const specUrl =
  process.env.FIBERAI_OPENAPI_URL ?? "https://alpha.api.fiber.ai/openapi.json";

export default defineConfig({
  input: specUrl,
  output: {
    path: "src/generated",
    clean: false, // Preserve custom files when regenerating
  },
  plugins: [
    "@hey-api/typescript", // Generate TypeScript types
    "@hey-api/sdk", // Generate SDK methods
    "@hey-api/client-fetch", // Use native fetch as HTTP client (bundled since v0.73+)
    "zod", // Generate Zod schemas for runtime validation
  ],
});
