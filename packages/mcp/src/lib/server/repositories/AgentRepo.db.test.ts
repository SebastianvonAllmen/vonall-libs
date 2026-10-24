import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createUser as createUserIn, testAuth } from "@vonall/auth/testing";
import { resetDatabase } from "../../../../../../tooling/db/reset";
import { testDb } from "../../../../../../tooling/db/testDb";
import { withMcp } from "#lib/server/context.js";
import { agentRepo } from "./AgentRepo";

const handle = testDb();
const ctx = withMcp(testAuth(handle.db).ctx);
const { db, schema } = ctx;
const AgentRepo = agentRepo(ctx);
const createUser = (email?: string) => createUserIn(ctx, email);

/** An assistant registered as an OAuth client, and the user's consent to it. */
async function connect(userId: string, clientId: string, name: string) {
	const now = new Date();
	await db.insert(schema.oauthClient).values({ id: crypto.randomUUID(), clientId, name, redirectUris: ["http://localhost/cb"], createdAt: now, updatedAt: now });
	await db.insert(schema.oauthConsent).values({ id: crypto.randomUUID(), clientId, userId, scopes: ["openid"], createdAt: now, updatedAt: now });
	await db.insert(schema.oauthAccessToken).values({ id: crypto.randomUUID(), token: `t-${clientId}-${userId}`, clientId, userId, scopes: ["openid"], expiresAt: new Date(now.getTime() + 3600_000), createdAt: now });
}

describe("AgentRepo", () => {
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

	it("knows whether a user allowed any assistant", async () => {
		const lena = await createUser("lena@example.com");
		const tim = await createUser("tim@example.com");
		expect(await AgentRepo.hasAny(lena)).toBe(false);
		await connect(lena, "claude", "Claude");
		expect(await AgentRepo.hasAny(lena)).toBe(true);
		expect(await AgentRepo.hasAny(tim)).toBe(false);
		await AgentRepo.revoke(lena, "claude");
		expect(await AgentRepo.hasAny(lena)).toBe(false);
	});

	it("revokes an assistant at once: consent and tokens", async () => {
		const lena = await createUser("lena@example.com");
		await connect(lena, "claude", "Claude");
		await AgentRepo.revoke(lena, "claude");
		expect(await AgentRepo.hasAccess(lena, "claude")).toBe(false);
		expect(await AgentRepo.listConnected(lena)).toEqual([]);
		expect(await db.select().from(schema.oauthAccessToken)).toEqual([]);
	});
});
