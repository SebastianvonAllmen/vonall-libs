import { z } from "zod";
import { protectedQuery, protectedSchemaCommand } from "@vonall/auth/server";
import { mcpContext } from "#lib/server/context.js";
import { agentRepo } from "#lib/server/repositories/AgentRepo.js";

/** The AI assistants (MCP clients) the user allowed. */
export const getAgents = protectedQuery(async (user) => {
	return await agentRepo(mcpContext()).listConnected(user.id);
});

/** Takes an assistant's access away at once (consent and tokens). */
export const revokeAgent = protectedSchemaCommand(z.object({ clientId: z.string().min(1) }), async ({ clientId }, user) => {
	await agentRepo(mcpContext()).revoke(user.id, clientId);
	await getAgents().refresh();
});
