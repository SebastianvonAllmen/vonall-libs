import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { createMailer } from "@vonall/mail";
import { z } from "zod";
import { resetDatabase } from "../../../../../tooling/db/reset";
import { testDb } from "../../../../../tooling/db/testDb";
import { PRODUCT_EINLADUNG_COLUMNS, PRODUCT_USER_COLUMNS } from "../../test-schema";
import { ac, roles } from "#lib/permissions.js";
import { authSchema } from "#lib/schema/index.js";
import { createAuth, type AuthHooks } from "#lib/server/create.js";
import { einladungRepo } from "#lib/server/repositories/EinladungRepo.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";
import { einladungService } from "#lib/server/service/einladung.service.js";
import { createUser } from "#lib/testing/index.js";
import type { SessionUser } from "#lib/types.js";

const handle = testDb();
// As a Product with its own columns on user and einladung wires it (without the SvelteKit cookies plugin: no request here)
const schema = authSchema({ admin: true, mcp: true, user: PRODUCT_USER_COLUMNS, einladung: PRODUCT_EINLADUNG_COLUMNS });
/** What the hooks saw, in order. */
const calls: string[] = [];
const hooks: AuthHooks<typeof schema> = {
	beforeUserCreate: (user) => {
		calls.push("beforeUserCreate");
		return { ...user, phone: "+41 79 000 00 00" };
	},
	afterUserCreate: async (user, einladung) => {
		// The admin role (first account) is already there when this runs
		calls.push(`afterUserCreate:${(await users.getUserById(user.id))?.role}:${einladung?.rolle ?? "-"}`);
	},
	afterEinladungAccepted: async (userId, einladung) => {
		calls.push(`afterEinladungAccepted:${einladung.rolle}`);
		await users.setRole(userId, einladung.rolle);
	},
	beforeUserDelete: (userId) => {
		calls.push(`beforeUserDelete:${userId}`);
	},
};
const wiring = createAuth({
	db: handle.db,
	schema,
	secret: "test-secret-for-the-db-tests-only",
	origin: "http://localhost:5173",
	appName: "Test",
	locale: "en-GB",
	signupMode: "invite",
	mailer: createMailer({ smtp: null }),
	userFields: { phone: { type: "string", required: false } },
	hooks,
	roles: ["admin", "trainer", "user"],
	einladung: {
		input: z.object({ rolle: z.enum(["trainer", "user"]).default("user") }),
		authorize: async (extras, user) => (extras.rolle === "trainer" && (await users.getUserById(user.id))?.role !== "admin" ? "Only admins invite trainers" : null),
	},
});
const auth = betterAuth({ ...wiring.options, plugins: [twoFactor(), adminPlugin({ ac, roles })] });
const { ctx } = wiring.register(auth);
const users = userRepo(ctx);
const einladungen = einladungService(ctx);
const password = "correct horse battery";
const asUser = (id: string, role: string) => ({ id, role } as unknown as SessionUser);
const phoneOf = async (id: string) => ((await users.getUserById(id)) as Record<string, unknown> | null)?.phone;

