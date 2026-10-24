import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createUser as createUserIn, testAuth } from "@vonall/auth/testing";
import { resetDatabase } from "../../../../../tooling/db/reset";
import { testDb } from "../../../../../tooling/db/testDb";
import { withMcp } from "#lib/server/context.js";
import { createMcp } from "#lib/server/endpoint.js";
import { prompt, tool, type Prompt, type ToolContext } from "#lib/server/protocol.js";
import { agentRepo } from "#lib/server/repositories/AgentRepo.js";
import { mcpTester } from "#lib/testing/index.js";

// The JWT check is better-auth's (it fetches the JWKS over HTTP); here the claims come from a header, so the endpoint's
// own answers (consent, admission, the protocol) are what is tested
vi.mock("@better-auth/mcp", () => ({
	requireMcpAuth: (_auth: unknown, handler: (request: Request, claims: Record<string, unknown>) => Promise<Response>) => (request: Request) =>
		handler(request, JSON.parse(request.headers.get("x-claims") ?? "{}")),
}));

const handle = testDb();
const ctx = withMcp(testAuth(handle.db).ctx);
const { db, schema } = ctx;
const createUser = (email?: string) => createUserIn(ctx, email);

const SERVER = { name: "Test", version: "1.0.0", instructions: "Act as the user." };
const TOOLS = [tool({ name: "whoami", description: "Who calls.", input: z.object({}), run: async (ctx) => ({ ok: true, data: { userId: ctx.userId } }) })];
const START: Prompt = prompt({ name: "start", title: "Start", description: "Starts.", arguments: [], text: () => "Start." });
/** Only an admin may use an assistant; the prompts depend on the role too. */
const mcp = createMcp({
	auth: ctx,
	tools: TOOLS,
	prompts: async (ctx: ToolContext) => (ctx.role === "admin" ? [START] : []),
	admit: async (ctx: ToolContext) => (ctx.role === "admin" ? { ok: true } : { ok: false, reason: "Assistants are for admins" }),
	serverInfo: SERVER,
});

/** An assistant registered as an OAuth client. */
async function register(clientId: string) {
	const now = new Date();
	await db.insert(schema.oauthClient).values({ id: crypto.randomUUID(), clientId, name: clientId, redirectUris: ["http://localhost/cb"], createdAt: now, updatedAt: now });
}

/** The user's consent to a registered assistant. */
async function consent(userId: string, clientId: string) {
	const now = new Date();
	await db.insert(schema.oauthConsent).values({ id: crypto.randomUUID(), clientId, userId, scopes: ["openid"], createdAt: now, updatedAt: now });
}

/** A call as the assistant `clientId` would make it, the JWT's claims standing in. */
const post = (userId: string, clientId: string, body: object) =>
	mcp.POST({
		request: new Request("http://localhost:5173/api/mcp", {
			method: "POST",
			headers: { "content-type": "application/json", "x-claims": JSON.stringify({ sub: userId, client_id: clientId }) },
			body: JSON.stringify(body),
		}),
	} as Parameters<typeof mcp.POST>[0]) as Promise<Response>;

const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } };

describe("the MCP endpoint", () => {
	afterAll(() => handle.end());
	beforeEach(resetDatabase);

	it("refuses a revoked assistant with 401 and a user the Product does not admit with 403 and the reason", async () => {
		const admin = await createUser("admin@example.com"); // the first account is the admin
		const lena = await createUser("lena@example.com");
		await register("claude");
		const noConsent = await post(admin, "claude", INIT);
		expect(noConsent.status).toBe(401);

		await consent(lena, "claude");
		const refused = await post(lena, "claude", INIT);
		expect(refused.status).toBe(403);
		expect(await refused.json()).toEqual({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Assistants are for admins" } });

		await consent(admin, "claude");
		const ok = await post(admin, "claude", INIT);
		expect(ok.status).toBe(200);
		expect((await ok.json()).result.capabilities).toHaveProperty("prompts");
	});

	it("asks the prompts function for the caller", async () => {
		const admin = await createUser("admin@example.com");
		await register("claude");
		await consent(admin, "claude");
		const list = await post(admin, "claude", { jsonrpc: "2.0", id: 2, method: "prompts/list" });
		expect((await list.json()).result.prompts.map((p: { name: string }) => p.name)).toEqual(["start"]);
	});

	it("is what mcpTester plays back: the admission and the prompts per user", async () => {
		const { send, call, admit } = mcpTester(mcp);
		const admin = await createUser("admin@example.com");
		const lena = await createUser("lena@example.com");
		expect(await admit(admin)).toEqual({ ok: true });
		expect(await admit(lena)).toEqual({ ok: false, reason: "Assistants are for admins" });
		expect(await send(lena, INIT)).toEqual({ error: { code: -32001, message: "Assistants are for admins" } });
		expect(await call(lena, "whoami")).toEqual({ isError: true, data: "Assistants are for admins" });
		expect(await call(admin, "whoami")).toEqual({ isError: false, data: { userId: admin } });
		expect((await send(admin, { jsonrpc: "2.0", id: 2, method: "prompts/list" }))?.result?.prompts).toEqual([{ name: "start", title: "Start", description: "Starts.", arguments: [] }]);
		// hasAny: the Agents tab's question, whether anything is connected at all
		expect(await agentRepo(ctx).hasAny(admin)).toBe(false);
	});
});
