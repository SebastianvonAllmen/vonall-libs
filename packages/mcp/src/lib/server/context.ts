import { authContext, type AuthContext } from "@vonall/auth/server";
import type { AuthSchema } from "@vonall/auth/schema";

/** `@vonall/auth`'s context of an app whose schema has the OAuth provider's tables (`authSchema({ mcp: true })`). */
export type McpContext = AuthContext<AuthSchema<boolean, true>>;

/** The context of the current request, for the remote functions; throws when the app's schema has no MCP tables. */
export function mcpContext(): McpContext {
	return withMcp(authContext());
}

export function withMcp(ctx: AuthContext): McpContext {
	if (!ctx.mcp) throw new Error("@vonall/mcp: the app's authSchema() was built without mcp: true, so the OAuth provider's tables are missing");
	return ctx as McpContext;
}
