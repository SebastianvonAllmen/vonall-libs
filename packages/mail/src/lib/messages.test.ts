import { describe, expect, it } from "vitest";
import { configureMailMessages, de, en, m } from "./messages";

describe("messages", () => {
	it("has every key in both languages", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
	});

	it("takes the locale and overrides", () => {
		configureMailMessages({ locale: "de", overrides: { orUseLink: "Link:" } });
		expect(m().orUseLink).toBe("Link:");
		expect(m().open("Blueprint")).toBe("Blueprint öffnen");
		configureMailMessages({ locale: "en" });
		expect(m()).toEqual(en);
	});
});
