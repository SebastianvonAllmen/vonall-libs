# AGENTS.md

Guidance for coding agents (Claude Code reads it through `CLAUDE.md`). Read `CODING_STANDARDS.md` before writing or
reviewing code.

## What this is

The Libraries of the Web App Factory (`SebastianvonAllmen/web.app.factory`, ADR 0005 and `docs/spec.md` part 12
there): the Capabilities whose code is the same in every Product, published to npm as `@vonall/<name>`. The Factory
installs them like every Product and is their integration test; this repository tests the packages alone.

Stack: SvelteKit 3 + Svelte 5 (runes, `remoteFunctions`), TypeScript strict, `svelte-package`, Drizzle ORM +
PostgreSQL 18, better-auth, neverthrow, Zod v4, Vitest, pnpm workspace, changesets, Node 24.

## Commands

- `pnpm check`, `pnpm lint`, `pnpm test:unit`, `pnpm test:db` (needs the Compose Postgres: `docker compose up -d --wait`;
  each package's db tests get a recreated database with its schema pushed), `pnpm build` (`svelte-package` + publint).
- `pnpm ci:local`: everything CI checks, locally; run it before marking a pull request ready.
- `pnpm new <name>`: a package from `tooling/package-template/`, then `pnpm install`.
- `pnpm changeset`: the changeset for a change (`.changeset/README.md`).

## The contract every package keeps

- One `create…()` taking explicit options; the Product's wiring file reads its `env.ts`/`config.ts` and passes
  values in. Packages import nothing from `$app/env` and nothing of a Product's.
- UI strings live in `src/lib/messages.ts` in `en` and `de` (Swiss spelling, "ss"); the Product calls
  `configure<Pascal>Messages({ locale, overrides })` once; code reads `m()`. Every key exists in both languages
  (`messages.test.ts` proves it).
- Tables a package owns live in `src/lib/schema/` and are exported for the Product's schema re-export; the package
  ships no migrations. A change to a table gets a changeset whose line starts with `schema:`.
- A package ships its own copies of the shadcn-svelte components it uses (`src/lib/components/ui/`, standard token
  names) and never imports a Product's. Pages are components with their `load` exported beside them; remote functions
  live in `src/lib/remote/*.remote.ts` and are exported.
- `svelte`, `@sveltejs/kit`, `drizzle-orm`, `pg`, `zod`, `neverthrow` are peer dependencies; `better-auth`,
  `@better-auth/*` and `nodemailer` are regular dependencies of the package that uses them.
- Inside a package the Factory's layering holds: `server/repositories/` (the only Drizzle queries), `server/service/`,
  `remote/`, `components/`, `util/` with unit tests. Imports across folders use `#lib/…` with the file extension.

## Git and pull requests

- GitHub, public, default branch `main`; `gh` is logged in. Conventional Commits.
- Every pull request targets `main`: a branch `dev/<topic>`, opened as a draft (CI skips drafts) and marked ready
  after `pnpm ci:local` passes. Work that builds on an open pull request branches off that branch, but its pull request
  targets `main` too (the diff shrinks when the parent merges). Merging is the author's; any order is safe.
- Merging to `main` lets the release workflow open "chore: version packages"; merging that publishes. Nothing
  publishes from a branch.
