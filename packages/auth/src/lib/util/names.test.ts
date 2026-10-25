import { describe, expect, it } from "vitest";
import { displayInitials, displayName, nameFromEmail } from "./names";

describe("names", () => {
	it("shows the name, else the email", () => {
		expect(displayName({ name: " Lena ", email: "l@example.org" })).toBe("Lena");
		expect(displayName({ name: "", email: "l@example.org" })).toBe("l@example.org");
		expect(displayName(null)).toBe("");
	});

	it("takes two initials, else the email's first letter", () => {
		expect(displayInitials({ name: "Lena Meier Huber", email: "l@example.org" })).toBe("LM");
		expect(displayInitials({ name: null, email: "l@example.org" })).toBe("L");
	});

	it("takes the initials of the name shown, else the email's first letter", () => {
		const lena = { name: "Lena", email: "lena@example.org" };
		expect(displayInitials(lena, "Lena Muster")).toBe("LM");
		expect(displayInitials({ name: "", email: "lena@example.org" }, " ")).toBe("L");
		// The default displayName falls back to the email: still its first letter, as without a name
		expect(displayInitials({ name: "", email: "lena@example.org" }, displayName({ name: "", email: "lena@example.org" }))).toBe("L");
		expect(displayInitials(lena, displayName(lena))).toBe("L");
	});

	it("makes a readable name from an email address", () => {
		expect(nameFromEmail("lena.meier@example.org")).toBe("Lena Meier");
		expect(nameFromEmail("tim_huber-jr+x@example.org")).toBe("Tim Huber Jr X");
		expect(nameFromEmail("@example.org")).toBe("@example.org");
	});
});
