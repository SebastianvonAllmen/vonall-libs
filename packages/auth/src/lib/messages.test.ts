import { describe, expect, it } from "vitest";
import { configureAuthMessages, de, en, m } from "./messages";

describe("messages", () => {
	it("has every key in both languages", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
	});

	it("writes Swiss German (ss, never ß)", () => {
		const text = JSON.stringify(Object.values(de).map((v) => (typeof v === "function" ? (v as (...a: string[]) => string)("a", "b", "c", "d") : v)));
		expect(text).not.toContain("ß");
	});

	it("takes the locale and overrides, and fills the fallback names", () => {
		configureAuthMessages({ locale: "de", overrides: { forbidden: "Nein" } });
		expect(m().forbidden).toBe("Nein");
		expect(m().einladungSubject("", "Blueprint")).toBe("Jemand lädt dich zu Blueprint ein");
		expect(m().hello("")).toBe("Hallo");
		configureAuthMessages({ locale: "en" });
		expect(m().hello("")).toBe("Hello there,");
		expect(m().resetText("Lena", "Blueprint", "https://x")).toContain("Hello Lena,");
	});
});
