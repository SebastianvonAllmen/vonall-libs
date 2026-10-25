# @vonall/auth

Accounts for a Web App Factory Product: better-auth with the signup hooks (signup modes `invite`, `open`, `admin`;
the first account is the admin, or the addresses of `ADMIN_EMAILS`), Einladungen, Konto, the three account mails, the `protected…`/`admin…` helpers for
remote functions, the remote functions of accounts and Einladungen, the auth routes' `load`s; Admin as an option.
The pages and the settings tabs follow in a later release.

```ts
// src/lib/remote/schema/auth.sql.ts: the tables, re-exported so drizzle-kit sees them (the Product keeps the migrations)
import { authSchema } from "@vonall/auth/schema";
export const schema = authSchema({ admin: true, mcp: true });
export const { user, session, account, verification, twoFactor, rateLimit, einladung } = schema;

// src/lib/auth.ts: the wiring, once; the instance is built here so its types (every plugin's) are inferred here
import { ac, roles } from "@vonall/auth";
import { createAuth } from "@vonall/auth/server";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { sveltekitCookies } from "better-auth/svelte-kit";
const wiring = createAuth({ db, schema, secret: BETTER_AUTH_SECRET, origin: ORIGIN, appName: APP_NAME, locale: LOCALE, signupMode: SIGNUP_MODE, mailer, social: { github: { clientId, clientSecret } }, log: logger });
export const auth = betterAuth({
	...wiring.options,
	plugins: [twoFactor(), admin({ ac, roles }), /* the MCP endpoint's, from @vonall/mcp */ sveltekitCookies(getRequestEvent)],
});
// The context: everything with accounts outside a request takes it (createMcp, scripts, tests); inside a request it is
// `event.locals.auth`. register() checks the instance's plugins against the schema's options (admin, mcp).
export const { ctx, sessionHandle, apiHandler } = wiring.register(auth);

// src/lib/auth-client.ts       createAuthClient({ baseURL: PUBLIC_ORIGIN, plugins: [twoFactorClient(), adminClient({ ac, roles })] })  (from "better-auth/svelte")
// src/hooks.server.ts            sequence(securityHeaders, sessionHandle)
// src/routes/api/auth/[...auth]  export const GET = apiHandler, POST = apiHandler
// src/routes/auth/login          export { loginLoad as load } from "@vonall/auth/server"
// src/app.d.ts                   user: typeof auth.$Infer.Session.user | null; session: typeof auth.$Infer.Session.session | null
```

Entry points: `@vonall/auth` (types, validation schemas, `ac`/`roles` for the admin plugins, `isAdmin`, `mayInvite`, the
fresh-session helpers, the messages), `@vonall/auth/schema`, `@vonall/auth/server`, `@vonall/auth/remote` (the remote
functions a Product's components call), `@vonall/auth/testing` (`testAuth(db)` gives the context, `createUser(ctx)` an account, for db tests). `better-auth` is
this package's dependency; the Product imports its plugins from the same version. `@node-rs/argon2` (the password
hash, a native module) is a peer dependency: the Product lists it, so its server bundle can leave it external.

The server side is functions of the context: `userRepo(ctx)`, `einladungRepo(ctx)`, `einladungService(ctx)`, `authMails(ctx)`;
a remote function gets it with `authContext()`, a load with `contextOf(locals)`.

Strings come in English and German: `configureAuthMessages({ locale, overrides })`. A Product's own user-owned tables
reference `user.id` with `onDelete: "cascade"`, so deleting a Konto takes everything with it. The MCP endpoint's
better-auth plugins and rate limit rule come from `@vonall/mcp` through `plugins` and `rateLimitRules`.

## Who is the admin

