import { describe, expect, it } from "vitest";
import { configureMcpMessages, de, en, m } from "./messages";

describe("messages", () => {
	it("has every key in both languages", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
	});

	it("writes Swiss German (ss, never ß)", () => {
		const text = JSON.stringify(Object.values(de).map((v) => (typeof v === "function" ? (v as (...a: string[]) => string)("a", "b") : v)));
		expect(text).not.toContain("ß");
	});

	it("takes the locale and overrides", () => {
		configureMcpMessages({ locale: "de", overrides: { allow: "Ja" } });
		expect(m().allow).toBe("Ja");
		expect(m().connectQuestion("Claude")).toBe("Claude verbinden?");
		configureMcpMessages({ locale: "en" });
		expect(m()).toEqual(en);
	});
});
