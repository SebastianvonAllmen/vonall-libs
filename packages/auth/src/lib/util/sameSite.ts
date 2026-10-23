/**
 * The path of `ziel` if it stays on `origin`, else null. Browsers read "/\\evil.com" or "/\t/evil.com" as another host,
 * so the target is resolved against the origin instead of checking its first characters.
 */
export function sameSitePath(ziel: string | null, origin: string): string | null {
	if (!ziel || !ziel.startsWith("/")) return null;
	try {
		const url = new URL(ziel, origin);
		return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : null;
	} catch {
		return null;
	}
}
