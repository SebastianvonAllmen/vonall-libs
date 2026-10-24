// What both the browser and the server may import; the endpoint and the OAuth pieces are `@vonall/mcp/server`, the
// client plugin `@vonall/mcp/client`, the components `@vonall/mcp/ui`, the remote functions `@vonall/mcp/remote`.
export { configureMcpMessages, m, type McpMessages } from "#lib/messages.js";
export { handleMessage, PROTOCOL_VERSIONS, prompt, tool, type Prompt, type ServerInfo, type Tool, type ToolErgebnis } from "#lib/server/protocol.js";
export { crossSiteWrite } from "#lib/util/crossSiteWrite.js";
