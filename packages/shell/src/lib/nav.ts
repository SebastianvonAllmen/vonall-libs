import { resolve } from "$app/paths";
import type { Component } from "svelte";

/**
 * One page behind login, as a Product lists them in its `nav.ts`: the sidebar, the mobile tab bar and the breadcrumbs
 * all read that list. `admin`: only admins see it (the sidebar groups it under Administration); `sidebar: false`: not
 * in the sidebar (Settings is in the account menu there); `mobile: true`: a tab of the mobile bar (once one item has
 * it, only those are tabs; the rest is reached through `AppShell`'s `moreItem`).
 */
export type NavItem = {
	id: string;
	label: string;
	href: string;
	icon: Component<{ size?: number | string; strokeWidth?: number | string; class?: string }>;
	admin?: boolean;
	sidebar?: boolean;
	mobile?: boolean;
};

/** The item a path belongs to: the one with the longest matching href. */
export function activeNavItem(items: readonly NavItem[], path: string): NavItem | undefined {
	return [...items].filter((item) => path === item.href || path.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * The tabs of the mobile bar: the items the user may see (the admin's only for the admin); once one item has
 * `mobile: true`, only those (an item with `mobile: false` is never a tab); `moreItem` last whenever given.
 */
export function mobileTabs(items: readonly NavItem[], user: { role?: string | null }, moreItem?: NavItem): NavItem[] {
	const visible = items.filter((item) => !item.admin || user.role === "admin");
	const flagged = items.some((item) => item.mobile === true);
	const tabs = visible.filter((item) => (flagged ? item.mobile === true : item.mobile !== false));
	return moreItem ? [...tabs, moreItem] : tabs;
}

/**
 * The id of the tab a path highlights: the page's own tab; `moreItem` when the page has none (or no item matches);
 * without `moreItem` the first tab, else `home`.
 */
export function activeTab(items: readonly NavItem[], tabs: readonly NavItem[], path: string, moreItem?: NavItem): string {
	const active = activeNavItem(moreItem ? [...items, moreItem] : items, path);
	if (active && tabs.some((tab) => tab.id === active.id)) return active.id;
	return moreItem?.id ?? tabs[0]?.id ?? "home";
}

/**
 * The id of the sidebar entry a path highlights: the page's own item. `moreItem` (the More page, not in the sidebar)
 * takes part in the match so that its page highlights nothing instead of the item whose href is its prefix.
 */
export function activeSidebarId(items: readonly NavItem[], moreItem: NavItem | undefined, path: string): string | undefined {
	const active = activeNavItem(moreItem ? [...items, moreItem] : items, path);
	return active && items.some((item) => item.id === active.id) ? active.id : undefined;
}

/** The breadcrumb label of one path segment: the Product's own label, else the page's name. */
export function crumbLabel(items: readonly NavItem[], labels: Record<string, string>, segment: string): string | undefined {
	return labels[segment] ?? items.find((item) => item.href.split("/").pop() === segment)?.label;
}

/** A readable label for a segment nobody named ("manage_user" → "Manage User"). */
export const humanize = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** The breadcrumbs of a path; `fallback` names the segments nobody labelled before `humanize` does (an id as "…"). */
export function crumbs(
	items: readonly NavItem[],
	labels: Record<string, string>,
	pathname: string,
	fallback?: (segment: string) => string | undefined,
): { href: string; label: string }[] {
	const segments = pathname.split("/").filter((seg) => seg.length > 0);
	return segments.map((seg, i) => ({
		href: "/" + segments.slice(0, i + 1).join("/"),
		label: crumbLabel(items, labels, seg) ?? fallback?.(seg) ?? humanize(seg),
	}));
}

/** A link to one of the Product's paths, with SvelteKit's base path (this package has no route ids to type `resolve` against). */
export function href(path: string): string {
	return (resolve as unknown as (pathname: string) => string)(path);
}