Without `adminEmails`, the very first account is the admin and needs neither an Einladung nor a confirmation. With
`createAuth({ adminEmails: ADMIN_EMAILS })` (comma-separated, case doesn't matter) nobody is first: the listed
addresses sign up without an Einladung and get the role once the address is confirmed, with Google or GitHub at
once, with a password through the mailed confirmation link. Without mail (local development), a listed address may be
the first account, trusted as the first account is; after that a password signup needs mail. An account that was
listed later gets the role at its next login. The list only grants the role; an admin takes it away
in the user list. The signup page keeps showing its form when a list exists, with a hint for administrators.

## A Product's own fields of a person

Two patterns. Anything with its own life (a profile, preferences, a membership) is the Product's own table with
`userId` → `user.id`, `onDelete: "cascade"`, edited through its own remote function; the `profile` snippet of
`SettingsPage` puts that form below name and email, or `extraTabs` gives it a tab. What better-auth should set at
signup is a column on `user`:

```ts
export const schema = authSchema({ admin: true, user: { phone: text("phone") } });        // the column (and a migration)
createAuth({ …, userFields: { phone: { type: "string", required: false } } });             // better-auth takes it at signup and in updateUser
createAuthClient({ plugins: [inferAdditionalFields({ user: { phone: { type: "string" } } }), …] });  // the browser client's types
```

`userRepo(ctx)` selects every column, so the admin's list and the profile carry the Product's too.

The Profile tab edits those columns when `SettingsPage` gets a `fields` snippet: it renders inside the name and email
form and binds into `extra`, one key per `userFields` entry, filled from the page's `user` (`homeLayoutLoad` adds
`userFields`); hidden inputs carry `extra` along, so the snippet's inputs take no `name`. `updateUserProfile` takes the extra keys (strings, coerced to the field's `type`; an undeclared key is a
400) and hands them to better-auth's `updateUser`. `setAuthUi({ authClient, displayName })` names a person from more
than `user.name` wherever the components show one (the settings header, the mobile menu, the admin's list); the
avatar's initials follow that name.

```svelte
<SettingsPage>{#snippet fields(extra)}<Input bind:value={extra.surname} />{/snippet}</SettingsPage>
```

## A Product's own columns on `einladung`, roles and hooks

What an Einladung hands to the account it creates (a role, a group) is a column on `einladung`:

```ts
export const schema = authSchema({ admin: true, einladung: { rolle: text("rolle").notNull().default("user") } });
createAuth({
	…,
	einladung: {
		input: z.object({ rolle: z.enum(["trainer", "user"]).default("user") }), // createEinladung's keys beyond email; none allowed without it
		authorize: (extras, user) => (extras.rolle === "trainer" && user.role !== "admin" ? "Only admins invite trainers" : null), // a 403; may be async
	},
	roles: ["admin", "trainer", "user"], // what an admin may hand out (setUserRole, AdminView); default admin and user
	hooks: {
		beforeUserCreate: (user) => ({ ...user, surname: "" }), // after this package's name step; sets userFields
		afterEinladungAccepted: (userId, einladung) => …, // at signup (before the admin role is given) and when a logged-in user accepts
		afterUserCreate: (user, einladung) => …, // after the Einladung and the admin role; einladung is null without one
		beforeUserDelete: (userId) => …, // before the admin's or the owner's delete: what lives outside the database
	},
});
```

`einladungService(ctx).erstellen(userId, { email, ...extras })` writes the columns, `pruefen` and the repository's lists
read them back (`EinladungRow<typeof schema>`, never the token's hash), `annehmen` returns the row and runs the hook.
`einladungLoad` and `signupLoad` put them into the page data's `einladung` beside `inviterName`. `AdminView` renders
its role select from `manageUserLoad`'s `roles` (`roleLabel` names them), marks banned accounts, and takes `intro`,
`showEinladungErstellen`, and the snippets `userExtra(user, isSelf)`, `einladungExtra(einladung)` and
`einladungFields(extras)` (inside the form that creates one, bound into `extras`; `SettingsPage` passes the same
snippet to the Invitations tab). `userRepo(ctx).setBanned(userId, banned, reason)` bans (ending the sessions) or unbans.

## The pages and the settings (`@vonall/auth/ui`)

```svelte
<!-- src/routes/+layout.svelte: once, so the components know the client; the app's name, locale and signup mode
     reach them through the page data of this package's loads (authLayoutLoad, homeLayoutLoad, einladungLoad) -->
<script lang="ts">
	import { setAuthUi } from "@vonall/auth/ui";
	setAuthUi({ authClient });
</script>

<!-- src/routes/auth/login/+page.svelte -->   <LoginForm>{#snippet footer()}…the privacy line…{/snippet}</LoginForm>
<!-- src/routes/auth/signup/+page.svelte -->  <RegisterForm />
<!-- src/routes/auth/reset-password -->       <ResetPasswordForm />
<!-- src/routes/einladung/[token] -->         <EinladungPage {data} tagline={APP_TAGLINE} />
<!-- src/routes/home/settings -->             <SettingsPage extraTabs={[agentsTab()]}>{#snippet profile()}…{/snippet}{#snippet extra(id)}…{/snippet}</SettingsPage>
<!-- src/routes/home/manage_user -->          <AdminView currentUserId={data.currentUserId} />
```

`SettingsTabDef.after` places a Product's tab after the one it names (default: after this package's);
`SettingsTabDef.panel: false` renders a tab that brings its own cards without the panel frame around it; `SettingsPage`
takes `invitations={false}` to hide the Invitations tab, `menuFooter` for the end of the mobile menu and
`mobileMenu` for the phone's navigation in the Product's own look (a snippet given
`{ user, memberSince, tabs, active, select }`: the menu while `active` is undefined, the bar back to it while a tab is
open; `tabs` are the ones this user may see, `select(id)` opens one, `select("")` returns to the menu). `AdminView` takes `class` for the page's width and spacing. `RegisterForm`
takes `redirectTo` (where a new account lands, the social buttons included) and a `description` snippet; `EinladungPage`
takes `title` and a `loggedIn(einladung)` snippet for someone who already has an account. A social login's callback
error lands on `/auth/login` (`?error=`). `createUser(ctx, email, name)` in `@vonall/auth/testing` takes a name.

The components read `page.data` as the loads of this package fill it (`providers`, `mail`, `state`, `einladung`, `user`,
`session`, `einladen`), use the `.panel` and `.section-kicker` classes of the Factory's `app.css`, and ship their own
copies of the shadcn-svelte avatar, button, card, input, label and tabs; the Product's `app.css` adds
`@source "../node_modules/@vonall/auth/dist"`.

The components read the page data of this package's loads through `authPageData("providers", …)` (typed `AuthPageData`;
a missing key throws with the load to use), so a Product's own component beside them can do the same.
