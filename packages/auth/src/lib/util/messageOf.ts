/**
 * The message of a caught error, for showing it to the user. Remote functions reject with plain objects that carry a
 * `message`, so anything with a non-empty string `message` counts.
 */
export function messageOf(error: unknown, fallback: string): string {
	if (typeof error === "object" && error !== null && "message" in error) {
		const { message } = error;
		if (typeof message === "string" && message) return message;
	}
	return fallback;
}
