# @vonall/auth

Accounts for a Web App Factory Product: better-auth with the signup hooks (signup modes `invite`, `open`, `admin`;
the first account is the admin), Einladungen, Konto, the three account mails, the `protected…`/`admin…` helpers for
remote functions, the remote functions of accounts and Einladungen, the auth routes' `load`s; Admin as an option.
The pages and the settings tabs follow in a later release.

```ts
// src/lib/remote/schema/auth.sql.ts: the tables, re-exported so drizzle-kit sees them (the Product keeps the migrations)
import { authSchema } from "@vonall/auth/schema";
export const schema = authSchema({ admin: true, mcp: true });
export const { user, session, account, verification, twoFactor, rateLimit, einladung } = schema;

// src/lib/auth.ts: the wiring, once
import { createAuth } from "@vonall/auth/server";
export const { auth, handle: sessionHandle, apiHandler } = createAuth({
	db, schema, secret: BETTER_AUTH_SECRET, origin: ORIGIN, appName: APP_NAME, locale: LOCALE, signupMode: SIGNUP_MODE,
	mailer, admin: true, social: { github: { clientId, clientSecret } }, log: logger,
});

// src/hooks.server.ts            sequence(securityHeaders, sessionHandle)
// src/routes/api/auth/[...auth]  export const GET = apiHandler, POST = apiHandler
// src/routes/auth/login          export { loginLoad as load } from "@vonall/auth/server"
// src/app.d.ts                   user: AuthUser | null; session: AuthSession | null  (from "@vonall/auth/server")
// src/lib/auth-client.ts         createAuthClient({ baseURL: PUBLIC_ORIGIN, admin: true })  (from "@vonall/auth/client")
```

Entry points: `@vonall/auth` (types, validation schemas, `isAdmin`, `mayInvite`, the fresh-session helpers, the
messages), `@vonall/auth/schema`, `@vonall/auth/server`, `@vonall/auth/client`, `@vonall/auth/remote` (the remote
functions a Product's components call), `@vonall/auth/testing` (`createUser`, `testAuth` for db tests).

Strings come in English and German: `configureAuthMessages({ locale, overrides })`. A Product's own user-owned tables
reference `user.id` with `onDelete: "cascade"`, so deleting a Konto takes everything with it. The MCP endpoint's
better-auth plugins and rate limit rule come from `@vonall/mcp` through `plugins` and `rateLimitRules`.
