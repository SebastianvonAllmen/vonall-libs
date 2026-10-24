# @vonall/auth

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
