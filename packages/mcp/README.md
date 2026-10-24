# @vonall/mcp

The MCP endpoint of a Web App Factory Product: AI assistants (the Factory's GLOSSARY "Agent") reach the app over
Streamable HTTP with JSON responses, authorised with OAuth 2.1 through better-auth (`@better-auth/mcp`), and act as
the user through the Product's tools. Tools and prompts are the Product's; this package is the protocol, the OAuth
pieces, the consent page and the Agents tab. It builds on `@vonall/auth`, a peer dependency: one copy per app.

```ts
// src/lib/auth.ts: the OAuth provider on the Product's better-auth instance
import { MCP_RATE_LIMIT_RULES, mcpPlugins } from "@vonall/mcp/server";
const wiring = createAuth({ …, rateLimitRules: MCP_RATE_LIMIT_RULES });
betterAuth({ ...wiring.options, plugins: […, ...mcpPlugins(ORIGIN), …] });
// src/lib/auth-client.ts         plugins: […, ...mcpClientPlugins()]            (from "@vonall/mcp/client")

// src/lib/server/mcp.ts: the endpoint with the Product's tools, over the auth wiring's context
import { createMcp, tool } from "@vonall/mcp/server";
export const mcp = createMcp({ auth: ctx, tools: [tool({ name, description, input: z.object({…}), scope: { en: "read your entries", de: "deine Einträge lesen" }, run: async (ctx, input) => ({ ok: true, data }) })], prompts, serverInfo: { name: APP_NAME, version: "1.0.0", instructions } });
//   prompts: Prompt[], or async (ctx) => Prompt[] for prompts that depend on the caller (asked on every prompts/* request)
//   admit: async (ctx) => ({ ok: true }) | ({ ok: false, reason }): who may use an assistant at all (everyone by default)
// src/routes/api/mcp/+server.ts   export const { POST, GET, DELETE } = mcp;
// src/hooks.server.ts             sequence(securityHeaders, mcp.oauth, sessionHandle)
// src/routes/auth/consent         export { consentLoad as load } from "@vonall/mcp/server";  <ConsentPage {data} {authClient} />   (lists the tools' scope lines)
//                                 snippets: scopes (replaces the scope list), children (below it), notice (after the consent note), refusalNote (under the reason of a refused user)
// Settings → AI assistants        extraTabs={[agentsTab()]} and <AgentsTab /> for that id   (from "@vonall/mcp/ui")
```

- Every call also checks that the user's consent still exists (`agentRepo(ctx).hasAccess`), so revoking an assistant in the
  Agents tab takes effect at once.
- `mcp.oauth` answers the `/.well-known/oauth-*` discovery documents and refuses cross-site writes: SvelteKit's own
  CSRF check must trust every origin (`csrf: { trustedOrigins: ["*"] }` in the Product's `vite.config.ts`) because
  OAuth clients post form-encoded token requests without an Origin header; `crossSiteWrite` is the check instead.
- `BETTER_AUTH_SECRET` also protects the signing keys in `jwks`.
- `admit(ctx)` is asked on every call, after the token and consent checks: `{ ok: false, reason }` answers HTTP 403 with
  the JSON-RPC error `-32001` and the reason. `consentLoad` asks it for the logged-in user too (`data.admission`), and
  `ConsentPage` then shows the reason, `refusalNote` and one "Back to the assistant" button (it answers deny) instead
  of "Allow"/"Deny". Without the option everyone is admitted.
- `prompts` may be a function of the tool context (e.g. by role): the prompts capability is advertised whenever a function
  is given or the list is not empty; `prompts/list` and `prompts/get` ask the function per request.
- A tool's `run(ctx, input)` gets `{ userId, clientId, locale, role }`: whose data, which assistant, the language for
  anything a person reads, and the role (the Admin option) for an admin-only tool.
- `@vonall/mcp/testing`: `mcpTester(mcp)` over the Product's registration, for the db test of its tools: `send`, `call`
  and `admit(userId)`; a refused user gets the endpoint's error from `send` and `call`.
- `agentRepo(ctx)`: `listConnected`, `hasAccess(userId, clientId)`, `hasAny(userId)`, `revoke`.
- `MCP_PATH` (`/api/mcp`) is the one place the endpoint's path is written.
- Strings in English and German: `configureMcpMessages({ locale, overrides })`. The components ship their own copies of
  the shadcn-svelte button and card; the Product's `app.css` adds `@source "../node_modules/@vonall/mcp/dist"`.

Connecting an assistant: Claude Code locally with `claude mcp add --transport http <slug> http://localhost:5173/api/mcp`;
web clients need the public HTTPS address. The Agents tab lists the steps per client.
