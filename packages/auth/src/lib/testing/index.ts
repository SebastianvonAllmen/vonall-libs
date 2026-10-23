/** Helpers for a Product's db tests (`tests/db/fixtures.ts`) and this package's own. */
import { getRequestEvent } from "$app/server";
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { createMailer } from "@vonall/mail";
import { ac, roles } from "#lib/permissions.js";
import { authSchema, type AuthSchema } from "#lib/schema/index.js";
import type { AuthContext, Db } from "#lib/server/context.js";
import { createAuth, type CreateAuthOptions } from "#lib/server/create.js";
import { userRepo } from "#lib/server/repositories/UserRepo.js";

/** Creates a user directly (the first one becomes admin, as in the app) and returns its id. */
export async function createUser(ctx: AuthContext, email = "user@example.com"): Promise<string> {
	const id = crypto.randomUUID();
	await userRepo(ctx).insertUser({ id, email, name: "", emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
	return id;
}

/** The wiring with test values: every option on, mail off, unless overridden; as a Product's `src/lib/auth.ts` does it. */
export function testAuth<S extends AuthSchema = AuthSchema<true, true>>(db: Db, overrides: Partial<CreateAuthOptions<S>> = {}) {
	const wiring = createAuth<S>({
		db,
		schema: authSchema({ admin: true, mcp: true }) as unknown as S,
		secret: "test-secret-for-the-db-tests-only",
		origin: "http://localhost:5173",
		appName: "Test",
		locale: "en-GB",
		signupMode: "invite",
		mailer: createMailer({ smtp: null }),
		...overrides,
	});
	const auth = betterAuth({ ...wiring.options, plugins: [twoFactor(), adminPlugin({ ac, roles }), sveltekitCookies(getRequestEvent)] });
	return { auth, ...wiring.register(auth) };
}
