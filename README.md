# kproj

A personal, invite-only K-pop media archive. Also a hands-on AWS learning sandbox.

## Architecture

```
Browser (Next.js / Vercel)
  ├── Cognito Hosted UI (Google sign-in) ──► Cognito User Pool (+ Pre-SignUp allowlist Lambda)
  ├── Bearer JWT ──► API Gateway HTTP API ──► Lambda (Hono router, in VPC)
  │                                              ├── RDS Postgres (private) via Drizzle
  │                                              └── S3 signed URLs (POST upload / GET read)
  └── direct HTTPS ──► S3 (private bucket)
```

- **Frontend** (`web/`): Next.js 16 App Router, React 19, Tailwind v4, `oidc-client-ts`.
- **API** (`api/`): single Hono Lambda router. JWT verified with `aws-jwt-verify` (bundled JWKS).
- **DB** (`db/`): Drizzle schema + migrations for Postgres.
- **Infra** (`infra/`): manual AWS setup notes (Terraform/CDK is a future task).

## Workspace

pnpm workspaces. Common commands:

```bash
pnpm install
pnpm --filter @kproj/web dev          # frontend on :3000
pnpm --filter @kproj/api dev          # local API on :8787
pnpm --filter @kproj/api package:api  # bundle + zip the Lambda
pnpm --filter @kproj/db generate      # generate a migration from schema.ts
```

## Secrets / config

- Frontend config lives in `web/.env.local` (gitignored). All `NEXT_PUBLIC_*` and non-secret
  (Cognito pool id, API URL — security comes from rules, not obscurity).
- No AWS credentials anywhere in the repo. The Lambda uses its execution role; the browser
  only ever sees short-lived signed URLs.
- **No media binaries in git** — all images/GIFs/videos live in S3.

## Deploy

- Frontend → Vercel (root directory: `web`).
- Backend → AWS (see `infra/README.md` for every resource + the exact CLI used).
