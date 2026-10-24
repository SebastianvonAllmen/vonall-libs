// The tables with every option on, as named exports for drizzle-kit (the db tests' database)
import { authSchema } from "@vonall/auth/schema";

export const { user, session, account, verification, twoFactor, rateLimit, einladung, jwks, oauthClient, oauthResource, oauthClientResource, oauthRefreshToken, oauthAccessToken, oauthConsent, oauthClientAssertion } =
	authSchema({ admin: true, mcp: true });
