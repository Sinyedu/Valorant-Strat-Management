# Stratbook — Valorant Stratbook Platform

A library and viewer for Valorant strategies exported from Wingman, TactiVal, and ValoPlant. It is **not** a strategy editor. See `AGENTS.md` and `CLAUDE.md` for requirements and conventions.

**Status: Phase 2 (accounts and folders).** Sign-up, log-in, a personal workspace per user, and nested folders (create, rename, move, delete) are implemented. Uploads, strategies, and importers are not implemented yet.

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · MongoDB + Mongoose · Auth.js v5 (credentials) · Zod · Vitest · pnpm · Node.js 22+

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev                      # http://localhost:3000
```

You need a MongoDB instance (local install or MongoDB Atlas). Public pages render without one; sign-up, log-in, folders, and `/api/health` need it.

## Scripts

| Script           | Purpose                      |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start the dev server         |
| `pnpm build`     | Production build             |
| `pnpm start`     | Serve the production build   |
| `pnpm lint`      | ESLint                       |
| `pnpm typecheck` | Generate route types + `tsc` |
| `pnpm test`      | Vitest (DB tests need `MONGODB_TEST_URI`) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and build on pushes to `master` and on pull requests. It starts a `mongo:8` Docker service container so the database integration tests run quickly without Atlas, and needs no secrets.

Locally, the integration tests are skipped unless `MONGODB_TEST_URI` is set (for example `mongodb://127.0.0.1:27017/vsmp_test`). The database name must contain `test`: the tests drop that database and refuse to run otherwise.

## Environment variables

| Name              | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string, ideally ending in `/vsmp` (server-side only)             |
| `AUTH_SECRET`     | Random secret that signs session tokens. Generate with `npx auth secret`            |
| `AUTH_TRUST_HOST` | `true` when running `pnpm start` yourself; only behind a host or proxy you control |

## Checking the database connection

With `MONGODB_URI` set and MongoDB running, `GET /api/health` returns `200 {"database":"connected"}`; otherwise `503`.

If an Atlas `mongodb+srv://` URI fails with `querySrv ECONNREFUSED`, your DNS resolver is refusing SRV lookups. Use Atlas's non-SRV `mongodb://host1,host2,host3/...` string instead (Connect → Drivers → older driver version), or switch your DNS to a public resolver.

## Accounts and security notes

- Passwords are hashed with bcrypt (12 rounds). Length is capped at 72 bytes, bcrypt's limit.
- Sessions are JWTs (14 days). The user's workspace id comes from the session, never from client input.
- Every folder query is scoped by workspace. Moves are checked for cycles and cross-workspace parents.
- Failed log-ins are throttled per email (5 per 15 minutes). The throttle is in memory, so it is per server instance.
- **Not yet implemented:** email verification, password reset, account deletion.
- Deleting a folder is refused if it has subfolders. Cascade rules come with strategies.

## Layout

```
src/
  app/                 routes, layouts, server actions, route handlers
  auth.ts              Auth.js configuration
  components/          reusable UI
  lib/validation/      Zod schemas
  server/              server-only code (guarded by `server-only`)
    db/                Mongoose connection
    models/            Mongoose models (User, Workspace, Folder)
    services/          business logic (auth, folders)
    import/            import adapter contract (adapters come later)
    storage/           file storage interface (provider not chosen)
  types/               shared TypeScript types and DTOs
```

## License

[MIT](LICENSE) © 2026 Simon Nyblom. Third-party map and agent imagery is not covered by this license and is not distributed in this repository.
