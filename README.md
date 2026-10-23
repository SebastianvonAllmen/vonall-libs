# vonall-libs

The Libraries of the [Web App Factory](https://github.com/SebastianvonAllmen/web.app.factory): the parts of every
Product that are the same everywhere, as npm packages, so a fix reaches every Product as a version bump (the Factory's
ADR 0005).

| Package | What it holds |
| --- | --- |
| `@vonall/messages` | `defineMessages({ en, de })`: how every package holds its strings and takes the app's locale. |
| `@vonall/mail` | Mail over any SMTP server (nodemailer): a `Mailer`, the builder, the mail layout. Off without an SMTP host. |
| `@vonall/auth` | better-auth with the hooks, the `protected…`/`admin…` helpers, Einladungen, Konto, the auth pages and the settings tabs; Admin as an option. |
| `@vonall/mcp` | The MCP endpoint with tools and prompts, OAuth for agents, the consent page, the Agents tab. |
| `@vonall/shell` | The app shell behind login: sidebar, mobile header and tabs, breadcrumbs. |

Every package exposes one `create…()` with explicit options, carries its UI strings in English and German, exports the
Drizzle tables it owns (the Product keeps the migrations) and ships its own copies of the shadcn-svelte components it
uses, styled by the Product's tokens.

Working on it: `AGENTS.md`. Releases: changesets, published by the release workflow on merge to `main`.
