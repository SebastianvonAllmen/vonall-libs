/** The three mails of accounts, through the Product's mailer (`@vonall/mail`), in the app's name and locale. */
import { renderMail } from "@vonall/mail";
import { m } from "#lib/messages.js";
import type { AuthContext } from "#lib/server/context.js";
import InvitationEmail from "#lib/templates/InvitationEmail.svelte";
import ResetPasswordEmail from "#lib/templates/ResetPasswordEmail.svelte";
import VerifyEmailEmail from "#lib/templates/VerifyEmailEmail.svelte";

export function authMails(ctx: AuthContext) {
	const { mailer, appName, origin, locale } = ctx;
	const footer = { appName, appLink: origin };
	const footerText = `\n---\n${appName}\n`;

	return {
		async passwordReset(user: { email: string; name: string }, url: string) {
			await mailer.send({
				to: user.email,
				subject: m().resetSubject(appName),
				text: m().resetText(user.name, appName, url) + footerText,
				html: renderMail(ResetPasswordEmail, { recipientName: user.name, link: url, ...footer }),
			});
		},

		async verify(user: { email: string; name: string }, url: string) {
			await mailer.send({
				to: user.email,
				subject: m().verifySubject(appName),
				text: m().verifyText(user.name, appName, url) + footerText,
				html: renderMail(VerifyEmailEmail, { recipientName: user.name, link: url, ...footer }),
			});
		},

		async einladung(inviterName: string, to: string, einladung: { link: string; expiresAt: Date }) {
			const validUntil = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(einladung.expiresAt);
			await mailer.send({
				to,
				subject: m().einladungSubject(inviterName, appName),
				text: m().einladungText(inviterName, appName, einladung.link, validUntil) + footerText,
				html: renderMail(InvitationEmail, { inviterName, link: einladung.link, validUntil, ...footer }),
			});
		},
	};
}

export type AuthMails = ReturnType<typeof authMails>;
