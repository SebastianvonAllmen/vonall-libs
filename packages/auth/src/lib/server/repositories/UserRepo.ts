import { asc, count, eq } from "drizzle-orm";
import { registry } from "#lib/server/registry.js";
import type { AppUserClient, UserInsert } from "#lib/types.js";
import { nameFromEmail } from "#lib/util/names.js";

/** The columns the client gets; the admin ones exist only with the admin option. */
function selection() {
	const { user } = registry().schema;
	const base = {
		id: user.id,
		email: user.email,
		name: user.name,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		twoFactorEnabled: user.twoFactorEnabled,
		emailVerified: user.emailVerified,
		image: user.image,
	};
	return registry().admin ? { ...base, role: user.role, banned: user.banned, banReason: user.banReason, banExpires: user.banExpires } : base;
}

const rows = (list: Partial<AppUserClient>[]) => list as AppUserClient[];

export const UserRepo = {
	/** Every account, oldest first (the admin's list). */
	async getAllUsers(): Promise<AppUserClient[]> {
		const { db, schema } = registry();
		return rows(await db.select(selection()).from(schema.user).orderBy(asc(schema.user.createdAt)));
	},

	async getUserById(id: string): Promise<AppUserClient | null> {
		const { db, schema } = registry();
		const list = rows(await db.select(selection()).from(schema.user).where(eq(schema.user.id, id)).limit(1));
		return list[0] ?? null;
	},

	async getUserFromEmail(email: string): Promise<AppUserClient | null> {
		const { db, schema } = registry();
		const list = rows(await db.select(selection()).from(schema.user).where(eq(schema.user.email, email)).limit(1));
		return list[0] ?? null;
	},

	async countUsers(): Promise<number> {
		const { db, schema } = registry();
		const [row] = await db.select({ n: count() }).from(schema.user);
		return row.n;
	},

	/** Admin option only. */
	async setRole(userId: string, role: string): Promise<void> {
		const { db, schema } = registry();
		await db.update(schema.user).set({ role }).where(eq(schema.user.id, userId));
	},

	/** Creates a user outside better-auth's signup (tests, scripts); the first one becomes admin like any other. */
	async insertUser(data: UserInsert): Promise<void> {
		const { db, schema, admin } = registry();
		if (!data.name && data.email) data.name = nameFromEmail(data.email);
		await db.insert(schema.user).values(data);
		if (admin && data.id && (await UserRepo.countUsers()) === 1) await UserRepo.setRole(data.id, "admin");
	},

	async getUserAccounts(userId: string) {
		const { db, schema } = registry();
		return await db
			.select({ id: schema.account.id, providerId: schema.account.providerId, updatedAt: schema.account.updatedAt })
			.from(schema.account)
			.where(eq(schema.account.userId, userId));
	},

	/** Deletes the user; every row that belongs to them goes with it (foreign keys cascade). */
	async deleteUser(userId: string): Promise<void> {
		const { db, schema } = registry();
		await db.delete(schema.user).where(eq(schema.user.id, userId));
	},
};
