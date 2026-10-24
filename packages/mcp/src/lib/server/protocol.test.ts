import { describe, expect, it } from "vitest";
import { z } from "zod";
import { configureMcpMessages } from "#lib/messages.js";
import { handleMessage, prompt, scopeLines, tool, type Prompt, type Tool, type ToolContext } from "./protocol";

type Antwort = {
	result?: {
		tools?: { name: string; inputSchema: object }[];
		prompts?: { name: string }[];
		messages?: { role: string; content: { text: string } }[];
		content?: { text: string }[];
		isError?: boolean;
		protocolVersion?: string;
		capabilities?: Record<string, object>;
	};
	error?: { code: number };
};

const SERVER = { name: "Test", version: "1.0.0", instructions: "Act as the user." };
const TOOLS: Tool[] = [
	tool({
		name: "echo",
		description: "Echoes the text.",
		input: z.object({ text: z.string().min(1) }),
		scope: { en: "echo your text", de: "deinen Text zurückgeben" },
		run: async (ctx, input) => ({ ok: true, data: { userId: ctx.userId, text: input.text } }),
	}),
	tool({ name: "fail", description: "Always fails.", input: z.object({}), run: async () => ({ ok: false, message: "Nope" }) }),
];
const PROMPTS: Prompt[] = [
	prompt({
		name: "start",
		title: "Start",
		description: "Starts.",
		arguments: [{ name: "date", description: "A date", required: true }],
		text: (args) => `Start with ${args.date}.`,
	}),
];

const CTX: ToolContext = { userId: "user-1", clientId: "claude", locale: "en-GB", role: null };
const send = (message: object, prompts: Prompt[] = []) => handleMessage(message, CTX, TOOLS, SERVER, prompts) as Promise<Antwort>;

describe("handleMessage", () => {
	it("initializes with the requested protocol version, else the newest, and says what it offers", async () => {
		const known = await send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
		expect(known.result?.protocolVersion).toBe("2025-06-18");
		expect(known.result?.capabilities).not.toHaveProperty("prompts");
		const unknown = await send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } }, PROMPTS);
		expect(unknown.result?.protocolVersion).toBe("2025-11-25");
		expect(unknown.result?.capabilities).toHaveProperty("prompts");
	});

	it("lists the tools with JSON schemas and runs one as the user", async () => {
		const list = await send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
		expect(list.result!.tools!.map((t) => t.name)).toEqual(["echo", "fail"]);
		expect(list.result!.tools![0].inputSchema).toMatchObject({ type: "object" });
		const call = await send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "echo", arguments: { text: "hi" } } });
		expect(JSON.parse(call.result!.content![0].text)).toEqual({ userId: "user-1", text: "hi" });
	});

	it("returns readable errors instead of failing, in the configured language", async () => {
		configureMcpMessages({ locale: "de" });
		const falsch = await send({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "echo", arguments: { text: "" } } });
		expect(falsch.result?.isError).toBe(true);
		expect(falsch.result?.content?.[0].text).toMatch(/^Ungültige Eingabe/);
		configureMcpMessages({ locale: "en" });
		const nope = await send({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "fail" } });
		expect(nope.result).toMatchObject({ isError: true, content: [{ text: "Nope" }] });
		const unknown = await send({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "no_such_tool" } });
		expect(unknown.error?.code).toBe(-32602);
	});

	it("offers prompts and fills their arguments", async () => {
		const list = await send({ jsonrpc: "2.0", id: 7, method: "prompts/list" }, PROMPTS);
		expect(list.result!.prompts!.map((p) => p.name)).toEqual(["start"]);
		const got = await send({ jsonrpc: "2.0", id: 8, method: "prompts/get", params: { name: "start", arguments: { date: "2026-10-12" } } }, PROMPTS);
		expect(got.result!.messages![0]).toMatchObject({ role: "user", content: { text: "Start with 2026-10-12." } });
		const missing = await send({ jsonrpc: "2.0", id: 9, method: "prompts/get", params: { name: "start" } }, PROMPTS);
		expect(missing.error?.code).toBe(-32602);
	});

	it("answers notifications with nothing, bad messages and unknown methods with JSON-RPC errors", async () => {
		expect(await send({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
		expect((await send({ hello: "world" })).error?.code).toBe(-32600);
		expect((await send({ jsonrpc: "2.0", id: 9, method: "resources/list" })).error?.code).toBe(-32601);
		expect((await send({ jsonrpc: "2.0", id: 10, method: "ping" })).result).toEqual({});
	});
});

describe("scopeLines", () => {
	it("lists the tools' consent lines in the app's language, once each", () => {
		expect(scopeLines(TOOLS, "de-CH")).toEqual(["deinen Text zurückgeben"]);
		expect(scopeLines([...TOOLS, ...TOOLS], "en-GB")).toEqual(["echo your text"]);
	});
});
