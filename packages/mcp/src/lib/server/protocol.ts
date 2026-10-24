/**
 * A minimal, stateless MCP server (Streamable HTTP transport, JSON responses only): tools and prompts. The transport
 * layer (HTTP, OAuth) is `createMcp`; this module only maps JSON-RPC messages to tools and prompts.
 */
import { z } from "zod";
import { m } from "#lib/messages.js";

export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;

/** A tool's outcome: data for the assistant, or a message it should read and react to. */
export type ToolErgebnis = { ok: true; data: unknown } | { ok: false; message: string };

/** A tool: a thin wrapper around an application service, so an assistant is bound by the same rules as the UI. */
export type Tool<S extends z.ZodType = z.ZodType> = {
	name: string;
	description: string;
	input: S;
	run: (userId: string, input: z.output<S>) => Promise<ToolErgebnis>;
};

export const tool = <S extends z.ZodType>(t: Tool<S>): Tool => t as unknown as Tool;

/** A prompt the client offers the user (e.g. in Claude's "+" menu); it becomes the first user message. */
export type Prompt = {
	name: string;
	title: string;
	description: string;
	arguments: { name: string; description: string; required: boolean }[];
	text: (args: Record<string, string>) => string;
};

export const prompt = (p: Prompt): Prompt => p;

/** What the server says about itself in `initialize`. */
export type ServerInfo = { name: string; version: string; instructions: string };

type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const fehler = (id: JsonRpcRequest["id"], code: number, message: string) => ({
	jsonrpc: "2.0" as const,
	id: id ?? null,
	error: { code, message },
});

/** Answers one JSON-RPC message; `null` for notifications, which get no response. */
export async function handleMessage(message: unknown, userId: string, tools: Tool[], server: ServerInfo, prompts: Prompt[] = []): Promise<object | null> {
	const parsed = z
		.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number(), z.null()]).optional(), method: z.string(), params: z.record(z.string(), z.unknown()).optional() })
		.safeParse(message);
	if (!parsed.success) return fehler(null, -32600, "Invalid Request");
	const req = parsed.data as JsonRpcRequest;
	if (req.id === undefined) return null; // notification, e.g. notifications/initialized

	switch (req.method) {
		case "initialize": {
			const requested = String(req.params?.protocolVersion ?? "");
			const protocolVersion = (PROTOCOL_VERSIONS as readonly string[]).includes(requested) ? requested : PROTOCOL_VERSIONS[0];
			return {
				jsonrpc: "2.0",
				id: req.id,
				result: {
					protocolVersion,
					capabilities: { tools: { listChanged: false }, ...(prompts.length > 0 ? { prompts: { listChanged: false } } : {}) },
					serverInfo: { name: server.name, version: server.version },
					instructions: server.instructions,
				},
			};
		}
		case "ping":
			return { jsonrpc: "2.0", id: req.id, result: {} };
		case "tools/list":
			return {
				jsonrpc: "2.0",
				id: req.id,
				result: {
					tools: tools.map((t) => ({
						name: t.name,
						description: t.description,
						inputSchema: z.toJSONSchema(t.input, { io: "input" }),
					})),
				},
			};
		case "tools/call": {
			const t = tools.find((x) => x.name === req.params?.name);
			if (!t) return fehler(req.id, -32602, `Unknown tool: ${String(req.params?.name)}`);
			const input = t.input.safeParse(req.params?.arguments ?? {});
			if (!input.success) {
				return { jsonrpc: "2.0", id: req.id, result: { isError: true, content: [{ type: "text", text: `${m().invalidInput}: ${z.prettifyError(input.error)}` }] } };
			}
			const ergebnis = await t.run(userId, input.data);
			const result = ergebnis.ok
				? { content: [{ type: "text", text: JSON.stringify(ergebnis.data ?? { ok: true }, null, 2) }] }
				: { isError: true, content: [{ type: "text", text: ergebnis.message }] };
			return { jsonrpc: "2.0", id: req.id, result };
		}
		case "prompts/list":
			return {
				jsonrpc: "2.0",
				id: req.id,
				result: { prompts: prompts.map(({ name, title, description, arguments: args }) => ({ name, title, description, arguments: args })) },
			};
		case "prompts/get": {
			const p = prompts.find((x) => x.name === req.params?.name);
			if (!p) return fehler(req.id, -32602, `Unknown prompt: ${String(req.params?.name)}`);
			const args = z.record(z.string(), z.string()).catch({}).parse(req.params?.arguments ?? {});
			const fehlend = p.arguments.find((a) => a.required && !args[a.name]);
			if (fehlend) return fehler(req.id, -32602, `Missing argument: ${fehlend.name}`);
			return {
				jsonrpc: "2.0",
				id: req.id,
				result: { description: p.description, messages: [{ role: "user", content: { type: "text", text: p.text(args) } }] },
			};
		}
		default:
			return fehler(req.id, -32601, `Method not found: ${req.method}`);
	}
}