describe("a Product's extensions", () => {
	afterAll(() => handle.end());
	beforeEach(async () => {
		await resetDatabase();
		calls.length = 0;
	});

	it("carries its own columns through erstellen, pruefen, annehmen and the lists, never the token's hash", async () => {
		const admin = await createUser(ctx, "admin@example.com");
		const created = await einladungen.erstellen(admin, { email: "lena@example.com", rolle: "trainer" });
		expect(created.rolle).toBe("trainer");

		const info = (await einladungen.pruefen(created.token))._unsafeUnwrap();
		expect(info).toMatchObject({ id: created.id, inviterName: "Admin", rolle: "trainer", email: "lena@example.com" });
		expect(info).not.toHaveProperty("tokenHash");
		expect(await einladungRepo(ctx).listAllOpen(new Date())).toMatchObject([{ id: created.id, rolle: "trainer", inviterName: "Admin" }]);
		expect(await einladungRepo(ctx).listOpenBy(admin, new Date())).toMatchObject([{ id: created.id, rolle: "trainer" }]);
		expect((await einladungRepo(ctx).listOpenBy(admin, new Date()))[0]).not.toHaveProperty("tokenHash");

		const lena = await createUser(ctx, "lena@example.com");
		const row = (await einladungen.annehmen(lena, created.token))._unsafeUnwrap();
		expect(row).toMatchObject({ id: created.id, rolle: "trainer", acceptedBy: lena });
		expect(row.acceptedAt).toBeInstanceOf(Date);
		// The hook ran once, inside annehmen, and the role it set stays
		expect(calls).toEqual(["afterEinladungAccepted:trainer"]);
		expect((await users.getUserById(lena))?.role).toBe("trainer");
	});

	it("runs the hooks at signup in order: the Einladung, then the admin role, then afterUserCreate", async () => {
		// The very first account: no Einladung, the role admin outranks whatever an Einladung would set
		const res = await auth.api.signUpEmail({ body: { email: "first@example.com", password, name: "First" } });
		expect(await users.getUserById(res.user.id)).toMatchObject({ role: "admin", phone: "+41 79 000 00 00" });
		expect(calls).toEqual(["beforeUserCreate", "afterUserCreate:admin:-"]);
	});

	it("checks the fields of a new Einladung: none without input, input's schema, then authorize", async () => {
		const admin = await createUser(ctx, "admin@example.com");
		const member = await createUser(ctx, "member@example.com");
		expect((await einladungen.extrasPruefen({}, asUser(admin, "admin")))._unsafeUnwrap()).toEqual({ rolle: "user" });
		expect((await einladungen.extrasPruefen({ rolle: "trainer" }, asUser(admin, "admin")))._unsafeUnwrap()).toEqual({ rolle: "trainer" });
		expect((await einladungen.extrasPruefen({ rolle: "boss" }, asUser(admin, "admin")))._unsafeUnwrapErr().kind).toBe("ungueltig");
		expect((await einladungen.extrasPruefen({ rolle: "trainer" }, asUser(member, "user")))._unsafeUnwrapErr()).toEqual({ kind: "verboten", message: "Only admins invite trainers" });

		// Without createAuth({ einladung }) no extra key is allowed
		const plain = einladungService({ ...ctx, einladung: {} });
		expect((await plain.extrasPruefen({}, asUser(admin, "admin")))._unsafeUnwrap()).toEqual({});
		expect((await plain.extrasPruefen({ rolle: "user" }, asUser(admin, "admin")))._unsafeUnwrapErr().kind).toBe("ungueltig");
	});

	it("bans with a reason and ends the sessions; unbanning clears the reason", async () => {
		const admin = await createUser(ctx, "admin@example.com");
		const lena = await createUser(ctx, "lena@example.com");
		const now = new Date();
		await handle.db.insert(schema.session).values({ id: "s1", token: "t1", userId: lena, expiresAt: new Date(now.getTime() + 3600_000), createdAt: now, updatedAt: now });
		await handle.db.insert(schema.session).values({ id: "s2", token: "t2", userId: admin, expiresAt: new Date(now.getTime() + 3600_000), createdAt: now, updatedAt: now });

		await users.setBanned(lena, true, "Spam");
		expect(await users.getUserById(lena)).toMatchObject({ banned: true, banReason: "Spam", banExpires: null });
		expect((await handle.db.select().from(schema.session)).map((s) => s.id)).toEqual(["s2"]);

		await users.setBanned(lena, false);
		expect(await users.getUserById(lena)).toMatchObject({ banned: false, banReason: null });
	});

	it("runs beforeUserDelete before a Konto is deleted", async () => {
		const lena = await createUser(ctx, "lena@example.com");
		await users.kontoLoeschen(lena);
		expect(calls).toEqual([`beforeUserDelete:${lena}`]);
		expect(await users.getUserById(lena)).toBeNull();
	});

	it("writes the profile form's extra fields through better-auth's updateUser, null included", async () => {
		const res = await auth.api.signUpEmail({ body: { email: "lena@example.com", password, name: "Lena" }, returnHeaders: true });
		const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
		const headers = new Headers({ cookie });
		expect(await phoneOf(res.response.user.id)).toBe("+41 79 000 00 00");

		await auth.api.updateUser({ body: { name: "Lena M", phone: "+41 79 111 11 11" } as { name: string }, headers });
		expect(await users.getUserById(res.response.user.id)).toMatchObject({ name: "Lena M", phone: "+41 79 111 11 11" });

		await auth.api.updateUser({ body: { phone: null } as unknown as { name: string }, headers });
		expect(await phoneOf(res.response.user.id)).toBeNull();
	});

	it("createUser takes a name", async () => {
		const id = await createUser(ctx, "lena@example.com", "Lena Meier");
		expect((await users.getUserById(id))?.name).toBe("Lena Meier");
	});
});
