# @vonall/mail

Mail for a Web App Factory Product over **any SMTP server** (nodemailer): a `Mailer` the Product creates once from its
env variables and passes to whatever sends mail (auth, the contact form), the `EmailLayout` frame for HTML mails and
`renderMail` to render a template on the server. Without an SMTP host the mailer is off (`enabled` is false) and
`send` throws, so callers hide what needs mail.

```ts
// src/lib/server/mail.ts of a Product
import { createMailer, configureMailMessages } from "@vonall/mail";
import { SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_SENDER } from "$app/env/private";

configureMailMessages({ locale: "de" });
export const mailer = createMailer({
	smtp: { host: SMTP_HOST, port: Number(SMTP_PORT || 587), user: SMTP_SENDER, password: SMTP_PASSWORD },
	from: SMTP_FROM || undefined,
});

await mailer.send({ to, subject, text, html: renderMail(MyTemplate, { link, appName, appLink }) });
```

A template is a Svelte component around `EmailLayout` (`title`, `link`, `buttonLabel`, `appName`, `appLink`, content
as children). Strings the layout owns ("Or use this link:", "Open <app>") come in English and German;
`configureMailMessages({ locale, overrides })` picks them. Tests pass a `transport` instead of SMTP.
