/**
 * The shell's strings, in English and German (Swiss spelling). A Product calls configureShellMessages once, from the
 * module its root layout imports; the components read `m()`.
 */
export const en = {
	administration: "Administration",
	administrator: "Administrator",
	settings: "Settings",
	lightOrDark: "Light or dark",
	logOut: "Log out",
	mainNavigation: "Main navigation",
	openSettings: "Open settings",
	switchTheme: "Switch between light and dark",
};

export type ShellMessages = typeof en;

export const de: ShellMessages = {
	administration: "Verwaltung",
	administrator: "Administration",
	settings: "Einstellungen",
	lightOrDark: "Hell oder dunkel",
	logOut: "Abmelden",
	mainNavigation: "Hauptnavigation",
	openSettings: "Einstellungen öffnen",
	switchTheme: "Zwischen hell und dunkel wechseln",
};

export type Locale = "en" | "de";

let current: ShellMessages = en;

export function configureShellMessages({ locale, overrides }: { locale: Locale; overrides?: Partial<ShellMessages> }) {
	current = { ...(locale === "de" ? de : en), ...overrides };
}

/** The configured messages. */
export const m = (): ShellMessages => current;
