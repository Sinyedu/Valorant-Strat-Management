# Stratbook — Valorant Stratbook Platform

A library and viewer for Valorant strategies exported from Wingman, TactiVal, and ValoPlant. It is **not** a strategy editor. See `AGENTS.md` and `CLAUDE.md` for requirements and conventions.

**Status: Phase 1 (foundation).** Only the app shell and MongoDB connection utility exist. Authentication, folders, uploads, and importers are not implemented.

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · MongoDB + Mongoose · Zod · pnpm · Node.js 22+

## Setup

```bash
pnpm install
cp .env.example .env.local   # then edit MONGODB_URI
pnpm dev                      # http://localhost:3000
```

You need a MongoDB instance (local install or MongoDB Atlas). The app shell runs without one; only `/api/health` needs it.

## Scripts

| Script           | Purpose                       |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Start the dev server          |
| `pnpm build`     | Production build              |
| `pnpm start`     | Serve the production build    |
| `pnpm lint`      | ESLint                        |
| `pnpm typecheck` | Generate route types + `tsc`  |

## Environment variables

| Name          | Description                                  |
| ------------- | -------------------------------------------- |
| `MONGODB_URI` | MongoDB connection string (server-side only) |

## Checking the database connection

With `MONGODB_URI` set and MongoDB running, `GET /api/health` returns `200 {"database":"connected"}`; otherwise `503`.

## Layout

```
src/
  app/                 routes, layouts, route handlers
  components/          reusable UI
  lib/validation/      Zod schemas (env now; request schemas later)
  server/              server-only code (guarded by `server-only`)
    db/                Mongoose connection
    import/            import adapter contract (adapters come later)
    storage/           file storage interface (provider not chosen)
  types/               shared TypeScript types
```

`src/server/models/` and `src/server/services/` will be added in Phase 2 when the first model and service exist.

## License

[MIT](LICENSE) © 2026 Simon Nyblom. Third-party map and agent imagery is not covered by this license and is not distributed in this repository.
