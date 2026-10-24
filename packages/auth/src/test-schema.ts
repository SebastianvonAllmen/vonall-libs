// The tables with every option on, and one column a Product might add, as named exports for drizzle-kit (the db tests' database)
import { text } from "drizzle-orm/pg-core";
import { authSchema } from "#lib/schema/index.js";

/** As a Product adds a column: `authSchema({ …, user: { phone: text("phone") } })`. */
export const PRODUCT_USER_COLUMNS = { phone: text("phone") };

export const { user, session, account, verification, twoFactor, rateLimit, einladung, jwks, oauthClient, oauthResource, oauthClientResource, oauthRefreshToken, oauthAccessToken, oauthConsent, oauthClientAssertion } =
	authSchema({ admin: true, mcp: true, user: PRODUCT_USER_COLUMNS });
