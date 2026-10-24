/**
 * The strings of a Library in English and German (Swiss spelling), configured once by the Product with its locale:
 * `const { m, configure } = defineMessages({ en, de })`. Every package exposes its `configure…Messages` and reads
 * `m()`; a key missing in one language is a type error, and reading before configuring throws in development (an
 * app that forgot its `messages.ts` would otherwise run in English without a sign).
 */
export type Language = "en" | "de";

/** A BCP-47 tag ("de-CH", "en-GB") or a bare language; anything but German means English. */
export function languageOf(locale: string): Language {
	return locale.toLowerCase().split(/[-_]/)[0] === "de" ? "de" : "en";
}

export type Configure<T> = (options: { locale: string; overrides?: Partial<T> }) => void;

export function defineMessages<T extends Record<string, unknown>>(languages: { en: T; de: T }): { m: () => T; configure: Configure<T> } {
	let current: T | null = null;
	return {
		m: () => {
			if (current) return current;
			if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
				throw new Error("@vonall messages read before being configured: the app's messages module (configure…Messages({ locale })) has not run");
			}
			return languages.en;
		},
		configure: ({ locale, overrides }) => {
			current = { ...languages[languageOf(locale)], ...overrides };
		},
	};
}
