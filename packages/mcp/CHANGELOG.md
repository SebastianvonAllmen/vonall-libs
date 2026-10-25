# @vonall/mcp

## 0.6.1

### Patch Changes

- Updated dependencies [[`def7b56`](https://github.com/SebastianvonAllmen/vonall-libs/commit/def7b562134e25fb254cb50d2ed2e09ef8f37aa3)]:
  - @vonall/auth@0.10.0

## 0.6.0

### Minor Changes

- [#25](https://github.com/SebastianvonAllmen/vonall-libs/pull/25) [`c6d3336`](https://github.com/SebastianvonAllmen/vonall-libs/commit/c6d33363a0499985de1ecfd1c4c88a8f013acdf5) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - An access gate, prompts per user and consent page slots. `createMcp({ admit?: (ctx: ToolContext) => Promise<Admission> })` with `Admission = { ok: true } | { ok: false; reason: string }`: asked on every call after the token and consent checks, `{ ok: false }` answers HTTP 403 with the JSON-RPC error `{ code: -32001, message: reason }`; `consentLoad` adds `admission` to the page data and `mcpTester(mcp)` applies it (`send`/`call` return the error, new `admit(userId)`); the registration (`Mcp`) carries `admit`. `prompts?: Prompt[] | ((ctx: ToolContext) => Promise<Prompt[]>)` (type `Prompts`, helper `promptsFor`): a function is asked on every `prompts/list` and `prompts/get`, and the capability is advertised whenever a function is given or the list is not empty. `ConsentPage` snippets `scopes` (replaces the tool-scope list), `notice` (after the consent note) and `refusalNote`; with `data.admission.ok === false` the page shows the reason, `refusalNote` and one "Back to the assistant"/"Zurück zum Assistenten" button that answers deny (message key `backToAssistant`). `agentRepo(ctx).hasAny(userId)`: whether the user allowed any assistant.

### Patch Changes

- Updated dependencies [[`50d73c4`](https://github.com/SebastianvonAllmen/vonall-libs/commit/50d73c4ef914dde179e161bbf02eadc2aefbe12d)]:
  - @vonall/auth@0.9.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`9bbe0a3`](https://github.com/SebastianvonAllmen/vonall-libs/commit/9bbe0a38ef597698673973353dcc763d8b2c3a67)]:
  - @vonall/auth@0.8.0

## 0.5.0

### Minor Changes

- [#19](https://github.com/SebastianvonAllmen/vonall-libs/pull/19) [`9fe0085`](https://github.com/SebastianvonAllmen/vonall-libs/commit/9fe0085c417ed808632f14ca94a2d061cfea07be) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - A deeper `Tool`: `run(ctx, input)` with `ctx: { userId, clientId, locale, role }`; an optional `scope: { en, de }` per tool, which the consent page lists (`consentLoad` adds `toolScopes`; the Product's children stay possible). `createMcp()` returns the registration (`tools`, `prompts`, `serverInfo`, `ctx`, `toolContext`), which `mcp.oauth` puts into `event.locals.mcp` and `mcpTester(mcp)` takes. `MCP_PATH` is the one place the endpoint's path is written.

- [#18](https://github.com/SebastianvonAllmen/vonall-libs/pull/18) [`501cdd2`](https://github.com/SebastianvonAllmen/vonall-libs/commit/501cdd29349d56ccf1a87248950a3098f9e6e29d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - `@vonall/auth`: a Product's own columns on `user` (`authSchema({ user: { phone: text("phone") } })` with `createAuth({ userFields })`); `userRepo(ctx)` selects every column. One typed `AuthPageData` between the loads and the components, read through `authPageData(...keys)` (throws naming the load when a key is missing); `signupLoad` no longer returns `mode`; `EinladungPage` takes `einladungLoad`'s data. `SettingsPage` takes a `profile` snippet below name and email; `SettingsTabDef.deletionNote` lets a tab add its sentence to the deletion tab (`DeletionTab` takes `notes`, no `agents`); the `deletionAgents` message moved to `@vonall/mcp`, whose `agentsTab()` carries it.

### Patch Changes

- Updated dependencies [[`501cdd2`](https://github.com/SebastianvonAllmen/vonall-libs/commit/501cdd29349d56ccf1a87248950a3098f9e6e29d)]:
  - @vonall/auth@0.7.0

## 0.4.0

### Minor Changes

- [#17](https://github.com/SebastianvonAllmen/vonall-libs/pull/17) [`f1d99ba`](https://github.com/SebastianvonAllmen/vonall-libs/commit/f1d99ba19b46d4f3a0eb8dd7ed595c9a513b6d0f) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - An explicit context instead of the registry singleton. `@vonall/auth`: `createAuth(options)` returns `{ options, register }`; `register(auth)` gives `{ ctx, sessionHandle, apiHandler }` and checks the instance's plugins against the schema's options (`admin` is read off the schema, no longer an option). The repositories, services and mails are functions of the context (`userRepo(ctx)`, `einladungRepo(ctx)`, `einladungService(ctx)`, `authMails(ctx)`); remote functions read it with `authContext()`, loads with `contextOf(locals)`; the session handle puts it into `event.locals.auth`. `setAuthUi({ authClient })` takes only the client: the app's name, locale and signup mode come through the page data of the package's loads. `testAuth(db)` returns the context, `createUser(ctx, email)`. `@vonall/mcp`: `createMcp({ auth: ctx, … })`, `mcpPlugins(origin)` replaces `mcpPluginOptions`/`CIMD_OPTIONS`, `agentRepo(ctx)`, `mcpContext()`, `agentsTab()` with its own strings; `ConsentPage` and `AgentsTab` take no `appName`/`locale`; `@vonall/auth` is a peer dependency.

### Patch Changes

- Updated dependencies [[`f1d99ba`](https://github.com/SebastianvonAllmen/vonall-libs/commit/f1d99ba19b46d4f3a0eb8dd7ed595c9a513b6d0f)]:
  - @vonall/auth@0.6.0

## 0.3.0

### Minor Changes

- [#16](https://github.com/SebastianvonAllmen/vonall-libs/pull/16) [`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - One messages helper: `@vonall/messages` exports `defineMessages({ en, de })`, and every package's `configure…Messages({ locale })` takes the app's locale as is ("de-CH", "en-GB"), the language derived from it. In development, reading a package's strings before configuring them throws. The `Locale` type is gone. `@vonall/auth`: the near-duplicate keys `invalidEmailDot`, `passwordsDontMatchDot` and `passwordTooShortDot` are merged into `invalidEmail`, `passwordsMismatch` and `passwordTooShort`; `inviteIntro` takes the number of days.

### Patch Changes

- Updated dependencies [[`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d)]:
  - @vonall/messages@0.1.0
  - @vonall/auth@0.5.0

## 0.2.0

### Minor Changes

- The pass-through services are gone: `UserRepo.kontoLoeschen` replaces `KontoService.loeschen`; `EinladungRepo.listOpenBy`/`listAllOpen` replace `EinladungService.offene`/`alleOffenen`, and `EinladungService.zurueckziehen(null, id)` the admin's withdrawal; `AgentRepo` replaces `AgentService`. `@vonall/mcp`'s components use `@vonall/auth`'s `messageOf`.

### Patch Changes

- Updated dependencies []:
  - @vonall/auth@0.4.0

## 0.1.3

### Patch Changes

- The code review's fixes: `svelte-sonner`, `bits-ui`, `@lucide/svelte` and `mode-watcher` are peer dependencies (one copy per app, so toasts reach the Product's Toaster); the login page no longer echoes unknown `?error=` codes and clears the URL's reason on a new attempt; every path goes through the base path; the settings page stays where the Product mounted it; copying the backup codes reports a failure.
- Updated dependencies []:
  - @vonall/auth@0.3.1

## 0.1.2

### Patch Changes

- `createMcp()` reads the auth instance on the first request, not at module load, so the Product's auth wiring and the endpoint may import each other.

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @vonall/auth@0.3.0

## 0.1.0

### Minor Changes

- The first release: the MCP protocol with tools and prompts (IronPact's), `createMcp()` for the endpoint and the OAuth hooks handle, `mcpPluginOptions`/`CIMD_OPTIONS`/`MCP_RATE_LIMIT_RULES` for the better-auth instance, `mcpClientPlugins()`, `consentLoad`, the `ConsentPage` and `AgentsTab` components, the Agents service over `@vonall/auth`'s tables, `mcpTester()` for a Product's tests; strings in English and German.
