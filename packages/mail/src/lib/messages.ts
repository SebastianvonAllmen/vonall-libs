/**
 * The package's UI strings, in English and German (Swiss spelling). A Product calls configureMailMessages once, from a
 * module its root layout and its server wiring import, with its LOCALE and the few words it wants differently; the
 * templates read `m()`. A new string in a release needs no Product change.
 */
export const en = {
	/** Below the button of a mail, before the bare link. */
	orUseLink: "Or use this link:",
	/** The footer link back into the app. */
	open: (appName: string) => `Open ${appName}`,
	/** The error a caller may show when sending failed. */
	sendFailed: "The email could not be sent",
};

export type MailMessages = typeof en;

export const de: MailMessages = {
	orUseLink: "Oder öffne diesen Link:",
	open: (appName) => `${appName} öffnen`,
	sendFailed: "Die E-Mail konnte nicht verschickt werden",
};

export type Locale = "en" | "de";

let current: MailMessages = en;

export function configureMailMessages({ locale, overrides }: { locale: Locale; overrides?: Partial<MailMessages> }) {
	current = { ...(locale === "de" ? de : en), ...overrides };
}

/** The configured messages. */
export const m = (): MailMessages => current;
