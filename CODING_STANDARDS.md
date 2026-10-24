# Coding standards

Judgement calls a reviewer checks in every diff. Mechanical rules (`type` over `interface`, native `#private` fields,
database access only in repositories, `.remote.ts` exports, no remote functions in server code) are enforced by
`pnpm lint`; they are repeated below only where they shape the design.

## Domain language

- Names in code, comments and UI copy use the terms of `GLOSSARY.md`, never the synonyms it lists under _Avoid_.
- A new domain concept gets its term in `GLOSSARY.md` in the same change.
- User-facing strings (UI copy, validation messages, toasts, error messages shown to users) are written in the
  Product's UI language: **English** (Setup sets this line; for German use Swiss spelling, "ss" instead of "ß").
  Code and comments are English.
- Status and kind values come from enums in `src/lib/types/` of the package, never as inline string literals.

## Error handling

- Expected failures are returned as neverthrow `Result`s; truly unexpected ones are wrapped, logged and surfaced.
- An error that is logged is also surfaced: thrown or returned, never only logged.

## Structure

- Database access only in a package's `src/lib/server/repositories/`. Repositories are plain object literals
  (`const XRepo = { async method() {…} }`); a `class` only where it holds instance state.
- Use cases live in `src/lib/server/service/`; pure decision logic in `src/lib/util/`, with unit tests. Remote
  functions and MCP tools only check permissions, call a service and refresh queries.
- Every user-owned row carries the user's id. Private rows: every query filters by it. Shared rows (the spec says who
  sees them): reads may cross users, but every write checks the owner in the service and filters by it in the
  repository, and a test proves another user can't change it.
- Zod schemas are derived from the Drizzle tables via `drizzle-zod`, then `.extend()`ed, not written in parallel.
- Domain types are derived from the Drizzle tables (`InferSelectModel`/`InferInsertModel`) unless they diverge.
- `type` over `interface`. Imports use `#lib/…` across directories and relative paths within a feature folder.
- UI reuses the package's own `src/lib/components/ui/` copies (standard token names) before adding new base components; packages never import a Product's components.
- State in `src/lib/states/` is for data that is not persisted; persisted data is loaded through remote functions.
- Secrets and personal addresses never reach the browser: server-only env variables, and email addresses assembled
  client-side from split parts where one has to be shown.

## Consistency

- New code matches the surrounding code's naming, comment density and idioms.
- A schema change comes with a changeset whose line starts with `schema:`; the Products generate the migration.
- Tests check behaviour at the three seams (pure functions, application services against Postgres, the Factory's Playwright
  smoke, run there), not implementation details.
