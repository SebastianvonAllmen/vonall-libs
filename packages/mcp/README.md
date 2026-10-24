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
export const mcp = createMcp({ auth: ctx, tools: [tool({ name, description, input: z.object({…}), run: async (userId, input) => ({ ok: true, data }) })], prompts, serverInfo: { name: APP_NAME, version: "1.0.0", instructions } });
// src/routes/api/mcp/+server.ts   export const { POST, GET, DELETE } = mcp;
// src/hooks.server.ts             sequence(securityHeaders, mcp.oauth, sessionHandle)
// src/routes/auth/consent         export { consentLoad as load } from "@vonall/mcp/server";  <ConsentPage {data} {authClient}>…</ConsentPage>
// Settings → AI assistants        extraTabs={[agentsTab()]} and <AgentsTab /> for that id   (from "@vonall/mcp/ui")
```

- Every call also checks that the user's consent still exists (`agentRepo(ctx).hasAccess`), so revoking an assistant in the
  Agents tab takes effect at once.
- `mcp.oauth` answers the `/.well-known/oauth-*` discovery documents and refuses cross-site writes: SvelteKit's own
  CSRF check must trust every origin (`csrf: { trustedOrigins: ["*"] }` in the Product's `vite.config.ts`) because
  OAuth clients post form-encoded token requests without an Origin header; `crossSiteWrite` is the check instead.
- `BETTER_AUTH_SECRET` also protects the signing keys in `jwks`.
- `@vonall/mcp/testing`: `mcpTester({ tools, prompts, serverInfo })` for the Product's db test of its tools.
- Strings in English and German: `configureMcpMessages({ locale, overrides })`. The components ship their own copies of
  the shadcn-svelte button and card; the Product's `app.css` adds `@source "../node_modules/@vonall/mcp/dist"`.

Connecting an assistant: Claude Code locally with `claude mcp add --transport http <slug> http://localhost:5173/api/mcp`;
web clients need the public HTTPS address. The Agents tab lists the steps per client.
