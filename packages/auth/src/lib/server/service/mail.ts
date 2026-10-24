/** The three mails of accounts, through the Product's mailer (`@vonall/mail`). */
import { renderMail } from "@vonall/mail";
import { m } from "#lib/messages.js";
import { registry } from "#lib/server/registry.js";
import InvitationEmail from "#lib/templates/InvitationEmail.svelte";
import ResetPasswordEmail from "#lib/templates/ResetPasswordEmail.svelte";
import VerifyEmailEmail from "#lib/templates/VerifyEmailEmail.svelte";

function footer() {
	const { appName, origin } = registry();
	return { appName, appLink: origin };
}

const footerText = (appName: string) => `\n---\n${appName}\n`;

export async function sendPasswordResetEmail(user: { email: string; name: string }, url: string) {
	const { mailer, appName } = registry();
	await mailer.send({
		to: user.email,
		subject: m().resetSubject(appName),
		text: m().resetText(user.name, appName, url) + footerText(appName),
		html: renderMail(ResetPasswordEmail, { recipientName: user.name, link: url, ...footer() }),
	});
}

export async function sendVerifyEmail(user: { email: string; name: string }, url: string) {
	const { mailer, appName } = registry();
	await mailer.send({
		to: user.email,
		subject: m().verifySubject(appName),
		text: m().verifyText(user.name, appName, url) + footerText(appName),
		html: renderMail(VerifyEmailEmail, { recipientName: user.name, link: url, ...footer() }),
	});
}

export async function sendEinladungEmail(inviterName: string, to: string, einladung: { link: string; expiresAt: Date }, locale: string) {
	const { mailer, appName } = registry();
	const validUntil = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(einladung.expiresAt);
	await mailer.send({
		to,
		subject: m().einladungSubject(inviterName, appName),
		text: m().einladungText(inviterName, appName, einladung.link, validUntil) + footerText(appName),
		html: renderMail(InvitationEmail, { inviterName, link: einladung.link, validUntil, ...footer() }),
	});
}
