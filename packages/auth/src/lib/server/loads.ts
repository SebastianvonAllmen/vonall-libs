/**
 * The `load` functions of the auth routes, for a Product's `+page.server.ts`/`+layout.server.ts` to re-export:
 * `export { loginLoad as load } from "@vonall/auth/server";`
 */
import { error, redirect, type ServerLoadEvent } from "@sveltejs/kit";
import { m } from "#lib/messages.js";
import { registry } from "#lib/server/registry.js";
import { EINLADUNG_COOKIE, EinladungService } from "#lib/server/service/einladung.service.js";
import { isStale, SESSION_NOT_FRESH } from "#lib/util/fresh.js";
import { sameSitePath } from "#lib/util/sameSite.js";
import { isAdmin, mayInvite } from "#lib/util/signup.js";

type Event = Pick<ServerLoadEvent, "locals" | "url" | "request" | "cookies" | "params">;

/** `/auth`: which social logins have keys, and whether a password reset mail can be sent (the link is hidden otherwise). */
export async function authLayoutLoad() {
	const { providers, mailer } = registry();
	return { providers, mail: mailer.enabled };
}

/** `/auth/login`. */
export async function loginLoad({ locals, url, request }: Event) {
	const { auth } = registry();
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

/** `/auth/signup`: the signup mode decides; the very first account (the admin) needs nothing. */
export async function signupLoad({ locals, cookies }: Event) {
	if (locals.session) throw redirect(302, "/home");
	const { state, einladung } = await EinladungService.signup(cookies.get(EINLADUNG_COOKIE));
	return { state, mode: registry().signupMode, einladung: einladung ? { inviterName: einladung.inviterName } : null };
}

/**
 * `/einladung/[token]`: the link of an Einladung. A valid one is remembered in a cookie so it survives signup with
 * email, Google or GitHub (the signup hook takes it from there).
 */
export async function einladungLoad({ params, cookies, locals, url }: Event) {
	const token = params.token;
	if (!token) throw error(404, { message: m().einladungUnbekannt, id: "unbekannt", timestamp: new Date().toISOString() });
	const pruefung = await EinladungService.pruefen(token);
	if (pruefung.isErr()) return { fehler: pruefung.error.message, einladung: null, eingeloggt: !!locals.user };

	const einladung = pruefung.value;
	cookies.set(EINLADUNG_COOKIE, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		// Secure only over HTTPS: WebKit drops Secure cookies on http://localhost (the e2e preview)
		secure: url.protocol === "https:",
		expires: einladung.expiresAt,
	});
	return { fehler: null, einladung: { inviterName: einladung.inviterName }, eingeloggt: !!locals.user };
}

/** `/home`: login required; the user, the session (never its token), the providers and whether the user may invite. */
export function homeLayoutLoad({ locals }: Event) {
	if (!locals.session || !locals.user) throw redirect(302, "/auth/login");
	const { providers, signupMode } = registry();
	const user = { ...locals.user };
	// Never the session token itself: page data ends up in the HTML and in client JS
	const session = { id: locals.session.id, expiresAt: locals.session.expiresAt };
	// Whether the Invitations tab shows: the signup mode decides who creates Einladungen
	return { user, session, providers, einladen: mayInvite(signupMode, isAdmin(locals.user)) };
}

/** `/home/manage_user` (the Admin option): admins only. */
export function manageUserLoad({ locals }: Event) {
	if (!locals.session || !locals.user) throw redirect(302, "/auth/login");
	if (!isAdmin(locals.user)) throw redirect(302, "/home");
	return { currentUserId: locals.user.id };
}
