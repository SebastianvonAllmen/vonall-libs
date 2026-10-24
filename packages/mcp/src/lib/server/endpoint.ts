/**
 * `createMcp()`: the MCP endpoint (Streamable HTTP, stateless, JSON responses) over the Product's accounts
 * (`@vonall/auth`'s context). Any MCP client that speaks OAuth 2.1 can connect: the bearer token is a JWT from
 * better-auth's MCP provider, bound to this resource; its subject is the user. The registration it returns is also what
 * the consent page and the tester read (`mcp.oauth` puts it into `event.locals.mcp`).
 */
import { requireMcpAuth } from "@better-auth/mcp";
import type { RequestHandler } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
import { userRepo, type AuthContext } from "@vonall/auth/server";
import { MCP_PATH } from "#lib/path.js";
import { withMcp, type McpContext } from "#lib/server/context.js";
import { handleMessage, type Admission, type Prompts, type ServerInfo, type Tool, type ToolContext } from "#lib/server/protocol.js";
import { agentRepo } from "#lib/server/repositories/AgentRepo.js";
import { crossSiteWrite } from "#lib/util/crossSiteWrite.js";

/** OAuth discovery for MCP clients (RFC 8414, RFC 9728, OIDC) at the domain root, answered by better-auth's MCP provider. */
const OAUTH_DISCOVERY = /^\/\.well-known\/(oauth-authorization-server|oauth-protected-resource|openid-configuration)(\/|$)/;

export type CreateMcpOptions = {
	/** The Product's accounts: `ctx` from `createAuth().register()`, with the MCP tables in its schema. */
	auth: AuthContext;
	/** The Product's tools, each a thin wrapper around one of its services. */
	tools: Tool[];
	/** The prompts the Product offers (none by default): a list, or a function of the caller, asked on every `prompts/*` request. */
	prompts?: Prompts;
	/**
	 * Who may use an assistant at all (everyone by default): called with the tool context after the token and consent
	 * checks on every call; `{ ok: false, reason }` answers 403 with the reason, and the consent page shows the reason
	 * instead of "Allow" (`consentLoad`'s `admission`).
	 */
	admit?: (ctx: ToolContext) => Promise<Admission>;
	/** What `initialize` says about the server: the app's name, a version, the instructions every assistant reads first. */
	serverInfo: ServerInfo;
};

/** The registration: the route handlers, the hooks handle, and what was registered. */
export type Mcp = {
	/** `src/routes/api/mcp/+server.ts`: `export const { POST, GET, DELETE } = mcp`. */
	POST: RequestHandler;
	GET: RequestHandler;
	DELETE: RequestHandler;
	/** The hooks handle before the session handle: the discovery documents, the origin check for writes, the registration into `locals.mcp`. */
	oauth: Handle;
	ctx: McpContext;
	tools: Tool[];
	prompts: Prompts;
	serverInfo: ServerInfo;
	/** The context a tool call gets for this user (the role read once); the endpoint and `mcpTester` build it the same way. */
	toolContext(userId: string, clientId: string | null): Promise<ToolContext>;
	/** The `admit` option, `{ ok: true }` for everyone when none was given; the endpoint, `consentLoad` and `mcpTester` ask it. */
	admit(ctx: ToolContext): Promise<Admission>;
};

const admitEveryone = async (): Promise<Admission> => ({ ok: true });

const methodNotAllowed: RequestHandler = () => new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });

/** The registration of the current request (`event.locals.mcp`, set by `mcp.oauth`), for the consent page's load. */
export function registrationOf(locals: object): Mcp {
	const mcp = (locals as { mcp?: Mcp }).mcp;
	if (!mcp) throw new Error("@vonall/mcp: no registration on this request; `mcp.oauth` is not in hooks.server.ts before the session handle");
	return mcp;
}

export function createMcp({ auth, tools, prompts = [], serverInfo, admit = admitEveryone }: CreateMcpOptions): Mcp {
	const ctx = withMcp(auth);
	const agents = agentRepo(ctx);
	const users = userRepo(ctx);
	const resource = `${ctx.origin || "http://localhost"}${MCP_PATH}`;
	const resourceMetadata = `${new URL(resource).origin}/.well-known/oauth-protected-resource${MCP_PATH}`;

	const toolContext = async (userId: string, clientId: string | null): Promise<ToolContext> => ({
		userId,
		clientId,
		locale: ctx.locale,
		role: ctx.admin ? ((await users.getUserById(userId))?.role ?? null) : null,
	});

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
				// The Product's gate (age, role, …) is asked on every call: a change counts at once, not at the next token
				const toolCtx = await toolContext(userId, clientId);
				const admission = await admit(toolCtx);
				if (!admission.ok) {
					return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: admission.reason } }, { status: 403 });
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
				const response = await handleMessage(body, toolCtx, tools, serverInfo, prompts);
				return response ? Response.json(response) : new Response(null, { status: 202 });
			},
			{ resource },
		)(request);

	const mcp: Mcp = {
		POST: ({ request }) => handler(request),
		// Stateless server: no server-initiated stream and no sessions to delete
		GET: methodNotAllowed,
		DELETE: methodNotAllowed,
		/** OAuth discovery documents (answered by better-auth) and the origin check for writes (see crossSiteWrite). */
		oauth: async ({ event, resolve }) => {
			(event.locals as { mcp?: Mcp }).mcp = mcp;
			if (OAUTH_DISCOVERY.test(event.url.pathname)) return ctx.auth.handler(event.request);
			if (crossSiteWrite(event.request, event.url)) {
				return new Response("Cross-site requests are forbidden", { status: 403 });
			}
			return resolve(event);
		},
		ctx,
		tools,
		prompts,
		serverInfo,
		toolContext,
		admit,
	};
	return mcp;
}
