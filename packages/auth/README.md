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

// src/lib/auth.ts: the wiring, once; the instance is built here so its types (every plugin's) are inferred here
import { ac, roles } from "@vonall/auth";
import { authOptions, registerAuth } from "@vonall/auth/server";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { sveltekitCookies } from "better-auth/svelte-kit";
export const auth = betterAuth({
	...authOptions({ db, schema, secret: BETTER_AUTH_SECRET, origin: ORIGIN, appName: APP_NAME, locale: LOCALE, signupMode: SIGNUP_MODE, mailer, admin: true, social: { github: { clientId, clientSecret } }, log: logger }),
	plugins: [twoFactor(), admin({ ac, roles }), /* the MCP endpoint's, from @vonall/mcp */ sveltekitCookies(getRequestEvent)],
});
export const { handle: sessionHandle, apiHandler, providers } = registerAuth(auth);

// src/lib/auth-client.ts       createAuthClient({ baseURL: PUBLIC_ORIGIN, plugins: [twoFactorClient(), adminClient({ ac, roles })] })  (from "better-auth/svelte")
// src/hooks.server.ts            sequence(securityHeaders, sessionHandle)
// src/routes/api/auth/[...auth]  export const GET = apiHandler, POST = apiHandler
// src/routes/auth/login          export { loginLoad as load } from "@vonall/auth/server"
// src/app.d.ts                   user: typeof auth.$Infer.Session.user | null; session: typeof auth.$Infer.Session.session | null
```

Entry points: `@vonall/auth` (types, validation schemas, `ac`/`roles` for the admin plugins, `isAdmin`, `mayInvite`, the
fresh-session helpers, the messages), `@vonall/auth/schema`, `@vonall/auth/server`, `@vonall/auth/remote` (the remote
functions a Product's components call), `@vonall/auth/testing` (`createUser`, `testAuth` for db tests). `better-auth` is
this package's dependency; the Product imports its plugins from the same version. `@node-rs/argon2` (the password
hash, a native module) is a peer dependency: the Product lists it, so its server bundle can leave it external.

Strings come in English and German: `configureAuthMessages({ locale, overrides })`. A Product's own user-owned tables
reference `user.id` with `onDelete: "cascade"`, so deleting a Konto takes everything with it. The MCP endpoint's
better-auth plugins and rate limit rule come from `@vonall/mcp` through `plugins` and `rateLimitRules`.
