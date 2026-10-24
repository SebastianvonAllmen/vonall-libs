/**
 * What `createAuth()` set up, for everything else in this package and in `@vonall/mcp`: the Product's database and
 * tables, its options and, after `register()`, its better-auth instance. It is passed explicitly; inside a request it
 * is also in `event.locals.auth` (the session handle puts it there), where the remote functions and the loads find it.
 */
import { getRequestEvent } from "$app/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Mailer } from "@vonall/mail";
import type { AuthSchema } from "#lib/schema/index.js";
import type { Auth } from "#lib/server/create.js";
import type { SignupMode } from "#lib/types.js";

// Any Drizzle schema generic: a Product's `drizzle(url)` may carry one or none
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = NodePgDatabase<any>;

/** Where the package reports; a Product passes its logger, the default is the console. */
export type AuthLog = {
	debug(message: string, context?: Record<string, unknown>): void;
	info(message: string, context?: Record<string, unknown>): void;
	warn(message: string, context?: Record<string, unknown>): void;
	error(message: string, context?: Record<string, unknown>, error?: unknown): void;
};

export type AuthContext<S extends AuthSchema = AuthSchema> = {
	db: Db;
	schema: S;
	appName: string;
	origin: string;
	/** The app's locale, e.g. "de-CH": dates in mails and on the pages. */
	locale: string;
	signupMode: SignupMode;
	mailer: Mailer;
	log: AuthLog;
	/** The Admin option: `schema` has the role columns (and the instance the admin plugin, `register()` checks). */
	admin: boolean;
	/** Whether `schema` has the OAuth provider's tables (`@vonall/mcp`). */
	mcp: boolean;
	/** The social logins that have keys. */
	providers: { github: boolean; google: boolean };
	/** The Product's instance; reading it before `register()` throws. */
	readonly auth: Auth;
};

/** The context of the current request: `event.locals.auth`, which the session handle set. */
export function authContext(): AuthContext {
	return contextOf(getRequestEvent().locals);
}

export function contextOf(locals: object): AuthContext {
	const ctx = (locals as { auth?: AuthContext }).auth;
	if (!ctx) throw new Error("@vonall/auth: no auth context on this request; the session handle of createAuth().register() is not in hooks.server.ts");
	return ctx;
}

export const consoleLog: AuthLog = {
	debug: () => {},
	info: (message, context) => console.info(message, context ?? ""),
	warn: (message, context) => console.warn(message, context ?? ""),
	error: (message, context, error) => console.error(message, context ?? "", error ?? ""),
};
