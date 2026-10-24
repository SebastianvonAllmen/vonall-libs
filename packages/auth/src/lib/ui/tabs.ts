import { Link as LinkIcon, Monitor, Shield, Trash2, User, UserPlus } from "@lucide/svelte";
import type { Component } from "svelte";
import { m } from "#lib/messages.js";

/** One settings tab: the desktop tab bar and the mobile menu are built from the list. */
export type SettingsTabDef = {
	id: string;
	label: string;
	hint: string;
	icon: Component<{ size?: number | string; class?: string }>;
	/** One sentence the deletion tab adds about what goes with the account, e.g. connected assistants. */
	deletionNote?: string;
};

/** This package's tabs, in order, in the configured language; a Product adds its own (e.g. the AI assistants) through `SettingsPage`. */
export function settingsTabs(): SettingsTabDef[] {
	const t = m();
	return [
		{ id: "profile", label: t.tabProfile, hint: t.tabProfileHint, icon: User },
		{ id: "security", label: t.tabSecurity, hint: t.tabSecurityHint, icon: Shield },
		{ id: "sessions", label: t.tabSessions, hint: t.tabSessionsHint, icon: Monitor },
		{ id: "links", label: t.tabLinks, hint: t.tabLinksHint, icon: LinkIcon },
		{ id: "invitations", label: t.tabInvitations, hint: t.tabInvitationsHint, icon: UserPlus },
	];
}

/** The deletion tab comes last, after a Product's own. */
export function deletionTab(): SettingsTabDef {
	return { id: "deletion", label: m().tabDeletion, hint: m().tabDeletionHint, icon: Trash2 };
}

/** The tabs this user sees: Invitations only when the signup mode lets them invite (`einladen` in the page data). */
export function visibleTabs(einladen: boolean, extra: SettingsTabDef[] = []): SettingsTabDef[] {
	return [...settingsTabs().filter((tab) => tab.id !== "invitations" || einladen), ...extra, deletionTab()];
}
