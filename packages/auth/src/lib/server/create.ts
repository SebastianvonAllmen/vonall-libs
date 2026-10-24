/**
 * better-auth for a Product, from explicit options. The Product's `src/lib/auth.ts` builds the instance itself, so its
 * types are inferred in the Product (its plugins included): `betterAuth({ ...authOptions({…}), plugins: […] })`, then
 * `registerAuth(auth)` for the session handle and the API handler; everything else in this package reads the result.
 */
import type { RequestHandler } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { getRequestEvent } from "$app/server";
import { betterAuth, type BetterAuthOptions, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin as adminPlugin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { sveltekitCookies, svelteKitHandler } from "better-auth/svelte-kit";
import type { Mailer } from "@vonall/mail";
import { m } from "#lib/messages.js";
import { roles, ac } from "#lib/permissions.js";
import type { AuthSchema, FullSchema } from "#lib/schema/index.js";
import { hashPassword, verifyPassword } from "#lib/server/crypto.js";
import { consoleLog, registry, setRegistry, type AuthLog, type Db } from "#lib/server/registry.js";
import { UserRepo } from "#lib/server/repositories/UserRepo.js";
import { EINLADUNG_COOKIE, EinladungService } from "#lib/server/service/einladung.service.js";
import { sendPasswordResetEmail, sendVerifyEmail } from "#lib/server/service/mail.js";
import { MIN_PASSWORD_LENGTH, type SignupMode } from "#lib/types.js";
import { nameFromEmail } from "#lib/util/names.js";

export type SocialProvider = { clientId: string; clientSecret: string };

export type CreateAuthOptions = {
	/** The Product's Drizzle database. */
	db: Db;
	/** The Product's tables from `authSchema()`, the same objects its `schema/` re-exports. */
	schema: AuthSchema;
	/** BETTER_AUTH_SECRET. */
	secret: string;
	/** The app's own address (ORIGIN), e.g. https://blueprint.vonall.ch. */
	origin: string;
	appName: string;
	/** LOCALE, e.g. "en-GB" or "de-CH": dates in mails. */
	locale: string;
	signupMode: SignupMode;
	/** The Product's mailer (`@vonall/mail`); off without SMTP, which the signup mode `open` and the reset respect. */
	mailer: Mailer;
	/** The Admin option: the admin plugin and roles, the first account becomes admin. Matches `authSchema({ admin })`. */
	admin?: boolean;
	/** Social logins with keys; a provider without keys is left out (its button never shows). */
	social?: { github?: SocialProvider | null; google?: SocialProvider | null };
	/** More rate limit rules, by path (`@vonall/mcp` adds `/oauth2/register`). */
	rateLimitRules?: Record<string, { window: number; max: number }>;
	log?: AuthLog;
};

/** The Einladung token the browser carries from its link (`/einladung/[token]`), if any. */
function einladungAusCookie(): string | undefined {
	try {
		return getRequestEvent().cookies.get(EINLADUNG_COOKIE);
	} catch {
		return undefined; // outside a request, e.g. in scripts
	}
}

const hasKeys = (p: SocialProvider | null | undefined): p is SocialProvider => Boolean(p?.clientId && p.clientSecret && p.clientId !== "dummy");

/**
 * The instance's type, with every plugin of this package: what `App.Locals` and the Products' code infer from. The admin
 * plugin is in it whether or not the option is on, so `user.role` exists; without the option it is left out at runtime
 * and nobody has a role.
 */
type BasePlugins = [ReturnType<typeof twoFactor>, ReturnType<typeof adminPlugin<{ ac: typeof ac; roles: typeof roles }>>, ReturnType<typeof sveltekitCookies>];
export type Auth<P extends BetterAuthPlugin[] = []> = ReturnType<typeof betterAuth<{ plugins: [...BasePlugins, ...P] }>>;
/**
 * The Product's instance as `registerAuth()` takes it: built on `authOptions()`, with any plugins (their types stay the
 * Product's; this package uses the instance through its own `Auth` type).
 */
export type AuthLike = { handler: (request: Request) => Promise<Response>; api: object; $context: Promise<object> };

/** The admin plugin's columns, named here because the plugin's type doesn't carry them into the session's user. */
export type AdminFields = { role?: string | null; banned?: boolean | null; banReason?: string | null; banExpires?: Date | null };
/** The user and the session as the hooks put them into `locals` (a Product's `app.d.ts` uses these). */
export type AuthUser = Auth["$Infer"]["Session"]["user"] & AdminFields;
export type AuthSession = Auth["$Infer"]["Session"]["session"];

export function authOptions(options: CreateAuthOptions): BetterAuthOptions {
	const { secret, origin, appName, signupMode, admin = false, social = {}, rateLimitRules = {}, log = consoleLog } = options;
	setRegistry({
		db: options.db,
		schema: options.schema as FullSchema,
		appName,
		origin,
		locale: options.locale,
		signupMode,
		mailer: options.mailer,
		admin,
		log,
		auth: null,
		providers: { github: hasKeys(social.github), google: hasKeys(social.google) },
	});
	const baseURL = origin || "http://localhost";
	return {
		appName,
		baseURL,
		secret: secret || "dummy-secret-for-build-purposes-only",
		database: drizzleAdapter(options.db, { provider: "pg", schema: options.schema }),
		account: {
			// A GitHub or Google login joins the account with the same email, when the provider confirms that email
			accountLinking: { enabled: true },
		},
		advanced: {
			// Behind Coolify's Traefik: it sets X-Real-Ip to the client address itself, so clients can't fake it (the app's
			// port is never published, Traefik is the only way in)
			ipAddress: { ipAddressHeaders: ["x-real-ip"] },
		},
		rateLimit: {
			enabled: true,
			storage: "database",
			window: 60,
			max: 100,
			customRules: {
				"/sign-in/*": { window: 60, max: 10 },
				"/sign-up/*": { window: 60, max: 10 },
				"/two-factor/*": { window: 60, max: 10 },
				"/request-password-reset": { window: 300, max: 3 },
				...rateLimitRules,
			},
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						// The signup mode decides: an Einladung, or (open) mail for the confirmation link. The very first account
						// (the admin) needs neither and counts as confirmed.
						const { state, firstAccount } = await EinladungService.signup(einladungAusCookie());
						if (state === "needs_einladung") throw new APIError("FORBIDDEN", { message: m().needsEinladung });
						if (state === "no_mail") throw new APIError("FORBIDDEN", { message: m().noMail });
						if (firstAccount) user.emailVerified = true;
						// Signup with email and password sends the email's local part as the name; make it readable
						if (user.email && (!user.name || user.name === user.email.split("@")[0])) user.name = nameFromEmail(user.email);
						return { data: user };
					},
					after: async (user) => {
						// The first user becomes admin
						if (admin && (await UserRepo.countUsers()) === 1) {
							log.info("First user created, bootstrapping global role to admin");
							await UserRepo.setRole(user.id, "admin");
						}
						const token = einladungAusCookie();
						if (!token) return;
						const angenommen = await EinladungService.annehmen(user.id, token);
						if (angenommen.isErr()) log.warn("Einladung could not be accepted after signup", { userId: user.id, kind: angenommen.error.kind });
						getRequestEvent().cookies.delete(EINLADUNG_COOKIE, { path: "/" });
					},
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			password: { hash: hashPassword, verify: verifyPassword },
			minPasswordLength: MIN_PASSWORD_LENGTH,
			// Signup mode open: anyone may sign up, so the email address is confirmed before the account can be used
			requireEmailVerification: signupMode === "open",
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordResetEmail(user, url);
			},
		},
		emailVerification: {
			sendOnSignUp: signupMode === "open",
			sendOnSignIn: signupMode === "open",
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				if (!user.emailVerified) await sendVerifyEmail(user, url);
			},
		},
		socialProviders: {
			...(hasKeys(social.github) ? { github: social.github } : {}),
			...(hasKeys(social.google) ? { google: social.google } : {}),
		},
		user: {
			changeEmail: { enabled: true, updateEmailWithoutVerification: true },
		},
		session: {
			// No cookie cache: every request reads the session and the user, so a new role (the first account's, one set by
			// an admin) and a ban count at once instead of after up to 5 minutes; for a small app that one query is nothing
			cookieCache: { enabled: false },
		},
	};
}

export type RegisteredAuth = {
	/** The hooks handle: the session into `locals.user`/`locals.session`, and better-auth's own routes (/api/auth/*). */
	handle: Handle;
	/** For `src/routes/api/auth/[...auth]/+server.ts`: `export const GET = apiHandler, POST = apiHandler`. */
	apiHandler: RequestHandler;
	/** The social logins that have keys; the login, signup and settings pages show only these. */
	providers: { github: boolean; google: boolean };
};

/** Hands the Product's instance to this package (after `authOptions()`) and returns the handles. */
export function registerAuth(auth: AuthLike): RegisteredAuth {
	const current = registry();
	setRegistry({ ...current, auth: auth as Auth });
	const instance = auth as Auth;
	const handle: Handle = async ({ event, resolve }) => {
		const session = await instance.api.getSession({ headers: event.request.headers });
		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
		const { building } = await import("$app/env");
		return svelteKitHandler({ event, resolve, auth: instance, building });
	};
	const apiHandler: RequestHandler = ({ request }) => auth.handler(request);
	return { handle, apiHandler, providers: current.providers };
}
