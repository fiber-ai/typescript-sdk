/**
 * Fiber AI TypeScript SDK
 *
 * Official SDK for interacting with the Fiber AI API.
 * @see https://fiber.ai for documentation
 */

// Re-export all generated SDK methods and types
export * from "./generated/index.js";

// Re-export the pre-configured client instance
export { client } from "./generated/client.gen.js";

// Re-export client utilities for custom client creation
export {
  createClient,
  createConfig,
  type Client,
  type Config,
  type ClientOptions,
  type CreateClientConfig,
  type RequestOptions,
  type Options,
  type TDataShape,
} from "./generated/client/index.js";
