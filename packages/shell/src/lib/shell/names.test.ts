import { describe, expect, it } from "vitest";
import { displayInitials, displayName } from "./names";

describe("names", () => {
	it("names a user by their name, else their email", () => {
		expect(displayName({ name: " Ada Lovelace ", email: "ada@example.org" })).toBe("Ada Lovelace");
		expect(displayName({ name: "", email: "ada@example.org" })).toBe("ada@example.org");
		expect(displayName(null)).toBe("");
	});

	it("takes the initials from the shown name, else the email's first letter", () => {
		expect(displayInitials({ name: "Ada Lovelace", email: "ada@example.org" })).toBe("AL");
		expect(displayInitials({ name: "Ada", email: "ada@example.org" }, "Ada King Lovelace")).toBe("AK");
		expect(displayInitials({ name: "", email: "ada@example.org" })).toBe("A");
		expect(displayInitials({ name: "", email: "ada@example.org" }, "ada@example.org")).toBe("A");
	});
});
