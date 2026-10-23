/** The better-auth client for a Product's browser code; `src/lib/auth-client.ts` creates it once. */
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient as createClient } from "better-auth/svelte";
import { ac, roles } from "#lib/permissions.js";

type ClientPlugin = NonNullable<Parameters<typeof createClient>[0]>["plugins"] extends (infer P)[] | undefined ? P : never;

export type CreateAuthClientOptions = {
	/** PUBLIC_ORIGIN. */
	baseURL: string;
	/** The Admin option (matches the server). */
	admin?: boolean;
	/** More client plugins, e.g. the MCP endpoint's (`@vonall/mcp/client`). */
	plugins?: ClientPlugin[];
};

function build({ baseURL, admin = false, plugins = [] }: CreateAuthClientOptions) {
	return createClient({
		baseURL: baseURL || "http://localhost:5173",
		plugins: [
			twoFactorClient(),
			// The admin client's types are part of the client's type whether or not the option is on
			...(admin ? [adminClient({ ac, roles })] : ([] as ReturnType<typeof adminClient>[])),
			...plugins,
		],
	});
}

export type AuthClient = ReturnType<typeof build>;

export function createAuthClient(options: CreateAuthClientOptions): AuthClient {
	return build(options);
}
