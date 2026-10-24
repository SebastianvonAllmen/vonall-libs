import { error } from "@sveltejs/kit";
import type { Result } from "neverthrow";
import { z } from "zod";
import { m } from "#lib/messages.js";
import { adminQuery, adminSchemaCommand, protectedQuery, protectedSchemaCommand } from "#lib/server/helpers.js";
import { registry } from "#lib/server/registry.js";
import { EinladungRepo } from "#lib/server/repositories/EinladungRepo.js";
import { EinladungService, type EinladungError } from "#lib/server/service/einladung.service.js";
import { sendEinladungEmail } from "#lib/server/service/mail.js";
import { emailSchema } from "#lib/types.js";
import { messageOf } from "#lib/util/messageOf.js";
import { isAdmin, mayInvite } from "#lib/util/signup.js";

function unwrap<T>(result: Result<T, EinladungError>): T {
	if (result.isOk()) return result.value;
	throw error(result.error.kind === "unbekannt" ? 404 : 400, { message: result.error.message, id: result.error.kind, timestamp: new Date().toISOString() });
}

/** The user's open Einladungen, and whether the server can send them by email. */
export const getOffeneEinladungen = protectedQuery(async (user) => {
	return { einladungen: await EinladungRepo.listOpenBy(user.id, new Date()), mail: registry().mailer.enabled };
});

/** Creates an Einladung; the link is returned only here. With an email, it is also sent (if mail is set up). */
export const createEinladung = protectedSchemaCommand(z.object({ email: emailSchema.nullable() }), async ({ email }, user) => {
	const { origin, signupMode, admin, locale } = registry();
	if (!mayInvite(signupMode, isAdmin(user))) {
		throw error(403, { message: m().onlyAdminsInvite, id: "forbidden", timestamp: new Date().toISOString() });
	}
	const einladung = await EinladungService.erstellen(user.id, { email });
	const link = `${origin}/einladung/${einladung.token}`;
	let mailFehler: string | null = null;
	if (email) {
		try {
			await sendEinladungEmail(user.name, email, { link, expiresAt: einladung.expiresAt }, locale);
		} catch (e) {
			mailFehler = messageOf(e, m().mailFailed);
		}
	}
	await getOffeneEinladungen().refresh();
	if (admin && isAdmin(user)) await getAlleEinladungen().refresh();
	return { link, expiresAt: einladung.expiresAt, mailFehler };
});

export const withdrawEinladung = protectedSchemaCommand(z.object({ einladungId: z.string() }), async ({ einladungId }, user) => {
	unwrap(await EinladungService.zurueckziehen(user.id, einladungId));
	await getOffeneEinladungen().refresh();
	if (registry().admin && isAdmin(user)) await getAlleEinladungen().refresh();
});

/** The Admin option: every open Einladung, and withdrawing any of them. */
export const getAlleEinladungen = adminQuery(async () => {
	return await EinladungRepo.listAllOpen(new Date());
});

export const adminWithdrawEinladung = adminSchemaCommand(z.object({ einladungId: z.string() }), async ({ einladungId }) => {
	unwrap(await EinladungService.zurueckziehen(null, einladungId));
	await getAlleEinladungen().refresh();
	await getOffeneEinladungen().refresh();
});
