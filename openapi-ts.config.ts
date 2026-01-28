import { defineConfig } from "@hey-api/openapi-ts";

const specUrl ="https://api.fiber.ai/openapi.json";

export default defineConfig({
  input: specUrl,
  output: {
    path: "src/generated",
    clean: true, // Remove old generated files when regenerating
  },
  plugins: [
    "@hey-api/typescript", // Generate TypeScript types
    "@hey-api/sdk", // Generate SDK methods
    "@hey-api/client-fetch", // Use native fetch as HTTP client (bundled since v0.73+)
    "zod", // Generate Zod schemas for runtime validation
  ],
});
