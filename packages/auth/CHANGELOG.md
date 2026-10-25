# @vonall/auth

## 0.11.0

### Minor Changes

- [#37](https://github.com/SebastianvonAllmen/vonall-libs/pull/37) [`30866b2`](https://github.com/SebastianvonAllmen/vonall-libs/commit/30866b2e4374f64c04475bd960c616954fdae60c) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - A Product's own look for two pages: `SettingsPage` takes `mobileMenu`, a snippet given
  `{ user, memberSince, tabs, active, select }` that replaces the phone's settings navigation: the menu while `active` is
  undefined, the bar back to it while a tab is open (`tabs` are the ones this user may see; `select(id)` opens one,
  `select("")` returns to the menu), and `AdminView` takes
  `class`, replacing the page's width and spacing (default centred, `max-w-3xl`). Without them nothing changes.

## 0.10.0

### Minor Changes

- [`def7b56`](https://github.com/SebastianvonAllmen/vonall-libs/commit/def7b562134e25fb254cb50d2ed2e09ef8f37aa3) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - The avatar's initials in the settings header and the mobile settings menu follow the name `setAuthUi({ displayName })` shows ("Lena Muster" → "LM"), else the email's first letter as before; `displayInitials(user, name?)` takes the shown name. `SettingsTabDef.panel: false` renders a Product's settings tab without the panel frame, for a tab that brings its own cards (default `true`, unchanged).

## 0.9.0

### Minor Changes

- [#26](https://github.com/SebastianvonAllmen/vonall-libs/pull/26) [`50d73c4`](https://github.com/SebastianvonAllmen/vonall-libs/commit/50d73c4ef914dde179e161bbf02eadc2aefbe12d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - Extension points for Products with their own Einladung, roles and user fields. `authSchema({ einladung })`: a Product's own columns on `einladung` (`AuthSchema<A, M, U, E>`, the row type `EinladungRow<typeof schema>`, never the token's hash); `einladungRepo` selects every column, `einladungService(ctx).erstellen(userId, { email, ...extras })` writes them, `pruefen` returns them, `annehmen` returns the row and runs the hook, `einladungLoad` and `signupLoad` put them into the page data's `einladung`. `createAuth({ hooks: { beforeUserCreate, afterUserCreate, afterEinladungAccepted, beforeUserDelete } })`: at signup the Einladung is accepted first, then the admin role given, then `afterUserCreate` runs; `afterEinladungAccepted` also runs when a logged-in user accepts; `beforeUserDelete` runs in `userRepo.kontoLoeschen`. `createAuth({ einladung: { input, authorize } })`: `createEinladung` takes keys beyond `email`, parsed by `input` (none allowed without it, a 400) and refused by `authorize` with a message (a 403, may be async); the result keeps them. `createAuth({ roles })` (default `["admin", "user"]`): `setUserRole` checks against it, `manageUserLoad` adds `roles`, `AdminView` renders its select from it with `roleLabel`. `AdminView` props `intro`, `showEinladungErstellen`, snippets `userExtra(user, isSelf)`, `einladungExtra(einladung)`, `einladungFields(extras)` (also on `SettingsPage`, reaching the Invitations tab; `EinladungErstellen` sends `{ email, ...extras }`); a banned account shows "(banned)"/"(gesperrt)". `userRepo.setBanned(userId, banned, reason?)` bans (ending the sessions) or unbans. Profile fields: `SettingsPage` snippet `fields(extra)` inside the name and email form, `homeLayoutLoad` adds `userFields`, `updateUserProfile` takes the extra keys (declared in `userFields`, coerced to the field's type, else a 400) into `auth.api.updateUser`. `setAuthUi({ authClient, displayName })` names a person in the settings header, the mobile menu and the admin's list. `SettingsTabDef.after` places a tab; `SettingsPage` props `invitations` and `menuFooter`. `RegisterForm` props `redirectTo` and `description`; `EinladungPage` props `title` and `loggedIn(einladung)`. Social login errors land on `/auth/login`. `createUser(ctx, email, name)` takes a name. New messages: `unknownRole`, `einladungUnknownFields`, `einladungInvalidFields`, `unknownField`, `bannedMark`, `roleAdmin`, `roleUser`.

## 0.8.1

### Patch Changes

- [#22](https://github.com/SebastianvonAllmen/vonall-libs/pull/22) [`06fa87a`](https://github.com/SebastianvonAllmen/vonall-libs/commit/06fa87a26d31ae3eda0353a502e1e8390bca8ee4) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - Without mail, an address of `adminEmails` may be the first account (confirmed and admin, as the first account is without a list), so local development with `ADMIN_EMAILS` and no SMTP works; after that a password signup of a listed address still needs mail.

## 0.8.0

### Minor Changes

- [#21](https://github.com/SebastianvonAllmen/vonall-libs/pull/21) [`9bbe0a3`](https://github.com/SebastianvonAllmen/vonall-libs/commit/9bbe0a38ef597698673973353dcc763d8b2c3a67) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - `createAuth({ adminEmails })`: the addresses of a Product's `ADMIN_EMAILS` are the admins. They sign up without an Einladung and get the role once the address is confirmed (Google/GitHub at once, a password signup through the mailed link, an existing account at its next login); with a list, the first account is no longer the admin. `signupLoad` adds `adminList` to the page data and the signup form stays visible for them. `adminList()` and `isListed()` are exported.
  
  Fix: the Profile tab's name and email fields could not be edited (the effect that fills them re-ran on every keystroke).

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
