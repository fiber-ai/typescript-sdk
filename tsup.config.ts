import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const packageJson: { version: string } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default defineConfig({
  define: {
    __FIBER_SDK_VERSION__: JSON.stringify(packageJson.version),
  },
  // Each entry produces its own dist/<name>.{js,cjs,d.ts,d.cts} bundle.
  // Zod schemas live behind the '@fiberai/sdk/zod' subpath so consumers who
  // don't need runtime validation aren't forced to pull ~6 MB of z.object()
  // calls into their main bundle.
  entry: {
    index: "src/index.ts",
    zod: "src/zod.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  // Only externalize runtime dependencies
  external: ["zod"],
});
