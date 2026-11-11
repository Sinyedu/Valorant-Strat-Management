# CLAUDE.md — Valorant Stratbook Platform

Read `AGENTS.md` first. It contains the product requirements, architecture rules, import contract, and security expectations. Follow both documents; where they conflict, ask for clarification rather than guessing.

## Your role

Act as a pragmatic senior full-stack React/TypeScript engineer and reviewer. Help implement a polished, maintainable strategy library for Valorant teams, coaches, IGLs, and players. Optimize for shipping a useful MVP, not for adding speculative features.

## Product in one paragraph

Users sign up, create folders/playbooks, select which third-party tool produced a strategy, upload its export, preview it directly in the browser, and save it to the current folder. Wingman `.map` files contain structured multi-scene data; TactiVal and ValoPlant currently enter the system as individual image exports. Uploads require no manual strategy title, map, or side. Metadata is editable after import. The app is a **storage, organization, and static viewing** tool, not an editor.

## Technical constraints

- **React + TypeScript full-stack on Next.js App Router is confirmed** (see "Confirmed technology stack" below). Do not propose a different framework.
- **MongoDB is confirmed. Use Mongoose** for models and database access. Do not propose PostgreSQL, Prisma, or another database without explicit approval.
- Prefer `pnpm`, `fetch`, strict TypeScript, and minimal dependencies.
- Prefer simple, readable code and files roughly <=150 lines when practical; split by responsibility, not arbitrary line counts.
- Use private file/object storage for uploads. The authentication and storage providers are not yet selected.
- Keep MongoDB models separate from API DTOs and frontend types. Use indexes based on real access patterns, enforce ownership in queries, and avoid unbounded embedded arrays.
- Keep uploaded binaries out of MongoDB. Store original object keys and bounded metadata in MongoDB; use separate frame documents or object storage for large preview payloads.
- No Google ecosystem dependency for the core workflow.
- No premature microservices or overengineered abstraction layers.

## UX requirements

1. Upload begins inside a folder or selected destination.
2. User chooses source: Wingman / TactiVal / ValoPlant / Generic.
3. File chooser/drop zone accepts the relevant export type.
4. Preview what will be imported; for Wingman show the scene count and map when parsed; for images show thumbnails.
5. Save without mandatory form fields. Use the filename as a title fallback.
6. After saving, allow renaming, tagging, moving, grouping frames, and editing optional map/side metadata.
7. Strategy detail page displays static preview frames with next/previous navigation; original file remains downloadable.
8. Make bulk upload efficient for image-based providers.

## Wingman importer guidance

The example `.map` is gzip + JSON, observed keys: `formatVersion`, `scenes`, `activeSceneId`, `mapId`. The supplied example uses version 2 and has five scenes. Decode on the server, validate the complete structure, preserve the original file, and produce a normalized preview representation. Do not assume all element types or coordinate transforms are known. For unsupported element types, preserve source data and report graceful degradation rather than fabricating a preview. Render only supported primitives, using a verified map asset and coordinate mapping.

## MongoDB implementation guidance

- Use Mongoose schemas with explicit field validation and timestamps where appropriate.
- Keep user/workspace/folder/strategy/attachment/frame documents separately addressable when they have independent lifecycles.
- Use references and indexes for scoped folder listings and strategy queries; avoid loading entire workspaces to display one folder.
- Validate ObjectIds and authorization before accessing documents or storage objects.
- Prevent cross-workspace parent references and folder cycles.
- Keep import/preview payloads bounded. MongoDB documents cannot exceed 16 MiB.
- Design cleanup or reconciliation for failures between MongoDB writes and object storage; do not assume cross-system atomicity.
- Do not add Redis, background workers, or additional databases until a measured need exists.

## Implementation sequence

1. Inspect repository; confirm authentication and object-storage choices if not already made. Next.js, MongoDB, and Mongoose are already selected.
2. Implement accounts and private workspaces/folders.
3. Implement strategy and attachment persistence with access control.
4. Implement image upload, thumbnail preview, and bulk import.
5. Implement Wingman parsing with strict validation and fixture tests.
6. Implement static scene renderer with verified coordinate mapping.
7. Implement strategy detail view, scene/image navigation, downloads, search, and metadata editing.
8. Polish UX, test authorization and malformed files, document supported formats.

## Coding-agent behavior

- Do not silently expand scope or add a strategy editor.
- Before major changes, briefly state the intended files, data flow, and risks.
- Implement small vertical slices that can be tested end to end.
- Do not fabricate provider APIs, export formats, image assets, or licensing permissions.
- Distinguish **confirmed** capabilities from **planned** capabilities in code, docs, and UI.
- Do not use unsafe shortcuts for file parsing, upload authorization, or object storage access.
- Ask only questions that block progress; otherwise choose a conservative implementation and document assumptions.
- After each task, summarize what changed, tests executed, and any remaining limitations.

## Definition of done for first usable MVP

A signed-in user can create a nested folder, select a source, upload PNG/JPEG/WebP exports, preview them in the browser, save them without entering metadata, reopen the strategy, edit its name, and download the original. Wingman `.map` support is done only when the supplied sample can be decoded, validated, imported, and its supported scene content rendered accurately; a successful JSON parse alone does not count as a complete preview.

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
