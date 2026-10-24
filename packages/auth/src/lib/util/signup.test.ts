import { describe, expect, it } from "vitest";
import { adminList, isAdmin, isListed, mayInvite, signupState } from "./signup";

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

describe("the admin list", () => {
	const base = { mode: "invite" as const, accounts: 3, einladungUsable: false, mail: true, adminList: true };
	it("reads ADMIN_EMAILS in lower case, without empty entries", () => {
		expect(adminList(" Boss@Example.com, ,second@example.com ")).toEqual(["boss@example.com", "second@example.com"]);
		expect(adminList(undefined)).toEqual([]);
		expect(isListed(["boss@example.com"], " BOSS@example.com ")).toBe(true);
		expect(isListed(["boss@example.com"], null)).toBe(false);
	});
	it("lets a listed address in without an Einladung: confirmed at once, with a password while mail works", () => {
		expect(signupState({ ...base, listed: true, confirmed: true, mail: false })).toBe("allowed");
		expect(signupState({ ...base, listed: true })).toBe("allowed");
		expect(signupState({ ...base, listed: true, mail: false })).toBe("no_mail");
	});
	it("without mail, a listed address may be the first account", () => {
		expect(signupState({ ...base, listed: true, mail: false, accounts: 0 })).toBe("allowed");
		expect(signupState({ ...base, listed: false, mail: false, accounts: 0 })).toBe("needs_einladung");
	});
	it("means nobody is first, and everyone else follows the mode", () => {
		expect(signupState({ ...base, accounts: 0 })).toBe("needs_einladung");
		expect(signupState({ ...base, accounts: 0, adminList: false })).toBe("allowed");
		expect(signupState({ ...base, einladungUsable: true })).toBe("allowed");
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
