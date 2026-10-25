export function displayName(user: { name?: string | null; email: string } | null | undefined): string {
	if (!user) return "";
	return user.name?.trim() || user.email;
}

/** The initials of the name shown (`user.name`, or the Product's `displayName`), else the email's first letter. */
export function displayInitials(user: { name?: string | null; email: string }, name: string = user.name ?? ""): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length > 0 && name.trim() !== user.email) return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
	return user.email.charAt(0).toUpperCase() || "?";
}

/** A readable name from an email address ("lena.meier@…" → "Lena Meier"), for accounts created without one. */
export function nameFromEmail(email: string): string {
	const local = email.split("@")[0] ?? "";
	const words = local.split(/[._\-+]+/).filter(Boolean);
	if (words.length === 0) return email;
	return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
