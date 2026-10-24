import { afterEach, describe, expect, it } from "vitest";
import { defineMessages, languageOf } from "./index";

const en = { hello: "Hello", count: (n: number) => `${n} things` };
const de = { hello: "Hallo", count: (n: number) => `${n} Dinge` };

describe("defineMessages", () => {
	const env = process.env.NODE_ENV;
	afterEach(() => {
		process.env.NODE_ENV = env;
	});

	it("picks the language from a locale and takes overrides", () => {
		const { m, configure } = defineMessages({ en, de });
		configure({ locale: "de-CH", overrides: { hello: "Grüezi" } });
		expect(m().hello).toBe("Grüezi");
		expect(m().count(2)).toBe("2 Dinge");
		configure({ locale: "en-GB" });
		expect(m()).toEqual(en);
	});

	it("answers in English when nothing configured it, except in development, where it throws", () => {
		const { m } = defineMessages({ en, de });
		expect(m().hello).toBe("Hello");
		process.env.NODE_ENV = "development";
		expect(() => m()).toThrow(/configure/);
	});

	it("maps any locale to one of the two languages", () => {
		expect(languageOf("de-CH")).toBe("de");
		expect(languageOf("de")).toBe("de");
		expect(languageOf("fr-CH")).toBe("en");
		expect(languageOf("en-GB")).toBe("en");
	});
});
