import { createTransport } from "nodemailer";
import { m } from "#lib/messages.js";

/** One mail to send. `html` is optional (a plain-text mail); `replyTo` lets the recipient answer someone else. */
export type Mail = {
	to: string | string[];
	cc?: string | string[];
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
};

/** Any SMTP server: the host, the login and the password (the sender's address defaults to the login). */
export type SmtpOptions = {
	host: string;
	/** 587 (STARTTLS, the default) or 465 (TLS). */
	port?: number;
	user: string;
	password: string;
};

/** What the mailer sends through; nodemailer's transporter satisfies it, and a test passes its own. */
export type Transport = {
	sendMail(mail: Mail & { from: string }): Promise<{ messageId?: string }>;
};

/** Where the mailer reports; a Product passes its logger, the default is the console. */
export type MailLog = {
	debug(message: string): void;
	error(message: string, context: Record<string, unknown>, error: unknown): void;
};

export type MailerOptions = {
	/** The SMTP settings from the Product's env; any of them empty means mail is off. */
	smtp?: Partial<SmtpOptions> | null;
	/** The sender shown in the mails, e.g. `Blueprint <noreply@example.org>`; defaults to the SMTP login. */
	from?: string;
	/** A ready transport instead of SMTP (tests, another provider's SDK). */
	transport?: Transport;
	log?: MailLog;
};

export type Mailer = {
	/** Whether mails can be sent: without it Einladungen are shared as links, the password reset and the contact form are off. */
	readonly enabled: boolean;
	/** Sends the mail; throws when it can't (or when mail is off), so the caller can tell the user. */
	send(mail: Mail): Promise<void>;
};

const consoleLog: MailLog = {
	debug: () => {},
	error: (message, context, error) => console.error(message, context, error),
};

function smtpComplete(smtp: Partial<SmtpOptions> | null | undefined): smtp is SmtpOptions {
	return Boolean(smtp?.host && smtp.user && smtp.password);
}

/** The Product's one mailer, created in its server wiring from the SMTP env variables and passed to whatever sends mail. */
export function createMailer({ smtp, from, transport, log = consoleLog }: MailerOptions): Mailer {
	const enabled = Boolean(transport) || smtpComplete(smtp);
	let cached: Transport | null = transport ?? null;
	const sender = from || smtp?.user || "";

	function getTransport(): Transport {
		if (cached) return cached;
		if (!smtpComplete(smtp)) throw new Error("Mail is not set up (SMTP host, user and password)");
		const port = smtp.port || 587;
		cached = createTransport({
			host: smtp.host,
			port,
			secure: port === 465,
			requireTLS: port !== 465,
			auth: { user: smtp.user, pass: smtp.password },
		});
		return cached;
	}

	return {
		enabled,
		async send(mail) {
			try {
				const info = await getTransport().sendMail({ ...mail, from: sender });
				log.debug(`Email sent: ${info.messageId ?? "(no id)"}`);
			} catch (error) {
				log.error("Error sending email", { subject: mail.subject }, error);
				throw new Error(m().sendFailed, { cause: error });
			}
		},
	};
}
