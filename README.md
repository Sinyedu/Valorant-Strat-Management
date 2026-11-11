# Stratbook — Valorant Stratbook Platform

A library and viewer for Valorant strategies exported from Wingman, TactiVal, and ValoPlant. It is **not** a strategy editor. See `AGENTS.md` and `CLAUDE.md` for requirements and conventions.

**Status: Phase 4 (Wingman import, first slice).** Accounts, nested folders, and PNG/JPEG/WebP strategy upload are implemented: pick a source, choose files, preview thumbnails, save, then open, page through frames, rename, download the original, or delete. **Wingman `.map` import** decodes and validates the file and shows each scene as a static SVG (see below). There is no tagging, search, or map/side editing UI.

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
| `STORAGE_DIR`     | Optional. Directory for uploaded files (default `./.storage`)                       |
| `AUTH_TRUST_HOST` | `true` when running `pnpm start` yourself; only behind a host or proxy you control |

## Checking the database connection

With `MONGODB_URI` set and MongoDB running, `GET /api/health` returns `200 {"database":"connected"}`; otherwise `503`.

If an Atlas `mongodb+srv://` URI fails with `querySrv ECONNREFUSED`, your DNS resolver is refusing SRV lookups. Use Atlas's non-SRV `mongodb://host1,host2,host3/...` string instead (Connect → Drivers → older driver version), or switch your DNS to a public resolver.

## Uploads

- Sources with image upload: TactiVal, ValoPlant, Generic. TactiVal and ValoPlant are treated as plain image exports; no structured format is assumed.
- Limits: PNG, JPEG, or WebP only, 10 MB each, 25 files per upload. File type is decided from the file signature, never from the extension or the browser-declared MIME type. SVG, GIF, and PDF are rejected.
- Many images: one strategy per image by default, or tick "group" to make one multi-frame strategy. Titles come from filenames and can be renamed afterwards.
- Originals are stored unchanged in private object storage (SHA-256 recorded); MongoDB holds only metadata and opaque object keys. Files are served only through `/api/attachments/[id]`, which checks the session and workspace.
- Storage is **local disk** (`STORAGE_DIR`, default `./.storage`, git-ignored) behind the `FileStorage` interface. This is a development default: use an S3-compatible provider (and back it up) before real deployment.
- Imports are all-or-nothing: on failure, created documents and stored files are removed. Strategies are created as `processing` and hidden until complete. A server crash mid-import can still leave orphaned files or `processing` documents; there is no automated reconciliation job yet.
- **Wingman (.map)**: one file per import (max 5 MB; max 8 MB once decompressed), gzip + JSON `formatVersion` 2 only. The server validates the structure, keeps the original, and stores one frame per scene. Confirmed from the sample: `character`, `ability`, `pen`, `freehand`, `text`, and `bomb` elements. Any other element type is skipped and reported ("Not shown") rather than guessed. **Map backgrounds:** `public/maps/<mapId>.png` (3200x1800, from Wingman screenshots with the title and bomb icon painted out) plus one shared scene-to-pixel transform in `src/lib/map-backgrounds.ts` (`px = 2.303·x + 217.9`, `py = 2.303·y − 22`). The transform is **verified** on Ascent, Summit and Corrode: each map's bomb element lands within 1 px of the bomb in its image (regression-tested). Icebox, Bind, Haven, Breeze, Fracture, Lotus, Abyss, Sunset, Pearl and Split use the same transform but are **not yet checked** on their own scenes, and the viewer says so in its caption. The artwork is Wingman's, so confirm you may redistribute it. To add a map, supply a clean screenshot and a scene screenshot, add the image under `public/maps/`, register it, and add a regression point.

  **Other limitations:**  Map id is saved on the strategy only when every scene agrees (the sample mixes maps); side is never inferred. The Wingman importer has fixture tests against `sample/`; the MongoDB integration test needs `MONGODB_TEST_URI`.
- Deleting a folder is refused while it has subfolders or strategies.

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
    models/            Mongoose models (User, Workspace, Folder, Strategy, StrategyAttachment, StrategyFrame)
    services/          business logic (auth, folders, strategies, import)
    import/            import adapter contract, image validation (Wingman adapter comes later)
    storage/           FileStorage interface + local-disk implementation
  types/               shared TypeScript types and DTOs
```

## License

[MIT](LICENSE) © 2026 Simon Nyblom. Third-party map and agent imagery is not covered by this license and is not distributed in this repository.
