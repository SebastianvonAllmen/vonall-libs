import type { SignupMode, SignupState } from "#lib/types.js";

/** How long an Einladung's link works. */
export const EINLADUNG_GUELTIG_TAGE = 14;

/** Whether a user is an admin. Works without the admin option too: the user then has no role and nobody is. */
export function isAdmin(user: object | null | undefined): boolean {
	return Boolean(user && "role" in user && user.role === "admin");
}

/** Whether a user may create Einladungen in this signup mode. */
export function mayInvite(mode: SignupMode, admin: boolean): boolean {
	if (mode === "invite") return true;
	if (mode === "admin") return admin;
	return false; // open: nobody needs one
}

/** The addresses of a Product's ADMIN_EMAILS (comma-separated): trimmed, lower case, empty entries dropped. */
export function adminList(raw: string | undefined | null): string[] {
	return (raw ?? "")
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

/** Whether an address is on the admin list. */
export function isListed(list: string[], email: string | null | undefined): boolean {
	return Boolean(email) && list.includes(email!.trim().toLowerCase());
}

/**
 * Whether someone may create an account now.
 * - An address on the admin list (`listed`) always may: `confirmed` by its provider (Google, GitHub) it is the admin at
 *   once; with a password it needs mail for the confirmation link, and is the admin once the link is opened.
 * - Without an admin list the first account (the admin) always may; with one, nobody is first.
 * - After that `open` needs mail (the confirmation link), `invite` and `admin` a usable Einladung.
 */
export function signupState(input: {
	mode: SignupMode;
	accounts: number;
	einladungUsable: boolean;
	mail: boolean;
	/** The address signing up is on the admin list (unknown on the page itself: false). */
	listed?: boolean;
	/** Its provider confirmed the address (a social login). */
	confirmed?: boolean;
	/** The Product has an admin list. */
	adminList?: boolean;
}): SignupState {
	if (input.listed) return input.confirmed || input.mail ? "allowed" : "no_mail";
	if (input.accounts === 0 && !input.adminList) return "allowed";
	if (input.mode === "open") return input.mail ? "allowed" : "no_mail";
	return input.einladungUsable ? "allowed" : "needs_einladung";
}
