# AGENTS.md — Valorant Stratbook Platform

## Product mission

Build a web-based, centralized storage and viewing platform for Valorant strategies created in third-party tools. Users should not need Google Sheets, Google Drive, or a custom tactical editor to organize their playbooks.

**This is a strategy library and viewer, not a strategy creator.**

## Confirmed product decisions

- Full-stack **React + TypeScript** on **Next.js App Router** (see "Confirmed technology stack" below).
- **MongoDB** is the database; use **Mongoose** for database models and access.
- Users create accounts and organize strategies in folders (including nested folders).
- At upload, users explicitly select the source: **Wingman, TactiVal, ValoPlant, or Generic**.
- Upload must be low friction: **source → file(s) → preview → save to current folder**.
- Do not require strategy title, map, side, or tags during upload. Auto-extract trustworthy metadata; use the filename as a fallback title. Users can edit metadata later.
- Strategies must be viewable **on our website**. Initial previews are **static**, not editable or animated. Zoom/pan and scene/image navigation are acceptable.
- Support multiple preview frames/images per strategy. A single Wingman export may contain multiple scenes; multiple images can be grouped into one strategy.
- Preserve original uploaded files, even when preview data is derived from them.
- Support bulk image uploads and folder-level organization.
- Team collaboration, advanced permissions, public sharing, real-time editing, and animations are later-phase work unless specifically requested.

## Supported import paths (MVP)

| Source    | Input                                             | Preview strategy                                                                                     |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Wingman   | `.map` export                                     | Decode gzip-compressed JSON, validate, normalize scenes, render a static map with supported elements |
| TactiVal  | PNG/JPEG/WebP image export                        | Display original image                                                                               |
| ValoPlant | PNG/JPEG/WebP image export                        | Display original image                                                                               |
| Generic   | PNG/JPEG/WebP; PDF only if implemented explicitly | Display image or supported document                                                                  |

Do **not** claim native structured imports for TactiVal or ValoPlant without verified sample formats. Do not assume they support whole-playbook export. Never scrape third-party services or bypass access controls.

## Wingman sample evidence

The supplied example `tactical-map-2026-11-11.map` is a gzip-compressed JSON file containing keys `formatVersion`, `scenes`, `activeSceneId`, `mapId`. Its observed `formatVersion` is `2`, `mapId` is `ascent`, and it has 5 named scenes with `elements` arrays. Scene names are not guaranteed to be useful strategy titles. The sample does **not** establish reliable attack/defense metadata. Treat the format as observed, not a complete public specification. Inspect element schemas and map coordinate mapping before promising pixel-accurate rendering.

## Architectural principles

- Keep UI, business logic, persistence, object storage, and import adapters separate.
- Model a strategy as a library item with **original attachments**, **preview frames**, and **editable metadata**.
- Treat folder hierarchy as independent of source format.
- Prefer source-specific adapters behind a shared contract; unknown formats must fail gracefully.
- Keep source file bytes immutable. Rebuild normalized previews when adapters evolve.
- Metadata extraction must be conservative; never guess map/side from arbitrary filenames unless clearly marked as a suggestion.
- Prefer small modules, explicit types, and minimal dependencies. Prefer `fetch` over Axios and `pnpm` for package management.
- Do not introduce a separate backend, queue, cache, or microservice unless requirements justify it.
- Store metadata and object keys in MongoDB; store original files and image bytes in private file/object storage, not MongoDB documents or GridFS by default.
- Use Mongoose schemas and appropriate indexes. Do not introduce PostgreSQL, Prisma, or another database without explicit approval.
- Use references for independently managed entities (users, workspaces, folders, strategies, attachments). Embed only small, bounded metadata; avoid unbounded scene arrays and MongoDB's 16 MiB document limit.
- Keep database models distinct from API DTOs and validated frontend types.

