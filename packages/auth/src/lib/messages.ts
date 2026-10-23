/**
 * The package's strings, in English and German (Swiss spelling): what the server answers, what the mails say, and
 * (from the UI release on) what the pages show. A Product calls configureAuthMessages once, from a module its root
 * layout and its server wiring import, with its LOCALE and the few words it wants differently; code reads `m()`.
 */
export const en = {
	// Signup
	needsEinladung: "Signing up needs an invitation",
	noMail: "Accounts can't be created at the moment",
	onlyAdminsInvite: "Only admins can invite people",
	// Einladung
	einladungUnbekannt: "This invitation does not exist (any more)",
	einladungAbgelaufen: "This invitation has expired",
	einladungAngenommen: "This invitation has already been used",
	// Remote functions
	unauthorized: "Unauthorized",
	forbidden: "Forbidden",
	ownRole: "You can't change your own role",
	ownAccount: "Delete your own account under Settings",
	passwordsMismatch: "The passwords don't match",
	mailFailed: "The email could not be sent",
	// Validation
	invalidEmail: "Please enter a valid email address",
	passwordTooShort: (min: number) => `The password needs at least ${min} characters`,
	nameRequired: "Name is required",
	nameTooLong: (max: number) => `At most ${max} characters`,
	// Mails: subjects, plain-text bodies (the footer carries the app's name) and the HTML templates' strings
	hello: (name: string) => `Hello ${name || "there"},`,
	resetSubject: (app: string) => `Reset your password - ${app}`,
	resetText: (name: string, app: string, link: string) =>
		`${en.hello(name)}\n\nYou asked for a new password for ${app}. Set it here:\n\n${link}\n\nIf that wasn't you, just ignore this email.\n`,
	resetButton: "Reset your password",
	resetBody: (app: string) => `You asked for a new password for ${app}. The button below lets you set it:`,
	resetNotYou: "If that wasn't you, just ignore this email; your password stays as it is.",
	verifySubject: (app: string) => `Confirm your email address - ${app}`,
	verifyText: (name: string, app: string, link: string) =>
		`${en.hello(name)}\n\nYou created an account at ${app}. Confirm that this address is yours:\n\n${link}\n\nIf that wasn't you, just ignore this email.\n`,
	verifyButton: "Confirm your email address",
	verifyBody: (app: string) => `You created an account at ${app}. Confirm that this address is yours to start using it:`,
	verifyNotYou: "If that wasn't you, just ignore this email; without the confirmation the account can't be used.",
	einladungSubject: (inviter: string, app: string) => `${inviter || "Someone"} invites you to ${app}`,
	einladungText: (inviter: string, app: string, link: string, validUntil: string) =>
		`Hello,\n\n${inviter || "Someone"} invites you to ${app}.\n\nAccept the invitation: ${link}\n\nThe link works once and is valid until ${validUntil}.\n`,
	einladungTitle: (app: string) => `Invitation to ${app}`,
	einladungButton: "Accept the invitation",
	einladungHello: "Hello,",
	einladungBody: (inviter: string, app: string) => `${inviter || "Someone"} invites you to ${app}.`,
	einladungValid: (validUntil: string) => `The link works once and is valid until ${validUntil}.`,
};

export type AuthMessages = typeof en;

export const de: AuthMessages = {
	needsEinladung: "Zum Registrieren braucht es eine Einladung",
	noMail: "Im Moment können keine Konten erstellt werden",
	onlyAdminsInvite: "Nur die Verwaltung kann Leute einladen",
	einladungUnbekannt: "Diese Einladung gibt es nicht (mehr)",
	einladungAbgelaufen: "Diese Einladung ist abgelaufen",
	einladungAngenommen: "Diese Einladung wurde schon verwendet",
	unauthorized: "Nicht angemeldet",
	forbidden: "Nicht erlaubt",
	ownRole: "Die eigene Rolle lässt sich nicht ändern",
	ownAccount: "Das eigene Konto löschst du in den Einstellungen",
	passwordsMismatch: "Die Passwörter stimmen nicht überein",
	mailFailed: "Die E-Mail konnte nicht verschickt werden",
	invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein",
	passwordTooShort: (min) => `Das Passwort braucht mindestens ${min} Zeichen`,
	nameRequired: "Der Name fehlt",
	nameTooLong: (max) => `Höchstens ${max} Zeichen`,
	hello: (name) => (name ? `Hallo ${name}` : "Hallo"),
	resetSubject: (app) => `Passwort zurücksetzen – ${app}`,
	resetText: (name, app, link) =>
		`${de.hello(name)}\n\nDu hast ein neues Passwort für ${app} angefordert. Hier legst du es fest:\n\n${link}\n\nWarst du das nicht, ignoriere diese E-Mail einfach.\n`,
	resetButton: "Passwort zurücksetzen",
	resetBody: (app) => `Du hast ein neues Passwort für ${app} angefordert. Mit dem Knopf unten legst du es fest:`,
	resetNotYou: "Warst du das nicht, ignoriere diese E-Mail einfach; dein Passwort bleibt, wie es ist.",
	verifySubject: (app) => `E-Mail-Adresse bestätigen – ${app}`,
	verifyText: (name, app, link) =>
		`${de.hello(name)}\n\nDu hast ein Konto bei ${app} erstellt. Bestätige, dass diese Adresse dir gehört:\n\n${link}\n\nWarst du das nicht, ignoriere diese E-Mail einfach.\n`,
	verifyButton: "E-Mail-Adresse bestätigen",
	verifyBody: (app) => `Du hast ein Konto bei ${app} erstellt. Bestätige, dass diese Adresse dir gehört, um loszulegen:`,
	verifyNotYou: "Warst du das nicht, ignoriere diese E-Mail einfach; ohne Bestätigung lässt sich das Konto nicht nutzen.",
	einladungSubject: (inviter, app) => `${inviter || "Jemand"} lädt dich zu ${app} ein`,
	einladungText: (inviter, app, link, validUntil) =>
		`Hallo\n\n${inviter || "Jemand"} lädt dich zu ${app} ein.\n\nEinladung annehmen: ${link}\n\nDer Link funktioniert einmal und ist bis ${validUntil} gültig.\n`,
	einladungTitle: (app) => `Einladung zu ${app}`,
	einladungButton: "Einladung annehmen",
	einladungHello: "Hallo",
	einladungBody: (inviter, app) => `${inviter || "Jemand"} lädt dich zu ${app} ein.`,
	einladungValid: (validUntil) => `Der Link funktioniert einmal und ist bis ${validUntil} gültig.`,
};

export type Locale = "en" | "de";

let current: AuthMessages = en;

export function configureAuthMessages({ locale, overrides }: { locale: Locale; overrides?: Partial<AuthMessages> }) {
	current = { ...(locale === "de" ? de : en), ...overrides };
}

/** The configured messages. */
export const m = (): AuthMessages => current;
