import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { createMailer } from "@vonall/mail";
import { resetDatabase } from "../../../../../tooling/db/reset";
import { testDb } from "../../../../../tooling/db/testDb";
import { PRODUCT_USER_COLUMNS } from "../../test-schema";
import { ac, roles } from "#lib/permissions.js";
import { authSchema } from "#lib/schema/index.js";
import { createAuth } from "#lib/server/create.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";

const handle = testDb();
// As a Product with its own column on user wires it (without the SvelteKit cookies plugin: no request here)
const schema = authSchema({ admin: true, mcp: true, user: PRODUCT_USER_COLUMNS });
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
});
const auth = betterAuth({ ...wiring.options, plugins: [twoFactor(), adminPlugin({ ac, roles })] });
const { ctx } = wiring.register(auth);

describe("a Product's own columns on user", () => {
	afterAll(() => handle.end());
	beforeEach(resetDatabase);

	it("are written at signup through better-auth and read back by the repository", async () => {
		// The instance's type doesn't carry a Product's fields (wiring.options is the wide BetterAuthOptions); the browser
		// client does, through better-auth's inferAdditionalFields plugin
		const body = { email: "lena@example.com", password: "correct horse battery", name: "Lena", phone: "+41 79 000 00 00" } as unknown as NonNullable<Parameters<typeof auth.api.signUpEmail>[0]>["body"];
		const res = await auth.api.signUpEmail({ body });
		const user = await userRepo(ctx).getUserById(res.user.id);
		expect(user).toMatchObject({ email: "lena@example.com", role: "admin", phone: "+41 79 000 00 00" });
	});

	it("are on the schema's type", () => {
		expect(schema.user.phone.name).toBe("phone");
	});
});
