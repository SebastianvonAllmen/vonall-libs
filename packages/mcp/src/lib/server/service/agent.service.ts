/**
 * AI assistants (Claude, ChatGPT, Le Chat, …) that a user connected to the MCP endpoint through OAuth. Their access
 * tokens are JWTs that stay valid until they expire, so the MCP endpoint also checks the consent on every call: taking
 * an assistant's access away (or deleting the account) works at once.
 */
import { AgentRepo } from "#lib/server/repositories/AgentRepo.js";

export type ConnectedAgent = { clientId: string; name: string | null; uri: string | null; since: Date | null };

export const AgentService = {
	async connected(userId: string): Promise<ConnectedAgent[]> {
		return await AgentRepo.listConnected(userId);
	},

	async accessValid(userId: string, clientId: string): Promise<boolean> {
		return await AgentRepo.hasAccess(userId, clientId);
	},

	async revoke(userId: string, clientId: string): Promise<void> {
		await AgentRepo.revoke(userId, clientId);
	},
};
