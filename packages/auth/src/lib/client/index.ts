/** The better-auth client for a Product's browser code; `src/lib/auth-client.ts` creates it once. */
import type { BetterAuthClientPlugin } from "better-auth/client";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient as createClient } from "better-auth/svelte";
import { ac, roles } from "#lib/permissions.js";

export type CreateAuthClientOptions<P extends BetterAuthClientPlugin[] = []> = {
	/** PUBLIC_ORIGIN. */
	baseURL: string;
	/** The Admin option (matches the server). */
	admin?: boolean;
	/** More client plugins, e.g. the MCP endpoint's (`@vonall/mcp/client`); they are part of the client's type. */
	plugins?: P;
};

// The admin client is part of the type whether or not the option is on; without the option it is left out at runtime
type BasePlugins = [ReturnType<typeof twoFactorClient>, ReturnType<typeof adminClient<{ ac: typeof ac; roles: typeof roles }>>];

/** The client with this package's plugins and the Product's. */
export type AuthClient<P extends BetterAuthClientPlugin[] = []> = ReturnType<typeof createClient<{ baseURL: string; plugins: [...BasePlugins, ...P] }>>;

export function createAuthClient<const P extends BetterAuthClientPlugin[] = []>({ baseURL, admin = false, plugins }: CreateAuthClientOptions<P>): AuthClient<P> {
	return createClient({
		baseURL: baseURL || "http://localhost:5173",
		plugins: [twoFactorClient(), ...(admin ? [adminClient({ ac, roles })] : []), ...(plugins ?? [])],
	}) as unknown as AuthClient<P>;
}
