/**
 * What `createAuth()` set up, for the package's repositories, services and remote functions: the Product's database,
 * its tables, the options and the better-auth instance. One app per process, so a module-level value; the Product's
 * wiring (`src/lib/auth.ts`) runs before any request.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Mailer } from "@vonall/mail";
import type { FullSchema } from "#lib/schema/index.js";
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

export type Registry = {
	db: Db;
	schema: FullSchema;
	appName: string;
	origin: string;
	/** The app's locale for dates in mails, e.g. "de-CH". */
	locale: string;
	signupMode: SignupMode;
	mailer: Mailer;
	admin: boolean;
	log: AuthLog;
	/** The Product's instance, from `registerAuth()`; null between `authOptions()` and that call. */
	auth: Auth | null;
	/** The social logins that have keys. */
	providers: { github: boolean; google: boolean };
};

let current: Registry | null = null;

export function setRegistry(registry: Registry) {
	current = registry;
}

export function registry(): Registry {
	if (!current) throw new Error("@vonall/auth: authOptions() has not run; import the app's auth wiring (src/lib/auth.ts) first");
	return current;
}

/** The Product's better-auth instance. */
export function authInstance(): Auth {
	const auth = registry().auth;
	if (!auth) throw new Error("@vonall/auth: registerAuth(auth) has not run; the app's auth wiring (src/lib/auth.ts) calls it after betterAuth()");
	return auth;
}

export const consoleLog: AuthLog = {
	debug: () => {},
	info: (message, context) => console.info(message, context ?? ""),
	warn: (message, context) => console.warn(message, context ?? ""),
	error: (message, context, error) => console.error(message, context ?? "", error ?? ""),
};
