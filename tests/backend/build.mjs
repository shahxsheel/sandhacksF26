// Bundles harness.mts with esbuild, swapping the Neon client for PGlite and the provider SDK wrappers for mocks.
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, ".runtime", "backend-test");

await build({
  entryPoints: [path.join(here, "harness.mts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(outDir, "out.mjs"),
  tsconfig: path.join(root, "tsconfig.json"),
  external: ["sharp", "@electric-sql/pglite"],
  absWorkingDir: root,
  logLevel: "warning",
  plugins: [
    {
      name: "backend-test-shims",
      setup(b) {
        b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "empty" }));
        b.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "" }));
        b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: path.join(here, "db-shim.mjs") }));
        b.onResolve({ filter: /^\.\/providers$/ }, () => ({ path: path.join(here, "providers-mock.mts") }));
      },
    },
  ],
});
console.log(path.join(outDir, "out.mjs"));
