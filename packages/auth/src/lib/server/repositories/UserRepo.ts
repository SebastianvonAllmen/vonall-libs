import { asc, count, eq, getTableColumns } from "drizzle-orm";
import type { FullSchema } from "#lib/schema/index.js";
import type { AuthContext } from "#lib/server/context.js";
import type { AppUserClient, UserInsert } from "#lib/types.js";
import { nameFromEmail } from "#lib/util/names.js";

const rows = (list: Partial<AppUserClient>[]) => list as AppUserClient[];

/** The accounts of the app the context belongs to. */
export function userRepo(ctx: AuthContext) {
	const { db, admin } = ctx;
	// The type with every column; the admin ones are only written with the option (`ctx.admin`)
	const { user, account, session } = ctx.schema as FullSchema;

	// Every column: the admin ones exist only with the option, a Product's own ones come along
	const selection = getTableColumns(user);

	const repo = {
		/** Every account, oldest first (the admin's list). */
		async getAllUsers(): Promise<AppUserClient[]> {
			return rows(await db.select(selection).from(user).orderBy(asc(user.createdAt)));
		},

		async getUserById(id: string): Promise<AppUserClient | null> {
			const list = rows(await db.select(selection).from(user).where(eq(user.id, id)).limit(1));
			return list[0] ?? null;
		},

		async getUserFromEmail(email: string): Promise<AppUserClient | null> {
			const list = rows(await db.select(selection).from(user).where(eq(user.email, email)).limit(1));
			return list[0] ?? null;
		},

		async countUsers(): Promise<number> {
			const [row] = await db.select({ n: count() }).from(user);
			return row.n;
		},

		/** Admin option only. */
		async setRole(userId: string, role: string): Promise<void> {
			await db.update(user).set({ role }).where(eq(user.id, userId));
		},

		/** Admin option only: bans (with a reason, no expiry) or unbans; a ban ends the user's sessions at once. */
		async setBanned(userId: string, banned: boolean, reason?: string): Promise<void> {
			await db
				.update(user)
				.set({ banned, banReason: banned ? (reason ?? null) : null, banExpires: null })
				.where(eq(user.id, userId));
			if (banned) await db.delete(session).where(eq(session.userId, userId));
		},

		/** Creates a user outside better-auth's signup (tests, scripts); the first one becomes admin like any other. */
		async insertUser(data: UserInsert): Promise<void> {
			if (!data.name && data.email) data.name = nameFromEmail(data.email);
			await db.insert(user).values(data);
			// The first account is the admin, unless the admin list says who is
			if (admin && ctx.adminEmails.length === 0 && data.id && (await repo.countUsers()) === 1) await repo.setRole(data.id, "admin");
		},

		async getUserAccounts(userId: string) {
			return await db.select({ id: account.id, providerId: account.providerId, updatedAt: account.updatedAt }).from(account).where(eq(account.userId, userId));
		},

		/**
		 * Deletes the Konto: the user with everything that belongs to them (the foreign keys of every user-owned table
		 * cascade, so a Product's own tables reference `user.id` with `onDelete: "cascade"`). The Product's
		 * `beforeUserDelete` hook runs first, for what lives outside the database (a Strava connection to revoke).
		 */
		async kontoLoeschen(userId: string): Promise<void> {
			await ctx.hooks.beforeUserDelete?.(userId);
			await db.delete(user).where(eq(user.id, userId));
		},
	};
	return repo;
}

export type UserRepo = ReturnType<typeof userRepo>;
