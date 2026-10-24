import { describe, expect, it } from "vitest";
import type { Component } from "svelte";
import { activeNavItem, crumbLabel, crumbs, type NavItem } from "./nav";

const icon = (() => {}) as unknown as NavItem["icon"];
const ITEMS: NavItem[] = [
	{ id: "home", label: "Home", href: "/home", icon },
	{ id: "manage_user", label: "Users", href: "/home/manage_user", icon, admin: true },
	{ id: "settings", label: "Settings", href: "/home/settings", icon, sidebar: false },
];
const LABELS = { entries: "Entries" };

describe("nav", () => {
	it("finds the page a path belongs to by its longest href", () => {
		expect(activeNavItem(ITEMS, "/home")?.id).toBe("home");
		expect(activeNavItem(ITEMS, "/home/settings")?.id).toBe("settings");
		expect(activeNavItem(ITEMS, "/home/somewhere/else")?.id).toBe("home");
		expect(activeNavItem(ITEMS, "/elsewhere")).toBeUndefined();
	});

	it("labels a breadcrumb by the Product's label, else by the page's, else readably", () => {
		expect(crumbLabel(ITEMS, LABELS, "entries")).toBe("Entries");
		expect(crumbLabel(ITEMS, LABELS, "settings")).toBe("Settings");
		expect(crumbLabel(ITEMS, LABELS, "unknown")).toBeUndefined();
		expect(crumbs(ITEMS, LABELS, "/home/entries/some_thing")).toEqual([
			{ href: "/home", label: "Home" },
			{ href: "/home/entries", label: "Entries" },
			{ href: "/home/entries/some_thing", label: "Some Thing" },
		]);
	});
});

// The icon type accepts a Svelte component
const _check: Component = icon as Component;
void _check;
