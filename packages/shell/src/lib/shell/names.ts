/** How the shell shows a user (the same rules as `@vonall/auth`, repeated here so the shell needs nothing of it). */
export function displayName(user: { name?: string | null; email: string } | null | undefined): string {
	if (!user) return "";
	return user.name?.trim() || user.email;
}

/** The initials of the name the shell shows (`displayName`, or the Product's), else the email's first letter. */
export function displayInitials(user: { name?: string | null; email: string }, name: string = user.name ?? ""): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length > 0 && name.trim() !== user.email) return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
	return user.email.charAt(0).toUpperCase() || "?";
}
