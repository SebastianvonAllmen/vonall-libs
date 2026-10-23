/**
 * What the auth components need from the Product, set once in its root layout (`setAuthUi({ … })` during component
 * init): the better-auth client (the Product builds it, see `src/lib/auth-client.ts`), the app's name, its locale and
 * signup mode.
 */
import { getContext, setContext } from "svelte";
import type { SignupMode } from "#lib/types.js";

type Outcome<T = unknown> = Promise<{ data?: T | null; error?: { message?: string; code?: string; status?: number } | null }>;
type FetchCallbacks = {
	onRequest?: () => void;
	onSuccess?: (ctx: { data: unknown }) => void | Promise<void>;
	onError?: (ctx: { error: { code?: string; message?: string; status?: number } }) => void | Promise<void>;
};

/**
 * The better-auth client as these components use it (method syntax, so the Product's client with its exact
 * parameter types is assignable).
 */
export type AuthClientLike = {
	signIn: {
		email(body: { email: string; password: string }, callbacks?: FetchCallbacks): Outcome;
		social(body: { provider: string; callbackURL?: string; errorCallbackURL?: string }): Outcome;
	};
	signUp: { email(body: { email: string; password: string; name: string; callbackURL?: string }, callbacks?: FetchCallbacks): Outcome };
	signOut(options?: { fetchOptions?: FetchCallbacks }): Outcome;
	requestPasswordReset(body: { email: string; redirectTo?: string }): Outcome;
	resetPassword(body: { newPassword: string; token: string }): Outcome;
	twoFactor: {
		verifyTotp(body: { code: string; trustDevice?: boolean }): Outcome;
		enable(body: { password: string }): Outcome<{ method?: string; totpURI?: string; backupCodes?: string[] } | Record<string, unknown>>;
		disable(body: { password: string }): Outcome;
	};
	linkSocial(body: { provider: string; callbackURL?: string }): Outcome;
	unlinkAccount(body: { accountId: string; providerId?: string }): Outcome;
};

export type AuthUi = {
	authClient: AuthClientLike;
	appName: string;
	/** For dates, e.g. "de-CH". */
	locale: string;
	signupMode: SignupMode;
};

const KEY = Symbol("vonall-auth-ui");

/** In the Product's root layout. */
export function setAuthUi(ui: AuthUi): AuthUi {
	return setContext(KEY, ui);
}

export function authUi(): AuthUi {
	const ui = getContext<AuthUi | undefined>(KEY);
	if (!ui) throw new Error("@vonall/auth: setAuthUi({ authClient, appName, locale, signupMode }) has not run in the root layout");
	return ui;
}
