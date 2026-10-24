import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { authRegistry } from "@vonall/auth/server";
import { createUser, testAuth } from "@vonall/auth/testing";
import { resetDatabase } from "../../../../../../tooling/db/reset";
import { testDb } from "../../../../../../tooling/db/testDb";
import { AgentRepo } from "./AgentRepo";

const handle = testDb();

/** An assistant registered as an OAuth client, and the user's consent to it. */
async function connect(userId: string, clientId: string, name: string) {
	const { db, schema } = authRegistry();
	const now = new Date();
	await db.insert(schema.oauthClient).values({ id: crypto.randomUUID(), clientId, name, redirectUris: ["http://localhost/cb"], createdAt: now, updatedAt: now });
	await db.insert(schema.oauthConsent).values({ id: crypto.randomUUID(), clientId, userId, scopes: ["openid"], createdAt: now, updatedAt: now });
	await db.insert(schema.oauthAccessToken).values({ id: crypto.randomUUID(), token: `t-${clientId}-${userId}`, clientId, userId, scopes: ["openid"], expiresAt: new Date(now.getTime() + 3600_000), createdAt: now });
}

describe("AgentRepo", () => {
	beforeAll(() => {
		testAuth(handle.db);
	});
	afterAll(() => handle.end());
	beforeEach(resetDatabase);

	it("lists the assistants a user allowed, and only theirs", async () => {
		const lena = await createUser("lena@example.com");
		const tim = await createUser("tim@example.com");
		await connect(lena, "claude", "Claude");
		await connect(tim, "chatgpt", "ChatGPT");
		expect((await AgentRepo.listConnected(lena)).map((a) => a.name)).toEqual(["Claude"]);
		expect(await AgentRepo.hasAccess(lena, "claude")).toBe(true);
		expect(await AgentRepo.hasAccess(lena, "chatgpt")).toBe(false);
	});

	it("revokes an assistant at once: consent and tokens", async () => {
		const lena = await createUser("lena@example.com");
		await connect(lena, "claude", "Claude");
		await AgentRepo.revoke(lena, "claude");
		expect(await AgentRepo.hasAccess(lena, "claude")).toBe(false);
		expect(await AgentRepo.listConnected(lena)).toEqual([]);
		const { db, schema } = authRegistry();
		expect(await db.select().from(schema.oauthAccessToken)).toEqual([]);
	});
});
