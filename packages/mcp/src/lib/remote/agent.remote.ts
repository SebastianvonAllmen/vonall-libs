import { z } from "zod";
import { protectedQuery, protectedSchemaCommand } from "@vonall/auth/server";
import { AgentService } from "#lib/server/service/agent.service.js";

/** The AI assistants (MCP clients) the user allowed. */
export const getAgents = protectedQuery(async (user) => {
	return await AgentService.connected(user.id);
});

/** Takes an assistant's access away at once (consent and tokens). */
export const revokeAgent = protectedSchemaCommand(z.object({ clientId: z.string().min(1) }), async ({ clientId }, user) => {
	await AgentService.revoke(user.id, clientId);
	await getAgents().refresh();
});
