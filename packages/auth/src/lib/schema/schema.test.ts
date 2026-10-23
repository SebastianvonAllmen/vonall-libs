import { getTableColumns, getTableName } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { authSchema } from "./index";

describe("authSchema", () => {
	it("builds the shared tables with their names", () => {
		const s = authSchema();
		expect(Object.keys(s).sort()).toEqual(["account", "einladung", "rateLimit", "session", "twoFactor", "user", "verification"]);
		expect(getTableName(s.rateLimit)).toBe("rate_limit");
		expect(getTableName(s.twoFactor)).toBe("twoFactor");
	});

	it("adds the admin columns only with the option", () => {
		expect(Object.keys(getTableColumns(authSchema().user))).not.toContain("role");
		expect(Object.keys(getTableColumns(authSchema().session))).not.toContain("impersonatedBy");
		const withAdmin = authSchema({ admin: true });
		expect(Object.keys(getTableColumns(withAdmin.user))).toEqual(expect.arrayContaining(["role", "banned", "banReason", "banExpires"]));
		expect(Object.keys(getTableColumns(withAdmin.session))).toContain("impersonatedBy");
	});

	it("adds the OAuth provider's tables only with the mcp option", () => {
		expect("jwks" in authSchema()).toBe(false);
		const withMcp = authSchema({ mcp: true });
		expect(Object.keys(withMcp)).toEqual(
			expect.arrayContaining(["jwks", "oauthClient", "oauthResource", "oauthClientResource", "oauthRefreshToken", "oauthAccessToken", "oauthConsent", "oauthClientAssertion"]),
		);
		expect(getTableName(withMcp.oauthClient)).toBe("oauth_client");
	});

	it("takes a Product's own columns on user", () => {
		const s = authSchema({ admin: true, user: { phone: text("phone") } });
		expect(Object.keys(getTableColumns(s.user))).toEqual(expect.arrayContaining(["id", "role", "phone"]));
		expect(s.user.phone.name).toBe("phone");
	});
});
