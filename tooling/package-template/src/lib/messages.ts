/**
 * The package's UI strings, in English and German (Swiss spelling). A Product calls configure__PASCAL__Messages once,
 * from a module its root layout and its server wiring import, with its LOCALE and the few words it wants differently;
 * components and server code read `m()`. A new string in a release needs no Product change.
 */
export const en = {
	example: "Example",
};

export type __PASCAL__Messages = typeof en;

export const de: __PASCAL__Messages = {
	example: "Beispiel",
};

export type Locale = "en" | "de";

let current: __PASCAL__Messages = en;

export function configure__PASCAL__Messages({ locale, overrides }: { locale: Locale; overrides?: Partial<__PASCAL__Messages> }) {
	current = { ...(locale === "de" ? de : en), ...overrides };
}

/** The configured messages. */
export const m = (): __PASCAL__Messages => current;
