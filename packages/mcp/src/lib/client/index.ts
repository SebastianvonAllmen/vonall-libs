/** The client plugin for the Product's `createAuthClient({ plugins })` (better-auth/svelte). */
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

/** On the login page during an MCP authorisation, sign-in carries the signed OAuth request and continues it. */
export function mcpClientPlugins(): [ReturnType<typeof oauthProviderClient>] {
	return [oauthProviderClient()];
}
