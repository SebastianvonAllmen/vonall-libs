import { error } from "@sveltejs/kit";
import type { Result } from "neverthrow";
import { z } from "zod";
import { m } from "#lib/messages.js";
import { adminQuery, adminSchemaCommand, protectedQuery, protectedSchemaCommand } from "#lib/server/helpers.js";
import { authContext } from "#lib/server/context.js";
import { einladungRepo } from "#lib/server/repositories/EinladungRepo.js";
import { einladungService, type EinladungError } from "#lib/server/service/einladung.service.js";
import { authMails } from "#lib/server/service/mail.js";
import { emailSchema } from "#lib/types.js";
import { messageOf } from "#lib/util/messageOf.js";
import { isAdmin, mayInvite } from "#lib/util/signup.js";

function unwrap<T>(result: Result<T, EinladungError>): T {
	if (result.isOk()) return result.value;
	throw error(result.error.kind === "unbekannt" ? 404 : 400, { message: result.error.message, id: result.error.kind, timestamp: new Date().toISOString() });
}

/** The user's open Einladungen, and whether the server can send them by email. */
export const getOffeneEinladungen = protectedQuery(async (user) => {
	const ctx = authContext();
	return { einladungen: await einladungRepo(ctx).listOpenBy(user.id, new Date()), mail: ctx.mailer.enabled };
});

/** Creates an Einladung; the link is returned only here. With an email, it is also sent (if mail is set up). */
export const createEinladung = protectedSchemaCommand(z.object({ email: emailSchema.nullable() }), async ({ email }, user) => {
	const ctx = authContext();
	const { origin, signupMode, admin } = ctx;
	if (!mayInvite(signupMode, isAdmin(user))) {
		throw error(403, { message: m().onlyAdminsInvite, id: "forbidden", timestamp: new Date().toISOString() });
	}
	const einladung = await einladungService(ctx).erstellen(user.id, { email });
	const link = `${origin}/einladung/${einladung.token}`;
	let mailFehler: string | null = null;
	if (email) {
		try {
			await authMails(ctx).einladung(user.name, email, { link, expiresAt: einladung.expiresAt });
		} catch (e) {
			mailFehler = messageOf(e, m().mailFailed);
		}
	}
	await getOffeneEinladungen().refresh();
	if (admin && isAdmin(user)) await getAlleEinladungen().refresh();
	return { link, expiresAt: einladung.expiresAt, mailFehler };
});

export const withdrawEinladung = protectedSchemaCommand(z.object({ einladungId: z.string() }), async ({ einladungId }, user) => {
	const ctx = authContext();
	unwrap(await einladungService(ctx).zurueckziehen(user.id, einladungId));
	await getOffeneEinladungen().refresh();
	if (ctx.admin && isAdmin(user)) await getAlleEinladungen().refresh();
});

/** The Admin option: every open Einladung, and withdrawing any of them. */
export const getAlleEinladungen = adminQuery(async () => {
	return await einladungRepo(authContext()).listAllOpen(new Date());
});

export const adminWithdrawEinladung = adminSchemaCommand(z.object({ einladungId: z.string() }), async ({ einladungId }) => {
	unwrap(await einladungService(authContext()).zurueckziehen(null, einladungId));
	await getAlleEinladungen().refresh();
	await getOffeneEinladungen().refresh();
});
