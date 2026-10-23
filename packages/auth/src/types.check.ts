/**
 * Compile-time checks of what a Product relies on (svelte-check runs them, nothing imports this file): the plugins a
 * Product passes are part of the returned types, the admin and two-factor members exist on the client.
 */
import { mcp } from "@better-auth/mcp";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { jwt } from "better-auth/plugins";
import { createAuthClient } from "#lib/client/index.js";
import type { Auth, CreateAuthOptions, CreatedAuth } from "#lib/server/create.js";
import { createAuth } from "#lib/server/create.js";

declare const options: CreateAuthOptions;
const exists = (..._members: unknown[]) => {};

const plain: CreatedAuth = createAuth(options);
exists(plain.auth.api.getSession, plain.auth.api.listSessions);

const withMcp = createAuth({ ...options, plugins: [jwt(), mcp({ loginPage: "/auth/login", consentPage: "/auth/consent", resource: "http://localhost/api/mcp" })] });
const base: Auth = withMcp.auth as unknown as Auth;
exists(withMcp.auth.api.getOAuthClientPublic, withMcp.auth.api.getSession, base.$Infer.Session.user.role);

const client = createAuthClient({ baseURL: "http://localhost:5173", admin: true, plugins: [oauthProviderClient()] });
exists(client.twoFactor.enable, client.admin.setRole, client.oauth2.consent, client.signIn.social);
