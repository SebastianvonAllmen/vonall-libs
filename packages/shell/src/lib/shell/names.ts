/** How the shell shows a user (the same rules as `@vonall/auth`, repeated here so the shell needs nothing of it). */
export function displayName(user: { name?: string | null; email: string } | null | undefined): string {
	if (!user) return "";
	return user.name?.trim() || user.email;
}

export function displayInitials(user: { name?: string | null; email: string }): string {
	const words = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
	if (words.length > 0) return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
	return user.email.charAt(0).toUpperCase() || "?";
}
