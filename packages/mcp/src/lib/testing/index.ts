/** For a Product's db test of its tools (`src/lib/server/mcp/mcp.db.test.ts`): calls through the protocol as an assistant would. */
import { handleMessage, type Prompt, type ServerInfo, type Tool } from "#lib/server/protocol.js";

export type McpAnswer = {
	result?: {
		tools?: { name: string; inputSchema: object }[];
		prompts?: { name: string }[];
		messages?: { role: string; content: { text: string } }[];
		content?: { text: string }[];
		isError?: boolean;
		protocolVersion?: string;
		capabilities?: Record<string, object>;
	};
	error?: { code: number; message: string };
};

export function mcpTester({ tools, prompts = [], serverInfo }: { tools: Tool[]; prompts?: Prompt[]; serverInfo: ServerInfo }) {
	/** One JSON-RPC message as the user; the raw answer. */
	const send = (userId: string, message: object) => handleMessage(message, userId, tools, serverInfo, prompts) as Promise<McpAnswer | null>;
	/** A tool call as the user: `isError` and the parsed data (or the error text). */
	async function call(userId: string, name: string, args: object = {}) {
		const res = (await send(userId, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })) as McpAnswer;
		const text = res.result?.content?.[0]?.text ?? "";
		return { isError: res.result?.isError ?? false, data: res.result?.isError ? text : JSON.parse(text) };
	}
	return { send, call };
}
