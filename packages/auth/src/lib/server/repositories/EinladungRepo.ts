import { and, desc, eq, getTableColumns, gt, isNull } from "drizzle-orm";
import type { FullSchema } from "#lib/schema/index.js";
import type { AuthContext } from "#lib/server/context.js";
import type { EinladungRow } from "#lib/types.js";

/** The Einladungen of the app the context belongs to. */
export function einladungRepo(ctx: AuthContext) {
	const { db } = ctx;
	// The type with the package's columns; a Product's own come along at runtime (`getTableColumns`)
	const { einladung, user } = ctx.schema as FullSchema;

	// Every column but the token's hash: the hash never leaves the database, the rows reach the inviter's browser
	const { tokenHash: _tokenHash, ...columns } = getTableColumns(einladung);
	const rows = <T>(list: T[]) => list as (T & Record<string, unknown>)[];

	return {
		/** Inserts the Einladung; keys beyond the package's columns are a Product's own columns. */
		async insert(row: { id: string; tokenHash: string; createdBy: string; email: string | null; expiresAt: Date } & Record<string, unknown>) {
			await db.insert(einladung).values(row);
		},

		/** The Einladung with the name of its inviter, by the hash of its token. */
		async getByTokenHash(tokenHash: string): Promise<(EinladungRow & { inviterName: string }) | null> {
			const list = rows(await db.select({ ...columns, inviterName: user.name }).from(einladung).innerJoin(user, eq(einladung.createdBy, user.id)).where(eq(einladung.tokenHash, tokenHash)).limit(1));
			return list[0] ?? null;
		},

		/** Marks the Einladung as accepted, unless it already was or has expired; the row as it is now, null when it couldn't be taken. */
		async accept(id: string, userId: string, now: Date): Promise<EinladungRow | null> {
			const list = rows(
				await db
					.update(einladung)
					.set({ acceptedAt: now, acceptedBy: userId })
					.where(and(eq(einladung.id, id), isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
					.returning(columns),
			);
			return list[0] ?? null;
		},

		/** The user's Einladungen that are still open (not accepted, not expired), newest first. */
		async listOpenBy(userId: string, now: Date): Promise<EinladungRow[]> {
			return rows(
				await db
					.select(columns)
					.from(einladung)
					.where(and(eq(einladung.createdBy, userId), isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
					.orderBy(desc(einladung.createdAt)),
			);
		},

		/** All open Einladungen with their inviter, for the admin. */
		async listAllOpen(now: Date): Promise<(EinladungRow & { inviterName: string })[]> {
			return rows(
				await db
					.select({ ...columns, inviterName: user.name })
					.from(einladung)
					.innerJoin(user, eq(einladung.createdBy, user.id))
					.where(and(isNull(einladung.acceptedAt), gt(einladung.expiresAt, now)))
					.orderBy(desc(einladung.createdAt)),
			);
		},

		/** Deletes an open Einladung of the user (or any, with `userId` null for the admin); false when there was none. */
		async deleteOpen(id: string, userId: string | null): Promise<boolean> {
			const list = await db
				.delete(einladung)
				.where(and(eq(einladung.id, id), isNull(einladung.acceptedAt), userId ? eq(einladung.createdBy, userId) : undefined))
				.returning({ id: einladung.id });
			return list.length === 1;
		},
	};
}

export type EinladungRepo = ReturnType<typeof einladungRepo>;
