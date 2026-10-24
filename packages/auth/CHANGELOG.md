# @vonall/auth

## 0.7.0

### Minor Changes

- [#18](https://github.com/SebastianvonAllmen/vonall-libs/pull/18) [`501cdd2`](https://github.com/SebastianvonAllmen/vonall-libs/commit/501cdd29349d56ccf1a87248950a3098f9e6e29d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - `@vonall/auth`: a Product's own columns on `user` (`authSchema({ user: { phone: text("phone") } })` with `createAuth({ userFields })`); `userRepo(ctx)` selects every column. One typed `AuthPageData` between the loads and the components, read through `authPageData(...keys)` (throws naming the load when a key is missing); `signupLoad` no longer returns `mode`; `EinladungPage` takes `einladungLoad`'s data. `SettingsPage` takes a `profile` snippet below name and email; `SettingsTabDef.deletionNote` lets a tab add its sentence to the deletion tab (`DeletionTab` takes `notes`, no `agents`); the `deletionAgents` message moved to `@vonall/mcp`, whose `agentsTab()` carries it.

## 0.6.0

### Minor Changes

- [#17](https://github.com/SebastianvonAllmen/vonall-libs/pull/17) [`f1d99ba`](https://github.com/SebastianvonAllmen/vonall-libs/commit/f1d99ba19b46d4f3a0eb8dd7ed595c9a513b6d0f) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - An explicit context instead of the registry singleton. `@vonall/auth`: `createAuth(options)` returns `{ options, register }`; `register(auth)` gives `{ ctx, sessionHandle, apiHandler }` and checks the instance's plugins against the schema's options (`admin` is read off the schema, no longer an option). The repositories, services and mails are functions of the context (`userRepo(ctx)`, `einladungRepo(ctx)`, `einladungService(ctx)`, `authMails(ctx)`); remote functions read it with `authContext()`, loads with `contextOf(locals)`; the session handle puts it into `event.locals.auth`. `setAuthUi({ authClient })` takes only the client: the app's name, locale and signup mode come through the page data of the package's loads. `testAuth(db)` returns the context, `createUser(ctx, email)`. `@vonall/mcp`: `createMcp({ auth: ctx, … })`, `mcpPlugins(origin)` replaces `mcpPluginOptions`/`CIMD_OPTIONS`, `agentRepo(ctx)`, `mcpContext()`, `agentsTab()` with its own strings; `ConsentPage` and `AgentsTab` take no `appName`/`locale`; `@vonall/auth` is a peer dependency.

## 0.5.0

### Minor Changes

- [#16](https://github.com/SebastianvonAllmen/vonall-libs/pull/16) [`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - One messages helper: `@vonall/messages` exports `defineMessages({ en, de })`, and every package's `configure…Messages({ locale })` takes the app's locale as is ("de-CH", "en-GB"), the language derived from it. In development, reading a package's strings before configuring them throws. The `Locale` type is gone. `@vonall/auth`: the near-duplicate keys `invalidEmailDot`, `passwordsDontMatchDot` and `passwordTooShortDot` are merged into `invalidEmail`, `passwordsMismatch` and `passwordTooShort`; `inviteIntro` takes the number of days.

### Patch Changes

- Updated dependencies [[`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d)]:
  - @vonall/messages@0.1.0
  - @vonall/mail@0.2.0

## 0.4.0

### Minor Changes

- The pass-through services are gone: `UserRepo.kontoLoeschen` replaces `KontoService.loeschen`; `EinladungRepo.listOpenBy`/`listAllOpen` replace `EinladungService.offene`/`alleOffenen`, and `EinladungService.zurueckziehen(null, id)` the admin's withdrawal; `AgentRepo` replaces `AgentService`. `@vonall/mcp`'s components use `@vonall/auth`'s `messageOf`.

## 0.3.1

### Patch Changes

- The code review's fixes: `svelte-sonner`, `bits-ui`, `@lucide/svelte` and `mode-watcher` are peer dependencies (one copy per app, so toasts reach the Product's Toaster); the login page no longer echoes unknown `?error=` codes and clears the URL's reason on a new attempt; every path goes through the base path; the settings page stays where the Product mounted it; copying the backup codes reports a failure.

## 0.3.0

### Minor Changes

- The pages and the settings as components (`@vonall/auth/ui`): `LoginForm`, `RegisterForm`, `ResetPasswordForm`, `EinladungPage`, `SettingsPage` with its tabs (profile, security with two-factor, sessions, linked accounts, invitations, deletion, a Product's own), `AdminView`, `EinladungErstellen`; `setAuthUi({ authClient, appName, locale, signupMode })` in the root layout; every string in English and German.

## 0.2.1

### Patch Changes

- `@node-rs/argon2` is a peer dependency: a native module has to be a direct dependency of the Product, so its server bundle can leave it external and resolve it at runtime.

## 0.2.0

### Minor Changes

- The Product builds the better-auth instance and client itself, so their types are inferred where they are used: `betterAuth({ ...authOptions({…}), plugins: [twoFactor(), admin({ ac, roles }), …, sveltekitCookies(getRequestEvent)] })`, then `registerAuth(auth)` for the session handle and the API handler; `createAuth()`, `createAuthClient()` and the `./client` entry are gone.

## 0.1.2

### Patch Changes

- The plugins passed to `createAuth()` and `createAuthClient()` are inferred as tuples, so `authClient.twoFactor`, `authClient.admin` and the MCP plugins' members type-check in a Product.

## 0.1.1

### Patch Changes

- The plugins a Product passes to `createAuth()` and `createAuthClient()` are part of the returned types (`auth.api.…`, `authClient.…` of the MCP endpoint's plugins).

## 0.1.0

### Minor Changes

- schema: the first release, the server side: `createAuth()` (better-auth with the signup hooks, the Einladung, the mails, Admin as an option), `authSchema()` with the tables (`user`, `session`, `account`, `verification`, `twoFactor`, `rate_limit`, `einladung`; the OAuth provider's with `mcp`), the `protected…`/`admin…` helpers, the remote functions of accounts and Einladungen, the route loads, `createAuthClient()`, the test helpers.

### Patch Changes

- Updated dependencies []:
  - @vonall/mail@0.1.1
