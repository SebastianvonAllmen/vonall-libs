---
"@vonall/auth": minor
"@vonall/mcp": minor
---

An explicit context instead of the registry singleton. `@vonall/auth`: `createAuth(options)` returns `{ options, register }`; `register(auth)` gives `{ ctx, sessionHandle, apiHandler }` and checks the instance's plugins against the schema's options (`admin` is read off the schema, no longer an option). The repositories, services and mails are functions of the context (`userRepo(ctx)`, `einladungRepo(ctx)`, `einladungService(ctx)`, `authMails(ctx)`); remote functions read it with `authContext()`, loads with `contextOf(locals)`; the session handle puts it into `event.locals.auth`. `setAuthUi({ authClient })` takes only the client: the app's name, locale and signup mode come through the page data of the package's loads. `testAuth(db)` returns the context, `createUser(ctx, email)`. `@vonall/mcp`: `createMcp({ auth: ctx, … })`, `mcpPlugins(origin)` replaces `mcpPluginOptions`/`CIMD_OPTIONS`, `agentRepo(ctx)`, `mcpContext()`, `agentsTab()` with its own strings; `ConsentPage` and `AgentsTab` take no `appName`/`locale`; `@vonall/auth` is a peer dependency.
