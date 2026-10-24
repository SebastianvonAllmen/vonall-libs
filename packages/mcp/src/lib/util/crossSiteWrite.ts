/**
 * SvelteKit's CSRF check trusts every origin (the Product's vite.config.ts) because OAuth clients post form-encoded
 * token requests without an Origin header. This is the check instead, for everything but /api/auth/oauth2/*: a write
 * from another origin is refused, whatever its content type (remote functions, the MCP endpoint, forms), and so is a
 * form post without any Origin (a browser always sends one). Servers and CLI agents calling /api/mcp send no Origin
 * and pass.
 */
const CSRF_AUSNAHMEN = /^\/api\/auth\/oauth2\//;
const FORM_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];

export function crossSiteWrite(request: Request, url: URL): boolean {
	if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method) || CSRF_AUSNAHMEN.test(url.pathname)) return false;
	const origin = request.headers.get("origin");
	if (origin) return origin !== url.origin;
	const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
	return FORM_TYPES.includes(type);
}
