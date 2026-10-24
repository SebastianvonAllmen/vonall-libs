import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { createMailer, type Mail } from "@vonall/mail";
import { resetDatabase } from "../../../../../tooling/db/reset";
import { testDb } from "../../../../../tooling/db/testDb";
import { ac, roles } from "#lib/permissions.js";
import { authSchema } from "#lib/schema/index.js";
import { createAuth } from "#lib/server/create.js";
import { hashPassword } from "#lib/server/crypto.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";
import { einladungService } from "#lib/server/service/einladung.service.js";
import { createUser } from "#lib/testing/index.js";

const handle = testDb();
const schema = authSchema({ admin: true, mcp: true });
/** The mails the app would send, for the confirmation link. */
const sent: Mail[] = [];
const mailer = createMailer({ smtp: null, transport: { sendMail: async (mail) => (sent.push(mail), {}) } });
// As a Product with ADMIN_EMAILS wires it (without the SvelteKit cookies plugin: no request here)
const wiring = createAuth({
	db: handle.db,
	schema,
	secret: "test-secret-for-the-db-tests-only",
	origin: "http://localhost:5173",
	appName: "Test",
	locale: "en-GB",
	signupMode: "invite",
	mailer,
	adminEmails: " Boss@Example.com, later@example.com",
});
const auth = betterAuth({ ...wiring.options, plugins: [twoFactor(), adminPlugin({ ac, roles })] });
const { ctx } = wiring.register(auth);
const users = userRepo(ctx);
const password = "correct horse battery";
const roleOf = async (email: string) => (await users.getUserFromEmail(email))?.role;
const linkToken = (mail: Mail) => new URL(mail.text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;

describe("the admin list", () => {
	afterAll(() => handle.end());
	beforeEach(async () => {
		await resetDatabase();
		sent.length = 0;
	});

	it("means nobody is first: an unlisted address needs an Einladung even into an empty app", async () => {
		expect((await einladungService(ctx).signup(undefined)).state).toBe("needs_einladung");
		await expect(auth.api.signUpEmail({ body: { email: "someone@example.com", password, name: "Someone" } })).rejects.toMatchObject({ status: "FORBIDDEN" });
		const first = await createUser(ctx, "first@example.com");
		expect((await users.getUserById(first))?.role).toBe("user");
	});

	it("lets a listed address sign up with a password, and makes it the admin once the mailed link confirms it", async () => {
		await auth.api.signUpEmail({ body: { email: "boss@example.com", password, name: "Boss" } });
		expect(await roleOf("boss@example.com")).toBe("user");
		expect(sent).toHaveLength(1);
		expect(sent[0]!.to).toBe("boss@example.com");

		await auth.api.verifyEmail({ query: { token: linkToken(sent[0]!) } });
		expect(await roleOf("boss@example.com")).toBe("admin");
	});

	it("reads the list case-insensitively and sends no confirmation to an unlisted signup", async () => {
		const boss = await createUser(ctx, "boss@example.com");
		await einladungService(ctx).erstellen(boss);
		expect((await einladungService(ctx).signup(undefined, { email: "BOSS@example.com", confirmed: true })).listed).toBe(true);
		expect((await einladungService(ctx).signup(undefined, { email: "other@example.com" })).listed).toBe(false);
		expect(sent).toHaveLength(0);
	});

	it("gives an existing, confirmed account on the list the role at its next login", async () => {
		const id = await createUser(ctx, "later@example.com"); // confirmed, role user: signed up before it was listed
		expect((await users.getUserById(id))?.role).toBe("user");
		const now = new Date();
		await handle.db.insert(schema.account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(password), createdAt: now, updatedAt: now });

		await auth.api.signInEmail({ body: { email: "later@example.com", password } });
		expect(await roleOf("later@example.com")).toBe("admin");
	});
});
