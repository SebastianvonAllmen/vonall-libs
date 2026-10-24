import { describe, expect, it } from "vitest";
import { crossSiteWrite } from "./crossSiteWrite";

const url = new URL("https://app.example.ch/kontakt");
const req = (method: string, headers: Record<string, string>) => new Request(url, { method, headers });

describe("crossSiteWrite", () => {
	it("refuses a write from another origin, whatever its content type", () => {
		expect(crossSiteWrite(req("POST", { origin: "https://evil.example", "content-type": "application/x-www-form-urlencoded" }), url)).toBe(true);
		expect(crossSiteWrite(req("POST", { origin: "https://evil.example", "content-type": "application/json" }), url)).toBe(true);
		expect(crossSiteWrite(req("DELETE", { origin: "https://evil.example" }), url)).toBe(true);
	});
	it("refuses a form post without an Origin, allows other writes without one (servers, CLI agents)", () => {
		expect(crossSiteWrite(req("POST", { "content-type": "multipart/form-data; boundary=x" }), url)).toBe(true);
		expect(crossSiteWrite(req("POST", { "content-type": "application/json" }), new URL("https://app.example.ch/api/mcp"))).toBe(false);
	});
	it("allows the app's own origin, reads, and the OAuth endpoints", () => {
		expect(crossSiteWrite(req("POST", { origin: "https://app.example.ch", "content-type": "application/x-www-form-urlencoded" }), url)).toBe(false);
		expect(crossSiteWrite(req("GET", { origin: "https://evil.example" }), url)).toBe(false);
		const token = new URL("https://app.example.ch/api/auth/oauth2/token");
		expect(crossSiteWrite(new Request(token, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" } }), token)).toBe(false);
	});
});
