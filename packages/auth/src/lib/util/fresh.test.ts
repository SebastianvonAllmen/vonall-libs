import { describe, expect, it } from "vitest";
import { isSessionNotFresh, isStale, reauthPath } from "./fresh";

const DAY = 60 * 60 * 24;

describe("isSessionNotFresh", () => {
	it("recognises the error on the server (APIError body) and on the client (error object)", () => {
		expect(isSessionNotFresh({ status: "FORBIDDEN", body: { code: "SESSION_NOT_FRESH", message: "Session is not fresh" } })).toBe(true);
		expect(isSessionNotFresh({ code: "SESSION_NOT_FRESH", status: 403 })).toBe(true);
	});

	it("ignores every other error", () => {
		for (const e of [null, undefined, "SESSION_NOT_FRESH", new Error("Session is not fresh"), { body: { code: "UNAUTHORIZED" } }, { body: null }]) {
			expect(isSessionNotFresh(e)).toBe(false);
		}
	});
});

describe("reauthPath", () => {
	it("goes to the login with the reason and the way back", () => {
		expect(reauthPath("/home/settings")).toBe("/auth/login?error=session_not_fresh&redirectTo=%2Fhome%2Fsettings");
	});
});

describe("isStale", () => {
	const now = new Date("2026-10-19T12:00:00Z");

	it("is stale from freshAge on", () => {
		expect(isStale(new Date("2026-10-18T12:00:01Z"), DAY, now)).toBe(false);
		expect(isStale(new Date("2026-10-18T12:00:00Z"), DAY, now)).toBe(true);
	});

	it("is never stale with freshAge 0", () => {
		expect(isStale(new Date("2020-01-01T00:00:00Z"), 0, now)).toBe(false);
	});
});
