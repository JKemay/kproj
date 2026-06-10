import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // web/ lives inside a pnpm workspace; without this Next guesses the
  // monorepo root and warns. Harmless locally, but explicit is better.
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
