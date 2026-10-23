/**
 * better-auth refuses some endpoints (listing the sessions, unlinking an account) for a session created longer than
 * `freshAge` ago; the app then sends the user to log in again, which needs that stale session signed out first.
 */
export const SESSION_NOT_FRESH = "SESSION_NOT_FRESH";

/** Whether an error from better-auth (server or client) is its "Session is not fresh". */
export function isSessionNotFresh(e: unknown): boolean {
	if (!e || typeof e !== "object") return false;
	const body = "body" in e ? e.body : e;
	return !!body && typeof body === "object" && "code" in body && body.code === SESSION_NOT_FRESH;
}

/** The login page that signs out a stale session and then returns to `redirectTo`. */
export function reauthPath(redirectTo: string): string {
	return `/auth/login?error=${SESSION_NOT_FRESH.toLowerCase()}&redirectTo=${encodeURIComponent(redirectTo)}`;
}

/** better-auth's own check: a `freshAge` of 0 turns it off. */
export function isStale(createdAt: Date, freshAgeSeconds: number, now = new Date()): boolean {
	return freshAgeSeconds !== 0 && now.getTime() - createdAt.getTime() >= freshAgeSeconds * 1000;
}
