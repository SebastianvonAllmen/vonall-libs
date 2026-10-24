import { resolve } from "$app/paths";
import type { Component } from "svelte";

/**
 * One page behind login, as a Product lists them in its `nav.ts`: the sidebar, the mobile tab bar and the breadcrumbs
 * all read that list. `admin`: only admins see it (the sidebar groups it under Administration); `sidebar: false`: not
 * in the sidebar (Settings is in the account menu there).
 */
export type NavItem = {
	id: string;
	label: string;
	href: string;
	icon: Component<{ size?: number | string; strokeWidth?: number | string; class?: string }>;
	admin?: boolean;
	sidebar?: boolean;
};

/** The item a path belongs to: the one with the longest matching href. */
export function activeNavItem(items: readonly NavItem[], path: string): NavItem | undefined {
	return [...items].filter((item) => path === item.href || path.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
}

/** The breadcrumb label of one path segment: the Product's own label, else the page's name. */
export function crumbLabel(items: readonly NavItem[], labels: Record<string, string>, segment: string): string | undefined {
	return labels[segment] ?? items.find((item) => item.href.split("/").pop() === segment)?.label;
}

/** A readable label for a segment nobody named ("manage_user" → "Manage User"). */
export const humanize = (s: string) => s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** The breadcrumbs of a path. */
export function crumbs(items: readonly NavItem[], labels: Record<string, string>, pathname: string): { href: string; label: string }[] {
	const segments = pathname.split("/").filter((seg) => seg.length > 0);
	return segments.map((seg, i) => ({ href: "/" + segments.slice(0, i + 1).join("/"), label: crumbLabel(items, labels, seg) ?? humanize(seg) }));
}

/** A link to one of the Product's paths, with SvelteKit's base path (this package has no route ids to type `resolve` against). */
export function href(path: string): string {
	return (resolve as unknown as (pathname: string) => string)(path);
}
