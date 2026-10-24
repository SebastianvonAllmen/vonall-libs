import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { registry } from "#lib/server/registry.js";

export const EinladungRepo = {
	async insert(row: { id: string; tokenHash: string; createdBy: string; email: string | null; expiresAt: Date }) {
		const { db, schema } = registry();
		await db.insert(schema.einladung).values(row);
	},

	/** The Einladung with the name of its inviter, by the hash of its token. */
	async getByTokenHash(tokenHash: string) {
		const { db, schema } = registry();
		const { einladung, user } = schema;
		const rows = await db
			.select({
				id: einladung.id,
				createdBy: einladung.createdBy,
				inviterName: user.name,
				expiresAt: einladung.expiresAt,
				acceptedAt: einladung.acceptedAt,
			})
			.from(einladung)
			.innerJoin(user, eq(einladung.createdBy, user.id))
			.where(eq(einladung.tokenHash, tokenHash))
			.limit(1);
		return rows[0] ?? null;
	},

	/** Marks the Einladung as accepted, unless it already was or has expired; false when it couldn't be taken. */
	async accept(id: string, userId: string, now: Date): Promise<boolean> {
		const { db, schema } = registry();
		const { einladung } = schema;
		const rows = await db
			.update(einladung)
			.set({ acceptedAt: now, acceptedBy: userId })
			.where(and(eq(einladung.id, id), isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
			.returning({ id: einladung.id });
		return rows.length === 1;
	},

	/** The user's Einladungen that are still open (not accepted, not expired), newest first. */
	async listOpenBy(userId: string, now: Date) {
		const { db, schema } = registry();
		const { einladung } = schema;
		return await db
			.select({ id: einladung.id, email: einladung.email, expiresAt: einladung.expiresAt, createdAt: einladung.createdAt })
			.from(einladung)
			.where(and(eq(einladung.createdBy, userId), isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
			.orderBy(desc(einladung.createdAt));
	},

	/** All open Einladungen with their inviter, for the admin. */
	async listAllOpen(now: Date) {
		const { db, schema } = registry();
		const { einladung, user } = schema;
		return await db
			.select({
				id: einladung.id,
				email: einladung.email,
				inviterName: user.name,
				expiresAt: einladung.expiresAt,
				createdAt: einladung.createdAt,
			})
			.from(einladung)
			.innerJoin(user, eq(einladung.createdBy, user.id))
			.where(and(isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
			.orderBy(desc(einladung.createdAt));
	},

	/** Deletes an open Einladung of the user (or any, with `userId` null for the admin); false when there was none. */
	async deleteOpen(id: string, userId: string | null): Promise<boolean> {
		const { db, schema } = registry();
		const { einladung } = schema;
		const rows = await db
			.delete(einladung)
			.where(and(eq(einladung.id, id), isNull(einladung.acceptedAt), userId ? eq(einladung.createdBy, userId) : undefined))
			.returning({ id: einladung.id });
		return rows.length === 1;
	},
};
