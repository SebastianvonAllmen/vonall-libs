import { and, desc, eq } from "drizzle-orm";
import { authRegistry } from "@vonall/auth/server";

/** AI assistants (OAuth clients of the MCP endpoint) a user allowed, through their consent; over `@vonall/auth`'s tables. */
export const AgentRepo = {
	async listConnected(userId: string) {
		const { db, schema } = authRegistry();
		const { oauthClient, oauthConsent } = schema;
		return await db
			.select({ clientId: oauthConsent.clientId, name: oauthClient.name, uri: oauthClient.uri, since: oauthConsent.createdAt })
			.from(oauthConsent)
			.innerJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
			.where(eq(oauthConsent.userId, userId))
			.orderBy(desc(oauthConsent.createdAt));
	},

	async hasAccess(userId: string, clientId: string): Promise<boolean> {
		const { db, schema } = authRegistry();
		const { oauthConsent } = schema;
		const rows = await db
			.select({ id: oauthConsent.id })
			.from(oauthConsent)
			.where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
			.limit(1);
		return rows.length === 1;
	},

	/** Takes the assistant's access away: its consent and every token it holds for the user. */
	async revoke(userId: string, clientId: string) {
		const { db, schema } = authRegistry();
		const { oauthAccessToken, oauthConsent, oauthRefreshToken } = schema;
		await db.transaction(async (tx) => {
			await tx.delete(oauthAccessToken).where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, clientId)));
			await tx.delete(oauthRefreshToken).where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)));
			await tx.delete(oauthConsent).where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)));
		});
	},
};
