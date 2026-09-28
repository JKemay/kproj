import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Populates the env vars several modules require at *import* time
    // (see src/test/setup.ts) before any test file's top-level imports run.
    setupFiles: ['./src/test/setup.ts'],
    // No global mock auto-reset: some mocks here (e.g. the JWKS cache in
    // verifyJwt.test.ts) are meaningfully asserted on at module-load time,
    // before any test/beforeEach body runs, so a blanket reset would erase
    // the very call it's supposed to prove happened. Each test file resets
    // the mocks it owns explicitly instead.
  },
});
