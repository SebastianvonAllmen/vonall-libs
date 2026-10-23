# @vonall/auth

## 0.1.1

### Patch Changes

- The plugins a Product passes to `createAuth()` and `createAuthClient()` are part of the returned types (`auth.api.…`, `authClient.…` of the MCP endpoint's plugins).

## 0.1.0

### Minor Changes

- schema: the first release, the server side: `createAuth()` (better-auth with the signup hooks, the Einladung, the mails, Admin as an option), `authSchema()` with the tables (`user`, `session`, `account`, `verification`, `twoFactor`, `rate_limit`, `einladung`; the OAuth provider's with `mcp`), the `protected…`/`admin…` helpers, the remote functions of accounts and Einladungen, the route loads, `createAuthClient()`, the test helpers.

### Patch Changes

- Updated dependencies []:
  - @vonall/mail@0.1.1
