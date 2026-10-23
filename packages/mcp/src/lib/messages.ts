/**
 * The package's strings, in English and German (Swiss spelling): the consent page, the Agents tab and what the server
 * answers a person (what it answers an assistant stays English). A Product calls configureMcpMessages once, from a
 * module its root layout and its server wiring import; code reads `m()`.
 */
import { defineMessages } from "@vonall/messages";

export const en = {
	// The protocol, to the assistant's user
	invalidInput: "Invalid input",
	// The consent page
	consentTitle: "Connect an assistant",
	consentInvalid: "The request is invalid or has expired. Start the connection again in the assistant.",
	anAssistant: "An AI assistant",
	connectQuestion: (client: string) => `Connect ${client}?`,
	backTo: "Afterwards you go back to",
	consentIntro: (app: string) => `The assistant then works with your ${app} data, under the same rules as you in the app:`,
	consentNote: "What the assistant reads goes to its provider. You can take its access away at any time under Settings → AI assistants.",
	allow: "Allow",
	deny: "Deny",
	didntWork: "That didn't work.",
	// The Agents tab
	tabAgents: "AI assistants",
	tabAgentsHint: "Assistants connected through MCP",
	deletionNote: "Connected AI assistants lose their access.",
	agentsTitle: "AI assistants",
	agentsIntro: "Assistants you connected through MCP work with your data under the same rules as you in the app.",
	unnamedAssistant: "Unnamed assistant",
	connectedSince: "connected since",
	revoke: "Revoke",
	revokeConfirm: (name: string, app: string) => `Take ${name}'s access to ${app} away?`,
	revoked: (name: string) => `${name} no longer has access`,
	revokeFailed: "The access could not be revoked.",
	noAssistant: "No assistant connected yet.",
	howToConnect: "To connect one, give it this address and allow it when it brings you back here:",
	copyAddress: "Copy the address",
	copied: "Copied",
	copyFailed: "Copying failed; select the text and copy it by hand.",
	localNote: "Running locally: claude.ai, ChatGPT and Le Chat need the public HTTPS address. Claude Code, Gemini CLI and editors work locally too.",
	claudeTitle: "Claude (claude.ai, desktop, app)",
	claudeSteps: "Settings → Connectors → add a custom connector, paste the address, connect and allow it here.",
	claudeCodeTitle: "Claude Code",
	claudeCodeThen: "Then run /mcp in Claude Code and log in here.",
	chatgptTitle: "ChatGPT",
	chatgptSteps: 'Settings → Apps and connectors → turn on developer mode under "Advanced", then create a connector with the address (authentication: OAuth) and allow it here.',
	othersTitle: "Mistral Le Chat, Gemini CLI, VS Code, Cursor and others",
	othersSteps: 'Add it as a "Streamable HTTP" MCP server with OAuth, for example in VS Code\'s .vscode/mcp.json:',
	agentsNote: "What an assistant reads goes to its provider. You can take its access away here at any time.",
};

export type McpMessages = typeof en;

export const de: McpMessages = {
	invalidInput: "Ungültige Eingabe",
	consentTitle: "Assistenten verbinden",
	consentInvalid: "Die Anfrage ist ungültig oder abgelaufen. Starte die Verbindung im Assistenten neu.",
	anAssistant: "Ein KI-Assistent",
	connectQuestion: (client) => `${client} verbinden?`,
	backTo: "Danach geht es zurück zu",
	consentIntro: (app) => `Der Assistent arbeitet dann mit deinen Daten in ${app}, nach denselben Regeln wie du in der App:`,
	consentNote: "Was der Assistent liest, geht an seinen Anbieter. Du kannst ihm den Zugriff jederzeit unter Einstellungen → KI-Assistenten entziehen.",
	allow: "Erlauben",
	deny: "Ablehnen",
	didntWork: "Das hat nicht geklappt.",
	tabAgents: "KI-Assistenten",
	tabAgentsHint: "Über MCP verbundene Assistenten",
	deletionNote: "Verbundene KI-Assistenten verlieren ihren Zugriff.",
	agentsTitle: "KI-Assistenten",
	agentsIntro: "Assistenten, die du über MCP verbunden hast, arbeiten mit deinen Daten nach denselben Regeln wie du in der App.",
	unnamedAssistant: "Assistent ohne Namen",
	connectedSince: "verbunden seit",
	revoke: "Entziehen",
	revokeConfirm: (name, app) => `${name} den Zugriff auf ${app} entziehen?`,
	revoked: (name) => `${name} hat keinen Zugriff mehr`,
	revokeFailed: "Der Zugriff konnte nicht entzogen werden.",
	noAssistant: "Noch kein Assistent verbunden.",
	howToConnect: "Gib einem Assistenten diese Adresse und erlaube ihn, wenn er dich hierher zurückbringt:",
	copyAddress: "Adresse kopieren",
	copied: "Kopiert",
	copyFailed: "Kopieren hat nicht geklappt; markiere den Text und kopiere ihn von Hand.",
	localNote: "Lokal: claude.ai, ChatGPT und Le Chat brauchen die öffentliche HTTPS-Adresse. Claude Code, Gemini CLI und Editoren funktionieren auch lokal.",
	claudeTitle: "Claude (claude.ai, Desktop, App)",
	claudeSteps: "Einstellungen → Konnektoren → eigenen Konnektor hinzufügen, die Adresse einfügen, verbinden und hier erlauben.",
	claudeCodeTitle: "Claude Code",
	claudeCodeThen: "Dann in Claude Code /mcp ausführen und dich hier anmelden.",
	chatgptTitle: "ChatGPT",
	chatgptSteps: "Einstellungen → Apps und Konnektoren → unter «Erweitert» den Entwicklermodus einschalten, dann einen Konnektor mit der Adresse anlegen (Authentisierung: OAuth) und hier erlauben.",
	othersTitle: "Mistral Le Chat, Gemini CLI, VS Code, Cursor und andere",
	othersSteps: "Als «Streamable HTTP»-MCP-Server mit OAuth hinzufügen, zum Beispiel in VS Code in .vscode/mcp.json:",
	agentsNote: "Was ein Assistent liest, geht an seinen Anbieter. Du kannst ihm den Zugriff hier jederzeit entziehen.",
};

export const { m, configure: configureMcpMessages } = defineMessages({ en, de });
