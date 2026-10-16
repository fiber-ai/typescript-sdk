import type { Config } from "./generated/client/index.js";
import { mergeHeaders } from "./generated/client/index.js";
import type { ClientOptions } from "./generated/types.gen.js";

// Replaced with the package.json version by tsup at build time.
declare const __FIBER_SDK_VERSION__: string;

const clientAttributionHeaders: Record<string, string> = {
  "x-client-type": "SDK",
  "x-client-name": `fiberai-ts/${__FIBER_SDK_VERSION__}`,
};

/**
 * Wired into the generated default `client` via `runtimeConfigPath` in
 * openapi-ts.config.ts, so it survives regeneration. Headers from `setConfig()`
 * or per-request `headers` take precedence over these defaults.
 */
export function createClientConfig(
  config: Config<ClientOptions>
): Config<ClientOptions> {
  return {
    ...config,
    headers: mergeHeaders(clientAttributionHeaders, config.headers),
  };
}
