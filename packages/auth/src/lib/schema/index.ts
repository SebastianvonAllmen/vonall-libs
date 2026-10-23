/**
 * The tables of accounts: better-auth's (user, session, account, verification, twoFactor, rate_limit) and the
 * Einladung; with `admin` the role and ban columns, with `mcp` the OAuth provider's tables (`jwks`, `oauth_*`) the
 * `@vonall/mcp` package uses. A Product builds them once in its `src/lib/remote/schema/auth.sql.ts`, re-exports them so
 * drizzle-kit sees them, and generates its own migrations (`schema:` releases of this package say when).
 */
import type { BuildColumns } from "drizzle-orm";
import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, type AnyPgColumn, type PgColumnBuilderBase, type PgTableWithColumns } from "drizzle-orm/pg-core";

/** A Product's own columns on `user` (`{ phone: text("phone") }`); better-auth learns them through `createAuth({ userFields })`. */
export type UserExtra = Record<string, PgColumnBuilderBase>;
type NoExtra = Record<never, never>;

export type SchemaOptions<A extends boolean = boolean, M extends boolean = boolean, U extends UserExtra = NoExtra> = {
	/** The Admin option: `role`, `banned`, `banReason`, `banExpires` on `user`, `impersonatedBy` on `session`. */
	admin?: A;
	/** The tables of the OAuth provider for the MCP endpoint (`@vonall/mcp`). */
	mcp?: M;
	/** The Product's own columns on `user`, for what better-auth sets at signup; anything with its own life gets its own table. */
	user?: U;
};

const userColumns = () => ({
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	twoFactorEnabled: boolean("two_factor_enabled"),
});

const adminColumns = () => ({
	role: text("role").notNull().default("user"),
	banned: boolean("banned").notNull().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { precision: 6, withTimezone: true }),
});

type TableOf<Name extends string, C extends Record<string, PgColumnBuilderBase>> = PgTableWithColumns<{ name: Name; schema: undefined; columns: BuildColumns<Name, C, "pg">; dialect: "pg" }>;
export type UserTable<U extends UserExtra = NoExtra> = TableOf<"user", ReturnType<typeof userColumns> & U>;
export type UserAdminTable<U extends UserExtra = NoExtra> = TableOf<"user", ReturnType<typeof userColumns> & ReturnType<typeof adminColumns> & U>;
const buildUser = <U extends UserExtra>(extra: U): UserTable<U> => pgTable("user", { ...userColumns(), ...extra });
const buildUserAdmin = <U extends UserExtra>(extra: U): UserAdminTable<U> => pgTable("user", { ...userColumns(), ...adminColumns(), ...extra });

/** What the other tables need of `user`: its id to reference. */
type UserRef = { id: AnyPgColumn };

const sessionColumns = (user: UserRef) => ({
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});
const buildSession = (user: UserRef) => pgTable("session", sessionColumns(user));
const buildSessionAdmin = (user: UserRef) => pgTable("session", { ...sessionColumns(user), impersonatedBy: text("impersonated_by") });
export type SessionTable = ReturnType<typeof buildSession>;
export type SessionAdminTable = ReturnType<typeof buildSessionAdmin>;

