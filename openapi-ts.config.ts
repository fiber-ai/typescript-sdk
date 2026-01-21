import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://alpha.api.fiber.ai/openapi.json",
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
