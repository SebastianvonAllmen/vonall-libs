/** The columns every Einladung has (the token's hash is never read back); what else a row carries is a Product's own. */
export const EINLADUNG_COLUMNS = ["id", "tokenHash", "createdBy", "email", "expiresAt", "acceptedAt", "acceptedBy", "createdAt"] as const;

/** A Product's own columns of an Einladung row: everything but the package's columns (and the inviter's name). */
export function einladungExtras(row: Record<string, unknown>): Record<string, unknown> {
	const own = new Set<string>([...EINLADUNG_COLUMNS, "inviterName"]);
	return Object.fromEntries(Object.entries(row).filter(([key]) => !own.has(key)));
}
