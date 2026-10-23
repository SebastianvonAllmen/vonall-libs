/**
 * `createMcp()`: the MCP endpoint (Streamable HTTP, stateless, JSON responses) over the Product's accounts
 * (`@vonall/auth`'s context). Any MCP client that speaks OAuth 2.1 can connect: the bearer token is a JWT from
 * better-auth's MCP provider, bound to this resource; its subject is the user.
 */
import { requireMcpAuth } from "@better-auth/mcp";
import type { RequestHandler } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import type { AuthContext } from "@vonall/auth/server";
import { withMcp } from "#lib/server/context.js";
import { handleMessage, type Prompt, type ServerInfo, type Tool } from "#lib/server/protocol.js";
import { agentRepo } from "#lib/server/repositories/AgentRepo.js";
import { crossSiteWrite } from "#lib/util/crossSiteWrite.js";

/** OAuth discovery for MCP clients (RFC 8414, RFC 9728, OIDC) at the domain root, answered by better-auth's MCP provider. */
const OAUTH_DISCOVERY = /^\/\.well-known\/(oauth-authorization-server|oauth-protected-resource|openid-configuration)(\/|$)/;

export type CreateMcpOptions = {
	/** The Product's accounts: `ctx` from `createAuth().register()`, with the MCP tables in its schema. */
	auth: AuthContext;
	/** The Product's tools, each a thin wrapper around one of its services. */
	tools: Tool[];
	/** The prompts the Product offers (none by default). */
	prompts?: Prompt[];
	/** What `initialize` says about the server: the app's name, a version, the instructions every assistant reads first. */
	serverInfo: ServerInfo;
};

export type Mcp = {
	/** `src/routes/api/mcp/+server.ts`: `export const { POST, GET, DELETE } = mcp`. */
	POST: RequestHandler;
	GET: RequestHandler;
	DELETE: RequestHandler;
	/** The hooks handle before the session handle: the discovery documents and the origin check for writes. */
	oauth: Handle;
};

const methodNotAllowed: RequestHandler = () => new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });

export function createMcp({ auth, tools, prompts = [], serverInfo }: CreateMcpOptions): Mcp {
	const ctx = withMcp(auth);
	const agents = agentRepo(ctx);
	const resource = `${ctx.origin || "http://localhost"}/api/mcp`;
	const resourceMetadata = `${new URL(resource).origin}/.well-known/oauth-protected-resource/api/mcp`;

	// The instance is read per request (`ctx.auth`): the Product's wiring registers it after building it
	const handler = (request: Request) =>
		requireMcpAuth(
			ctx.auth as unknown as Parameters<typeof requireMcpAuth>[0],
			async (request, claims) => {
				const userId = claims.sub;
				const clientId = typeof claims.client_id === "string" ? claims.client_id : typeof claims.azp === "string" ? claims.azp : null;
				// The JWT alone stays valid until it expires; a revoked assistant or a deleted account must stop at once
				if (!userId || !clientId || !(await agents.hasAccess(userId, clientId))) {
					return Response.json(
						{ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Access was revoked" } },
						{ status: 401, headers: { "WWW-Authenticate": `Bearer error="invalid_token", resource_metadata="${resourceMetadata}"` } },
					);
				}
				let body: unknown;
				try {
					body = await request.json();
				} catch {
					return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
				}
				if (Array.isArray(body)) {
					return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Batching is not supported" } }, { status: 400 });
				}
				const response = await handleMessage(body, userId, tools, serverInfo, prompts);
				return response ? Response.json(response) : new Response(null, { status: 202 });
			},
			{ resource },
		)(request);

	/** OAuth discovery documents (answered by better-auth) and the origin check for writes (see crossSiteWrite). */
	const oauth: Handle = async ({ event, resolve }) => {
		if (OAUTH_DISCOVERY.test(event.url.pathname)) return ctx.auth.handler(event.request);
		if (crossSiteWrite(event.request, event.url)) {
			return new Response("Cross-site requests are forbidden", { status: 403 });
		}
		return resolve(event);
	};

	return {
		POST: ({ request }) => handler(request),
		// Stateless server: no server-initiated stream and no sessions to delete
		GET: methodNotAllowed,
		DELETE: methodNotAllowed,
		oauth,
	};
}
