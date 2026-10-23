/**
 * What the auth components need: the better-auth client, set once in the Product's root layout (`setAuthUi({ authClient })`
 * during component init; the Product builds the client, see `src/lib/auth-client.ts`), and the app's name, locale
 * and signup mode, which this package's loads put into the page data (`authUi` in `authLayoutLoad`, `homeLayoutLoad`,
 * `einladungLoad`).
 */
import { getContext, setContext } from "svelte";
import { page } from "$app/state";
import type { AuthUiData } from "#lib/server/loads.js";

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

export type AuthUi = AuthUiData & { authClient: AuthClientLike };

const KEY = Symbol("vonall-auth-ui");

/** In the Product's root layout. */
export function setAuthUi({ authClient }: { authClient: AuthClientLike }): void {
	setContext(KEY, authClient);
}

/** In a component: the client, and the app's facts from the page data. */
export function authUi(): AuthUi {
	const authClient = getContext<AuthClientLike | undefined>(KEY);
	if (!authClient) throw new Error("@vonall/auth: setAuthUi({ authClient }) has not run in the root layout");
	const data = (page.data as { authUi?: AuthUiData }).authUi;
	if (!data) throw new Error("@vonall/auth: this page's data has no `authUi`; its load or its layout's must be one of this package's (authLayoutLoad, homeLayoutLoad, einladungLoad)");
	return { authClient, ...data };
}
