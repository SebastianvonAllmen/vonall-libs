# Changesets

Every change that reaches a Product gets a changeset: `pnpm changeset` (or a file written by hand here), with the
package, the bump and one line a Product's `/update` skill will show its author. A change that adds, removes or
alters a Drizzle table starts its line with `schema:`; that word is what the Products' update flow looks for.

Merging to `main` lets the release workflow open or update the "Version Packages" pull request; merging that
publishes to npm.