function buildShared(user: UserRef) {
	const account = pgTable("account", {
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").notNull(),
		updatedAt: timestamp("updated_at").notNull(),
	});

	const verification = pgTable("verification", {
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at"),
		updatedAt: timestamp("updated_at"),
	});

	const twoFactor = pgTable("twoFactor", {
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		secret: text("secret").notNull(),
		backupCodes: text("backup_codes").notNull(),
		verified: boolean("verified").notNull().default(true),
		failedVerificationCount: integer("failed_verification_count").notNull().default(0),
		lockedUntil: timestamp("locked_until"),
	});

	/** better-auth rate limit counters, kept in Postgres so they survive restarts. */
	const rateLimit = pgTable("rate_limit", {
		id: text("id").primaryKey(),
		key: text("key").notNull().unique(),
		count: integer("count").notNull(),
		lastRequest: bigint("last_request", { mode: "number" }).notNull(),
	});

	/**
	 * An Einladung into the app: signup is invite only once the first account (the admin) exists. A link works once,
	 * until it expires; only the SHA-256 hash of its token is stored, the link is shown once when it is created.
	 */
	const einladung = pgTable("einladung", {
		id: text("id").primaryKey(),
		tokenHash: text("token_hash").notNull().unique(),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/** Set when the Einladung was sent by email, so the inviter recognises it in the list. */
		email: text("email"),
		expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
		acceptedAt: timestamp("accepted_at", { precision: 6, withTimezone: true }),
		acceptedBy: text("accepted_by").references(() => user.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull().defaultNow(),
	});

	return { account, verification, twoFactor, rateLimit, einladung };
}

function buildMcp(user: UserRef, session: SessionTable) {
	/** Signing keys of the OAuth provider (better-auth `jwt` plugin); MCP access tokens are JWTs signed with them. */
	const jwks = pgTable("jwks", {
		id: text("id").primaryKey(),
		publicKey: text("public_key").notNull(),
		privateKey: text("private_key").notNull(),
		createdAt: timestamp("created_at").notNull(),
		expiresAt: timestamp("expires_at"),
		alg: text("alg"),
		crv: text("crv"),
	});

	/** OAuth clients of the MCP endpoint: AI assistants, registered dynamically or through a Client ID Metadata Document. */
	const oauthClient = pgTable(
		"oauth_client",
		{
			id: text("id").primaryKey(),
			clientId: text("client_id").notNull().unique(),
			clientSecret: text("client_secret"),
			clientDiscoveryId: text("client_discovery_id"),
			disabled: boolean("disabled").default(false),
			skipConsent: boolean("skip_consent"),
			enableEndSession: boolean("enable_end_session"),
			subjectType: text("subject_type"),
			scopes: text("scopes").array(),
			clientCredentialsScopes: text("client_credentials_scopes").array().default([]),
			userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
			createdAt: timestamp("created_at"),
			updatedAt: timestamp("updated_at"),
			name: text("name"),
			uri: text("uri"),
			icon: text("icon"),
			contacts: text("contacts").array(),
			tos: text("tos"),
			policy: text("policy"),
			softwareId: text("software_id"),
			softwareVersion: text("software_version"),
			softwareStatement: text("software_statement"),
			redirectUris: text("redirect_uris").array().notNull(),
			postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
			backchannelLogoutUri: text("backchannel_logout_uri"),
			backchannelLogoutSessionRequired: boolean("backchannel_logout_session_required"),
			tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
			applicationType: text("application_type"),
			jwks: text("jwks"),
			jwksUri: text("jwks_uri"),
			grantTypes: text("grant_types").array(),
			responseTypes: text("response_types").array(),
			requirePKCE: boolean("require_pkce"),
			dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
			referenceId: text("reference_id"),
			metadata: jsonb("metadata"),
		},
		(table) => [index("oauthClient_userId_idx").on(table.userId)],
	);

	const oauthResource = pgTable("oauth_resource", {
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull().unique(),
		name: text("name").notNull(),
		accessTokenTtl: integer("access_token_ttl"),
		refreshTokenTtl: integer("refresh_token_ttl"),
		signingAlgorithm: text("signing_algorithm"),
		signingKeyId: text("signing_key_id"),
		allowedScopes: text("allowed_scopes").array(),
		customClaims: jsonb("custom_claims"),
		dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required").default(false),
		disabled: boolean("disabled").default(false),
		createdAt: timestamp("created_at"),
		updatedAt: timestamp("updated_at"),
		policyVersion: integer("policy_version").default(1),
		metadata: jsonb("metadata"),
	});

	const oauthClientResource = pgTable(
		"oauth_client_resource",
		{
			id: text("id").primaryKey(),
			clientId: text("client_id")
				.notNull()
				.references(() => oauthClient.clientId, { onDelete: "cascade" }),
			resourceId: text("resource_id")
				.notNull()
				.references(() => oauthResource.identifier, { onDelete: "cascade" }),
			metadata: jsonb("metadata"),
			createdAt: timestamp("created_at"),
		},
		(table) => [
			uniqueIndex("oauthClientResource_clientId_resourceId_uidx").on(table.clientId, table.resourceId),
			index("oauthClientResource_clientId_idx").on(table.clientId),
			index("oauthClientResource_resourceId_idx").on(table.resourceId),
		],
	);

	const oauthRefreshToken = pgTable(
		"oauth_refresh_token",
		{
			id: text("id").primaryKey(),
			token: text("token").notNull().unique(),
			clientId: text("client_id")
				.notNull()
				.references(() => oauthClient.clientId, { onDelete: "cascade" }),
			sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
			userId: text("user_id")
				.notNull()
				.references(() => user.id, { onDelete: "cascade" }),
			referenceId: text("reference_id"),
			authorizationCodeId: text("authorization_code_id"),
			resources: text("resources").array(),
			requestedUserInfoClaims: text("requested_user_info_claims").array(),
			expiresAt: timestamp("expires_at").notNull(),
			createdAt: timestamp("created_at").notNull(),
			revoked: timestamp("revoked"),
			rotatedAt: timestamp("rotated_at"),
			rotationReplayResponse: text("rotation_replay_response"),
			rotationReplayExpiresAt: timestamp("rotation_replay_expires_at"),
			authTime: timestamp("auth_time"),
			confirmation: jsonb("confirmation"),
			scopes: text("scopes").array().notNull(),
		},
		(table) => [
			index("oauthRefreshToken_clientId_idx").on(table.clientId),
			index("oauthRefreshToken_sessionId_idx").on(table.sessionId),
			index("oauthRefreshToken_userId_idx").on(table.userId),
			index("oauthRefreshToken_authorizationCodeId_idx").on(table.authorizationCodeId),
		],
	);

	const oauthAccessToken = pgTable(
		"oauth_access_token",
		{
			id: text("id").primaryKey(),
			token: text("token").notNull().unique(),
			clientId: text("client_id")
				.notNull()
				.references(() => oauthClient.clientId, { onDelete: "cascade" }),
			sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
			userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
			referenceId: text("reference_id"),
			authorizationCodeId: text("authorization_code_id"),
			resources: text("resources").array(),
			requestedUserInfoClaims: text("requested_user_info_claims").array(),
			refreshId: text("refresh_id").references(() => oauthRefreshToken.id, { onDelete: "cascade" }),
			expiresAt: timestamp("expires_at").notNull(),
			createdAt: timestamp("created_at").notNull(),
			revoked: timestamp("revoked"),
			confirmation: jsonb("confirmation"),
			scopes: text("scopes").array().notNull(),
		},
		(table) => [
			index("oauthAccessToken_clientId_idx").on(table.clientId),
			index("oauthAccessToken_sessionId_idx").on(table.sessionId),
			index("oauthAccessToken_userId_idx").on(table.userId),
			index("oauthAccessToken_authorizationCodeId_idx").on(table.authorizationCodeId),
			index("oauthAccessToken_refreshId_idx").on(table.refreshId),
		],
	);

	const oauthConsent = pgTable(
		"oauth_consent",
		{
			id: text("id").primaryKey(),
			clientId: text("client_id")
				.notNull()
				.references(() => oauthClient.clientId, { onDelete: "cascade" }),
			userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
			referenceId: text("reference_id"),
			resources: text("resources").array(),
			requestedUserInfoClaims: text("requested_user_info_claims").array(),
			scopes: text("scopes").array().notNull(),
			createdAt: timestamp("created_at").notNull(),
			updatedAt: timestamp("updated_at").notNull(),
		},
		(table) => [index("oauthConsent_clientId_idx").on(table.clientId), index("oauthConsent_userId_idx").on(table.userId)],
	);

	const oauthClientAssertion = pgTable("oauth_client_assertion", {
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
	});

	return { jwks, oauthClient, oauthResource, oauthClientResource, oauthRefreshToken, oauthAccessToken, oauthConsent, oauthClientAssertion };
}

export type SharedTables = ReturnType<typeof buildShared>;
export type McpTables = ReturnType<typeof buildMcp>;

/** The tables for the options given: `user` and `session` with or without the admin columns, the `mcp` tables or not. */
export type AuthSchema<A extends boolean = boolean, M extends boolean = boolean, U extends UserExtra = NoExtra> = SharedTables & {
	user: A extends true ? UserAdminTable<U> : UserTable<U>;
	session: A extends true ? SessionAdminTable : SessionTable;
} & (M extends true ? McpTables : Record<never, never>);

/** Every table with every option: what the package's own code is typed against (an option that is off leaves its columns unused). */
export type FullSchema = AuthSchema<true, true>;

export function authSchema<A extends boolean = false, M extends boolean = false, U extends UserExtra = NoExtra>(options: SchemaOptions<A, M, U> = {}): AuthSchema<A, M, U> {
	const admin = options.admin ?? false;
	const mcp = options.mcp ?? false;
	const extra = options.user ?? ({} as U);
	const user = admin ? buildUserAdmin(extra) : buildUser(extra);
	const session: SessionTable = admin ? buildSessionAdmin(user) : buildSession(user);
	const tables = { user, session, ...buildShared(user), ...(mcp ? buildMcp(user, session) : {}) };
	return tables as unknown as AuthSchema<A, M, U>;
}
