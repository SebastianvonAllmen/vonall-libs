/**
 * The `load` functions of the auth routes, for a Product's `+page.server.ts`/`+layout.server.ts` to re-export:
 * `export { loginLoad as load } from "@vonall/auth/server";`. The layouts' loads also carry what the components need
 * to know about the app (`authUi`: its name, locale and signup mode), so the Product passes nothing twice.
 */
import { error, redirect, type ServerLoadEvent } from "@sveltejs/kit";
import { m } from "#lib/messages.js";
import { contextOf, type AuthContext } from "#lib/server/context.js";
import { EINLADUNG_COOKIE, einladungService } from "#lib/server/service/einladung.service.js";
import type { SessionUser, SignupMode, SignupState } from "#lib/types.js";
import { isStale, SESSION_NOT_FRESH } from "#lib/util/fresh.js";
import { sameSitePath } from "#lib/util/sameSite.js";
import { isAdmin, mayInvite } from "#lib/util/signup.js";

type Event = Pick<ServerLoadEvent, "locals" | "url" | "request" | "cookies" | "params">;

/** What the components read from the page data (`authUi()` in `@vonall/auth/ui`). */
export type AuthUiData = { appName: string; locale: string; signupMode: SignupMode };

/**
 * Everything this package's loads put into the page data; each load returns its slice (`satisfies`), the components
 * read it through `authPageData()` in `@vonall/auth/ui`, so a changed load fails their check.
 */
export type AuthPageData = {
	authUi: AuthUiData;
	/** The social logins that have keys. */
	providers: { github: boolean; google: boolean };
	/** Whether the server can send mail (the password reset link shows only then). */
	mail: boolean;
	state: SignupState;
	einladung: { inviterName: string } | null;
	/** The Product has an admin list: the signup form shows even when `state` refuses, for a listed address. */
	adminList: boolean;
	user: SessionUser;
	/** The session without its token. */
	session: { id: string; expiresAt: Date };
	/** Whether the user may create Einladungen (the Invitations tab shows). */
	einladen: boolean;
};

const uiData = ({ appName, locale, signupMode }: AuthContext): AuthUiData => ({ appName, locale, signupMode });

/** `/auth`: which social logins have keys, and whether a password reset mail can be sent (the link is hidden otherwise). */
export async function authLayoutLoad({ locals }: Event) {
	const ctx = contextOf(locals);
	return { providers: ctx.providers, mail: ctx.mailer.enabled, authUi: uiData(ctx) } satisfies Pick<AuthPageData, "providers" | "mail" | "authUi">;
}

/** `/auth/login`. */
export async function loginLoad({ locals, url, request }: Event) {
	const { auth } = contextOf(locals);
	// An action refused the session as too old to be trusted (reauthPath): sign it out, so the form shows. Only a session
	// that really is that old, so a link can't log anyone out.
	if (locals.session && url.searchParams.get("error") === SESSION_NOT_FRESH.toLowerCase()) {
		const { freshAge } = (await auth.$context).sessionConfig;
		if (isStale(new Date(locals.session.createdAt), freshAge)) {
			await auth.api.signOut({ headers: request.headers });
			locals.session = null;
			locals.user = null;
		}
	}
	// An agent authorisation (signed query) may ask to log in again even with a session; then the form shows
	if (locals.session && !url.searchParams.has("sig")) {
		throw redirect(302, sameSitePath(url.searchParams.get("redirectTo"), url.origin) ?? "/home");
	}
	return {};
}

/** `/auth/signup`: the signup mode decides; the very first account (the admin, without an admin list) needs nothing. */
export async function signupLoad({ locals, cookies }: Event) {
	if (locals.session) throw redirect(302, "/home");
	const ctx = contextOf(locals);
	const { state, einladung } = await einladungService(ctx).signup(cookies.get(EINLADUNG_COOKIE));
	return { state, einladung: einladung ? { inviterName: einladung.inviterName } : null, adminList: ctx.adminEmails.length > 0 } satisfies Pick<
		AuthPageData,
		"state" | "einladung" | "adminList"
	>;
}

/**
 * `/einladung/[token]`: the link of an Einladung. A valid one is remembered in a cookie so it survives signup with
 * email, Google or GitHub (the signup hook takes it from there).
 */
export async function einladungLoad({ params, cookies, locals, url }: Event) {
	const ctx = contextOf(locals);
	const token = params.token;
	if (!token) throw error(404, { message: m().einladungUnbekannt, id: "unbekannt", timestamp: new Date().toISOString() });
	const pruefung = await einladungService(ctx).pruefen(token);
	const authUi = uiData(ctx);
	if (pruefung.isErr()) return { fehler: pruefung.error.message, einladung: null, eingeloggt: !!locals.user, authUi };

	const einladung = pruefung.value;
	cookies.set(EINLADUNG_COOKIE, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		// Secure only over HTTPS: WebKit drops Secure cookies on http://localhost (the e2e preview)
		secure: url.protocol === "https:",
		expires: einladung.expiresAt,
	});
	return { fehler: null, einladung: { inviterName: einladung.inviterName }, eingeloggt: !!locals.user, authUi };
}

/** `/home`: login required; the user, the session (never its token), the providers and whether the user may invite. */
export function homeLayoutLoad({ locals }: Event) {
	if (!locals.session || !locals.user) throw redirect(302, "/auth/login");
	const ctx = contextOf(locals);
	const user: SessionUser = { ...locals.user };
	// Never the session token itself: page data ends up in the HTML and in client JS
	const session = { id: locals.session.id, expiresAt: locals.session.expiresAt };
	// Whether the Invitations tab shows: the signup mode decides who creates Einladungen
	return { user, session, providers: ctx.providers, einladen: mayInvite(ctx.signupMode, isAdmin(locals.user)), authUi: uiData(ctx) } satisfies Pick<AuthPageData, "user" | "session" | "providers" | "einladen" | "authUi">;
}

/** `/home/manage_user` (the Admin option): admins only. */
export function manageUserLoad({ locals }: Event) {
	if (!locals.session || !locals.user) throw redirect(302, "/auth/login");
	if (!isAdmin(locals.user)) throw redirect(302, "/home");
	return { currentUserId: locals.user.id };
}
