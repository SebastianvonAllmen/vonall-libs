/** For a Product's db test of its tools (`src/lib/server/mcp/mcp.db.test.ts`): calls through the protocol as an assistant would. */
import type { Mcp } from "#lib/server/endpoint.js";
import { handleMessage } from "#lib/server/protocol.js";

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

/** Over the Product's registration (`createMcp()`), so the tools, prompts and the tool context are the app's own. */
export function mcpTester(mcp: Mcp, clientId = "test-assistant") {
	const { tools, prompts, serverInfo } = mcp;
	/** What `createMcp({ admit })` says about the user, as the endpoint and the consent page ask it. */
	const admit = async (userId: string) => mcp.admit(await mcp.toolContext(userId, clientId));
	/** One JSON-RPC message as the user; the raw answer. A refused user (`admit`) gets the endpoint's error, as over HTTP. */
	const send = async (userId: string, message: object): Promise<McpAnswer | null> => {
		const ctx = await mcp.toolContext(userId, clientId);
		const admission = await mcp.admit(ctx);
		if (!admission.ok) return { error: { code: -32001, message: admission.reason } };
		return (await handleMessage(message, ctx, tools, serverInfo, prompts)) as McpAnswer | null;
	};
	/** A tool call as the user: `isError` and the parsed data (or the error text; a refused user gets the reason). */
	async function call(userId: string, name: string, args: object = {}) {
		const res = (await send(userId, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })) as McpAnswer;
		if (res.error) return { isError: true, data: res.error.message };
		const text = res.result?.content?.[0]?.text ?? "";
		return { isError: res.result?.isError ?? false, data: res.result?.isError ? text : JSON.parse(text) };
	}
	return { send, call, admit };
}
