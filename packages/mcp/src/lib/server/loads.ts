import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import { error, redirect, type ServerLoadEvent } from "@sveltejs/kit";
import { contextOf } from "@vonall/auth/server";
import { m } from "#lib/messages.js";

type Event = Pick<ServerLoadEvent, "locals" | "url" | "request">;

/** What the consent page shows. */
export type ConsentData = { clientName: string; clientUri: string | null; backTo: string | null; scopes: string[] };

/**
 * `/auth/consent`: the consent screen of an MCP client authorisation; the provider signs the query it sends us here with.
 * `export { consentLoad as load } from "@vonall/mcp/server";`
 */
export async function consentLoad({ url, locals, request }: Event): Promise<ConsentData> {
	if (!locals.session) throw redirect(302, `/auth/login${url.search}`);
	const { auth } = contextOf(locals);
	const query = url.search.slice(1);
	const { secret } = await auth.$context;
	if (!(await verifyOAuthQueryParams(query, secret))) {
		throw error(400, { message: m().consentInvalid, id: "consent", timestamp: new Date().toISOString() });
	}
	const params = new URLSearchParams(query);
	const clientId = params.get("client_id") ?? "";
	// The MCP provider's endpoint, on the Product's instance (its plugins are not in this package's type of it)
	const api = auth.api as unknown as { getOAuthClientPublic(input: { query: { client_id: string }; headers: Headers }): Promise<{ client_name?: string; client_uri?: string }> };
	const client = await api.getOAuthClientPublic({ query: { client_id: clientId }, headers: request.headers });
	const redirectUri = params.get("redirect_uri") ?? "";
	const backTo = URL.canParse(redirectUri) ? new URL(redirectUri).host || null : null;
	return {
		clientName: client.client_name ?? m().anAssistant,
		clientUri: client.client_uri ?? null,
		backTo,
		scopes: (params.get("scope") ?? "").split(" ").filter(Boolean),
	};
}
