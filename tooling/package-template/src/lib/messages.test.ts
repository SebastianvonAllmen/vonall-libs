import { describe, expect, it } from "vitest";
import { configure__PASCAL__Messages, de, en, m } from "./messages";

describe("messages", () => {
	it("has every key in both languages", () => {
		expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
	});

	it("takes the locale and overrides", () => {
		configure__PASCAL__Messages({ locale: "de", overrides: { example: "Muster" } });
		expect(m().example).toBe("Muster");
		configure__PASCAL__Messages({ locale: "en" });
		expect(m()).toEqual(en);
	});
});
