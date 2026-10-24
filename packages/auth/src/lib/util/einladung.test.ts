import { describe, expect, it } from "vitest";
import { einladungExtras } from "./einladung";

describe("einladungExtras", () => {
	it("keeps only a Product's own columns", () => {
		const row = { id: "1", tokenHash: "h", createdBy: "u", email: null, expiresAt: new Date(), acceptedAt: null, acceptedBy: null, createdAt: new Date(), inviterName: "Lena", rolle: "trainer", goalieId: null };
		expect(einladungExtras(row)).toEqual({ rolle: "trainer", goalieId: null });
		expect(einladungExtras({ id: "1" })).toEqual({});
	});
});