## Suggested domain model
- `User`
- `Workspace` (personal initially; team-ready later)
- `WorkspaceMember` (future or minimal foundation)
- `Folder` (`parentFolderId` nullable, scoped to workspace)
- `Strategy` (`folderId`, `source`, `title`, optional `mapId`, `side`, tags/notes)
- `StrategyAttachment` (original file, content type, size, checksum, object key)
- `StrategyFrame` (ordered, scene/image reference, normalized preview data or rendered image)

Suggested MongoDB collections: `users`, `workspaces`, `workspace_members` (when needed), `folders`, `strategies`, `strategy_attachments`, `strategy_frames`. Use ObjectId references consistently. Index by access patterns, especially workspace/folder ownership, strategy source, and ordering. Ensure ownership and workspace access are checked on every read/write, including downloads and previews. Validate folder parent relationships and prevent cycles, including when moving folders.

## Import contract

Implement adapters with a clear interface, for example:

```ts
type StrategySource = "wingman" | "tactival" | "valoplant" | "generic";

type ImportedFrame = {
  name?: string;
  order: number;
  kind: "image" | "tactical-scene";
  previewData?: unknown; // replace with validated discriminated types
};

type ImportResult = {
  suggestedTitle?: string;
  mapId?: string;
  side?: "attack" | "defense";
  frames: ImportedFrame[];
};
```

The API must validate file signature/content, declared source, size limits, scene/element counts, decompression limits, and supported schema versions. A selected source chooses the adapter; it is not proof that the file is valid.

## Security and correctness

- Treat all uploads and parsed content as untrusted.
- Prevent decompression bombs and oversized payloads. Reject malformed gzip/JSON, unsupported versions, and unsafe MIME/file combinations.
- Validate and sanitize text rendered from imports. Do not execute embedded content.
- Use server-side authorization, opaque object keys, private storage, and time-limited access when applicable.
- Restrict storage paths and prevent path traversal; do not trust client-supplied filenames as paths.
- Ensure a failed import does not leave orphaned files or partially visible strategies; clean up or reconcile failures. Coordinate MongoDB writes and object-storage operations explicitly; do not assume they form one atomic transaction.
- Check third-party asset licensing/terms before distributing map or agent imagery.

## Testing requirements

- Unit tests for import adapters, malformed files, unknown versions, and metadata fallback.
- Fixture test using the provided Wingman sample when available in the repository (do not assume the chat attachment is committed).
- Tests for folder ownership, nested-folder constraints, upload authorization, and access isolation.
- Integration test: upload → preview → save → reopen → download original.
- UI tests for source selection, bulk images, and optional metadata editing.
- Test MongoDB indexes and scoped queries for common folder/strategy access patterns.

## Working style

- Before implementing, inspect the existing repository and follow its established conventions.
- Make incremental, reviewable changes. Do not rewrite unrelated code.
- Explain non-obvious architectural choices and assumptions.
- When a provider format is unknown, request a sample rather than inventing a schema.
- Run available lint, typecheck, and relevant tests; report what ran and what could not run.
- Update documentation whenever the importer contract or stored preview format changes.

## Out of scope for MVP

- Built-in tactical editor, utility placement, timeline animation, live collaboration, VOD analysis, AI strategy generation, and automatic extraction of structured strategies from flat screenshots.

## Confirmed technology stack

- Next.js App Router is the full-stack framework.
- React and TypeScript are used throughout.
- MongoDB is the primary database.
- Mongoose is the ODM.
- Tailwind CSS is used for styling.
- pnpm is the package manager.
- Use Next.js Server Components for server-rendered views.
- Use Client Components only where interactivity is required.
- Use Route Handlers for uploads, downloads, and API endpoints.
- Keep database access, file processing, and authentication
  strictly server-side.
- Use the Node.js runtime for Mongoose and Wingman gzip parsing.
- Do not introduce Express, Fastify, a separate backend,
  or a monorepo without explicit approval.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
