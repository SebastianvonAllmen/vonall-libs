/**
 * Einladungen: the only way into the app once the first account (the admin) exists. A link works once and expires
 * after 14 days. Only the token's hash is stored.
 */
import { createHash, randomBytes } from "node:crypto";
import { err, ok, type Result } from "neverthrow";
import { m } from "#lib/messages.js";
import type { AuthContext } from "#lib/server/context.js";
import { einladungRepo } from "#lib/server/repositories/EinladungRepo.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";
import type { EinladungInfo, SignupMode, SignupState } from "#lib/types.js";
import { EINLADUNG_GUELTIG_TAGE, isListed, signupState } from "#lib/util/signup.js";

export { EINLADUNG_GUELTIG_TAGE };
/** The cookie that carries an Einladung's token from its link through signup (email, Google or GitHub). */
export const EINLADUNG_COOKIE = "einladung";

export type EinladungError = { kind: "unbekannt" | "abgelaufen" | "angenommen"; message: string };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const fehler = {
	unbekannt: (): EinladungError => ({ kind: "unbekannt", message: m().einladungUnbekannt }),
	abgelaufen: (): EinladungError => ({ kind: "abgelaufen", message: m().einladungAbgelaufen }),
	angenommen: (): EinladungError => ({ kind: "angenommen", message: m().einladungAngenommen }),
};

/** The Einladungen of the app the context belongs to. */
export function einladungService(ctx: AuthContext) {
	const repo = einladungRepo(ctx);
	const users = userRepo(ctx);

	const service = {
		/** Creates an Einladung and returns its token, shown only this once. */
		async erstellen(userId: string, input: { email?: string | null } = {}, now = new Date()): Promise<{ id: string; token: string; expiresAt: Date }> {
			const token = randomBytes(24).toString("base64url");
			const id = crypto.randomUUID();
			const expiresAt = new Date(now.getTime() + EINLADUNG_GUELTIG_TAGE * 24 * 60 * 60 * 1000);
			await repo.insert({ id, tokenHash: hash(token), createdBy: userId, email: input.email ?? null, expiresAt });
			return { id, token, expiresAt };
		},

		/** What the link offers, if it can still be used. */
		async pruefen(token: string, now = new Date()): Promise<Result<EinladungInfo, EinladungError>> {
			const row = await repo.getByTokenHash(hash(token));
			if (!row) return err(fehler.unbekannt());
			if (row.acceptedAt) return err(fehler.angenommen());
			if (row.expiresAt <= now) return err(fehler.abgelaufen());
			return ok({ id: row.id, inviterName: row.inviterName, expiresAt: row.expiresAt });
		},

		/**
		 * Whether someone may create an account now, and if not, why (the signup mode decides, `signupState`); whether it
		 * would be the very first account (the admin, only without an admin list); whether the address (`email`, known in
		 * the signup hook, not on the page) is on the admin list; and the Einladung the token stands for, if it is usable.
		 * One count, one lookup.
		 */
		async signup(
			token: string | undefined,
			options: { now?: Date; mode?: SignupMode; mail?: boolean; email?: string | null; confirmed?: boolean } = {},
		): Promise<{ state: SignupState; firstAccount: boolean; listed: boolean; einladung: EinladungInfo | null }> {
			const { now = new Date(), mode = ctx.signupMode, mail = ctx.mailer.enabled, confirmed = false } = options;
			const adminList = ctx.adminEmails.length > 0;
			const listed = isListed(ctx.adminEmails, options.email);
			const accounts = await users.countUsers();
			const geprueft = token ? await service.pruefen(token, now) : null;
			const einladung = geprueft?.isOk() ? geprueft.value : null;
			const einladungUsable = accounts > 0 && mode !== "open" && einladung !== null;
			return {
				state: signupState({ mode, accounts, einladungUsable, mail, listed, confirmed, adminList }),
				firstAccount: accounts === 0 && !adminList,
				listed,
				einladung,
			};
		},

		/** Uses the Einladung for the new user: marks it as taken. */
		async annehmen(userId: string, token: string, now = new Date()): Promise<Result<void, EinladungError>> {
			const info = await service.pruefen(token, now);
			if (info.isErr()) return err(info.error);
			if (!(await repo.accept(info.value.id, userId, now))) return err(fehler.angenommen());
			return ok(undefined);
		},

		/** Withdraws an open Einladung of the user, or any open one when `userId` is null (the admin). */
		async zurueckziehen(userId: string | null, einladungId: string): Promise<Result<void, EinladungError>> {
			return (await repo.deleteOpen(einladungId, userId)) ? ok(undefined) : err(fehler.unbekannt());
		},
	};
	return service;
}

export type EinladungService = ReturnType<typeof einladungService>;
