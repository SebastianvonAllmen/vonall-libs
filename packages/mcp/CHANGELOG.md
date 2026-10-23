# @vonall/mcp

## 0.1.2

### Patch Changes

- `createMcp()` reads the auth instance on the first request, not at module load, so the Product's auth wiring and the endpoint may import each other.

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @vonall/auth@0.3.0

## 0.1.0

### Minor Changes

- The first release: the MCP protocol with tools and prompts (IronPact's), `createMcp()` for the endpoint and the OAuth hooks handle, `mcpPluginOptions`/`CIMD_OPTIONS`/`MCP_RATE_LIMIT_RULES` for the better-auth instance, `mcpClientPlugins()`, `consentLoad`, the `ConsentPage` and `AgentsTab` components, the Agents service over `@vonall/auth`'s tables, `mcpTester()` for a Product's tests; strings in English and German.
