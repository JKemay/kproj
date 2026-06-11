// Small wrapper around esbuild's JS API.
// Bypasses pnpm's bin shim which mis-invokes esbuild's native binary on macOS.
// Usage: node scripts/build.mjs <entrypoint> <outfile>

import { build } from 'esbuild';

const [, , entry, outfile] = process.argv;
if (!entry || !outfile) {
  console.error('usage: node scripts/build.mjs <entrypoint> <outfile>');
  process.exit(1);
}

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  // sharp comes from the kproj-sharp Lambda layer (native linux-arm64 binaries
  // can't be bundled); pg-native is an optional pg dep that's never installed.
  external: ['pg-native', 'sharp'],
  logLevel: 'info',
});
