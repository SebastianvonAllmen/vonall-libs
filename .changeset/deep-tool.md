---
"@vonall/mcp": minor
---

A deeper `Tool`: `run(ctx, input)` with `ctx: { userId, clientId, locale, role }`; an optional `scope: { en, de }` per tool, which the consent page lists (`consentLoad` adds `toolScopes`; the Product's children stay possible). `createMcp()` returns the registration (`tools`, `prompts`, `serverInfo`, `ctx`, `toolContext`), which `mcp.oauth` puts into `event.locals.mcp` and `mcpTester(mcp)` takes. `MCP_PATH` is the one place the endpoint's path is written.
