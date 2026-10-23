# @vonall/auth

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
