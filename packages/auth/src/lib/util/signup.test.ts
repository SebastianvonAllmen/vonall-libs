import { describe, expect, it } from "vitest";
import { isAdmin, mayInvite, signupState } from "./signup";

describe("signupState", () => {
	const base = { accounts: 3, einladungUsable: false, mail: true };
	it("lets the first account in, in every mode", () => {
		for (const mode of ["invite", "open", "admin"] as const) {
			expect(signupState({ ...base, mode, accounts: 0, mail: false })).toBe("allowed");
		}
	});
	it("invite and admin need a usable Einladung", () => {
		expect(signupState({ ...base, mode: "invite" })).toBe("needs_einladung");
		expect(signupState({ ...base, mode: "admin" })).toBe("needs_einladung");
		expect(signupState({ ...base, mode: "invite", einladungUsable: true })).toBe("allowed");
	});
	it("open needs mail, not an Einladung", () => {
		expect(signupState({ ...base, mode: "open" })).toBe("allowed");
		expect(signupState({ ...base, mode: "open", mail: false })).toBe("no_mail");
	});
});

describe("mayInvite and isAdmin", () => {
	it("follows the mode", () => {
		expect(mayInvite("invite", false)).toBe(true);
		expect(mayInvite("admin", false)).toBe(false);
		expect(mayInvite("admin", true)).toBe(true);
		expect(mayInvite("open", true)).toBe(false);
	});
	it("reads the role when there is one", () => {
		expect(isAdmin({ role: "admin" })).toBe(true);
		expect(isAdmin({ role: "user" })).toBe(false);
		expect(isAdmin({ name: "no role column" })).toBe(false);
		expect(isAdmin(null)).toBe(false);
	});
});
