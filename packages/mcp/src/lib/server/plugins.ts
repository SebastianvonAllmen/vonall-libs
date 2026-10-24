/**
 * What the Product adds to its better-auth instance for the MCP endpoint: `plugins: [jwt(), mcp(mcpPluginOptions(ORIGIN)),
 * cimd(CIMD_OPTIONS)]` and `rateLimitRules: MCP_RATE_LIMIT_RULES` in `authOptions()`. OAuth 2.1 for `/api/mcp`: AI
 * assistants register (dynamically or with a Client ID Metadata Document), the user logs in and allows access on
 * `/auth/consent`; access tokens are JWTs bound to `/api/mcp`.
 */
import type { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import type { McpOptions } from "@better-auth/mcp";

export function mcpPluginOptions(origin: string): McpOptions {
	return {
		loginPage: "/auth/login",
		consentPage: "/auth/consent",
		resource: `${origin || "http://localhost"}/api/mcp`,
		allowDynamicClientRegistration: true,
		allowUnauthenticatedClientRegistration: true,
		// CLI agents (Claude Code, Gemini CLI) call back on http://localhost, editors on custom schemes: native clients
		clientRegistrationDefaultApplicationType: "infer",
	};
}

/** The Client ID Metadata Document profile MCP clients use. */
export const CIMD_OPTIONS = { fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" } satisfies Parameters<typeof cimd>[0];

/** Dynamic client registration is open, so it is rate limited harder than the rest. */
export const MCP_RATE_LIMIT_RULES = { "/oauth2/register": { window: 3600, max: 20 } };
