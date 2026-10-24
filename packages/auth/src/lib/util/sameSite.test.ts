import { describe, expect, it } from "vitest";
import { sameSitePath } from "./sameSite";

const ORIGIN = "https://app.example.ch";

describe("sameSitePath", () => {
	it("keeps paths on the site", () => {
		expect(sameSitePath("/einladung/abc?x=1", ORIGIN)).toBe("/einladung/abc?x=1");
	});

	it("rejects everything that leaves the site", () => {
		for (const ziel of ["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com", "evil.com", null]) {
			expect(sameSitePath(ziel, ORIGIN)).toBeNull();
		}
	});
});
