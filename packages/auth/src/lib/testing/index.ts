/** Helpers for a Product's db tests (`tests/db/fixtures.ts`) and this package's own. */
import { createMailer } from "@vonall/mail";
import { authSchema } from "#lib/schema/index.js";
import { createAuth, type CreateAuthOptions, type CreatedAuth } from "#lib/server/create.js";
import type { Db } from "#lib/server/registry.js";
import { UserRepo } from "#lib/server/repositories/UserRepo.js";

/** Creates a user directly (the first one becomes admin, as in the app) and returns its id. */
export async function createUser(email = "user@example.com"): Promise<string> {
	const id = crypto.randomUUID();
	await UserRepo.insertUser({ id, email, name: "", emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
	return id;
}

/** `createAuth()` with test values: every option on, mail off, unless overridden. */
export function testAuth(db: Db, overrides: Partial<CreateAuthOptions> = {}): CreatedAuth {
	return createAuth({
		db,
		schema: authSchema({ admin: true, mcp: true }),
		secret: "test-secret-for-the-db-tests-only",
		origin: "http://localhost:5173",
		appName: "Test",
		locale: "en-GB",
		signupMode: "invite",
		mailer: createMailer({ smtp: null }),
		admin: true,
		...overrides,
	});
}
