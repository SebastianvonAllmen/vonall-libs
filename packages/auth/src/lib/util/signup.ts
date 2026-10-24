import type { SignupMode, SignupState } from "#lib/types.js";

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

/**
 * Whether someone may create an account now. The first account (the admin) always may; after that `open` needs mail
 * (the confirmation link), `invite` and `admin` a usable Einladung.
 */
export function signupState(input: { mode: SignupMode; accounts: number; einladungUsable: boolean; mail: boolean }): SignupState {
	if (input.accounts === 0) return "allowed";
	if (input.mode === "open") return input.mail ? "allowed" : "no_mail";
	return input.einladungUsable ? "allowed" : "needs_einladung";
}
