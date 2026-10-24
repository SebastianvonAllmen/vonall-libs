import { describe, expect, it } from "vitest";
import { configureShellMessages, de, en, m } from "./messages";

describe("messages", () => {
	it("has every key in both languages, in Swiss German", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
		expect(JSON.stringify(de)).not.toContain("ß");
	});

	it("takes the locale and overrides", () => {
		configureShellMessages({ locale: "de", overrides: { logOut: "Tschüss" } });
		expect(m().logOut).toBe("Tschüss");
		expect(m().settings).toBe("Einstellungen");
		configureShellMessages({ locale: "en" });
		expect(m()).toEqual(en);
	});
});
