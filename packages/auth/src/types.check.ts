/**
 * Compile-time checks of what a Product relies on (svelte-check runs them, nothing imports this file): the wiring as a
 * Product's src/lib/auth.ts and auth-client.ts write it keeps every plugin's members on the instance and the client.
 */
import { mcp } from "@better-auth/mcp";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { getRequestEvent } from "$app/server";
import { betterAuth } from "better-auth";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { admin as adminPlugin, jwt } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { createAuthClient } from "better-auth/svelte";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { ac, roles } from "#lib/permissions.js";
import { authOptions, registerAuth, type CreateAuthOptions } from "#lib/server/create.js";

declare const options: CreateAuthOptions;
const exists = (...members: unknown[]) => members.length;

const auth = betterAuth({
	...authOptions(options),
	plugins: [twoFactor(), adminPlugin({ ac, roles }), jwt(), mcp({ loginPage: "/auth/login", consentPage: "/auth/consent", resource: "http://localhost/api/mcp" }), sveltekitCookies(getRequestEvent)],
});
const { handle, apiHandler } = registerAuth(auth);
exists(handle, apiHandler, auth.api.getSession, auth.api.listSessions, auth.api.getOAuthClientPublic, auth.$Infer.Session.user.role, auth.$Infer.Session.user.twoFactorEnabled);

const client = createAuthClient({ baseURL: "http://localhost:5173", plugins: [twoFactorClient(), adminClient({ ac, roles }), oauthProviderClient()] });
exists(client.twoFactor.enable, client.admin.setRole, client.oauth2.consent, client.signIn.social);
