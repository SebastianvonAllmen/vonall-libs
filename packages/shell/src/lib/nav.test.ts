import { describe, expect, it } from "vitest";
import type { Component } from "svelte";
import { activeNavItem, activeTab, crumbLabel, crumbs, mobileTabs, type NavItem } from "./nav";

const icon = (() => {}) as unknown as NavItem["icon"];
const ITEMS: NavItem[] = [
	{ id: "home", label: "Home", href: "/home", icon },
	{ id: "manage_user", label: "Users", href: "/home/manage_user", icon, admin: true },
	{ id: "settings", label: "Settings", href: "/home/settings", icon, sidebar: false },
];
const LABELS = { entries: "Entries" };
const ADMIN = { role: "admin" };
const USER = { role: "user" };

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

	it("asks the fallback for a segment nobody labelled, before humanizing it", () => {
		const fallback = (seg: string) => (/^[0-9a-f]{8}-/.test(seg) ? "…" : undefined);
		expect(crumbs(ITEMS, LABELS, "/home/entries/0f3befa1-1234/some_thing", fallback).map((c) => c.label)).toEqual(["Home", "Entries", "…", "Some Thing"]);
	});
});

describe("mobile tabs", () => {
	const ids = (tabs: NavItem[]) => tabs.map((tab) => tab.id);
	const MORE: NavItem = { id: "more", label: "More", href: "/home/more", icon };

	it("shows every item the user may see when no item has a mobile flag (today's behaviour)", () => {
		expect(ids(mobileTabs(ITEMS, USER))).toEqual(["home", "settings"]);
		expect(ids(mobileTabs(ITEMS, ADMIN))).toEqual(["home", "manage_user", "settings"]);
		expect(ids(mobileTabs(ITEMS, {}))).toEqual(["home", "settings"]);
	});

	it("shows only the flagged items once one has mobile: true, the admin's only for the admin", () => {
		const flagged: NavItem[] = [
			{ ...ITEMS[0], mobile: true },
			{ id: "plan", label: "Plan", href: "/home/plan", icon },
			{ ...ITEMS[1], mobile: true },
			ITEMS[2],
		];
		expect(ids(mobileTabs(flagged, USER))).toEqual(["home"]);
		expect(ids(mobileTabs(flagged, ADMIN))).toEqual(["home", "manage_user"]);
	});

	it("never shows an item with mobile: false, and appends the more item last", () => {
		const items: NavItem[] = [ITEMS[0], { ...ITEMS[2], mobile: false }];
		expect(ids(mobileTabs(items, USER))).toEqual(["home"]);
		expect(ids(mobileTabs(items, USER, MORE))).toEqual(["home", "more"]);
	});

	it("highlights the page's tab, else the more item, else the first tab", () => {
		const items: NavItem[] = [{ ...ITEMS[0], mobile: true }, { id: "plan", label: "Plan", href: "/home/plan", icon, mobile: true }, ITEMS[2]];
		const tabs = mobileTabs(items, USER, MORE);
		expect(activeTab(items, tabs, "/home/plan/week", MORE)).toBe("plan");
		expect(activeTab(items, tabs, "/home/settings", MORE)).toBe("more");
		expect(activeTab(items, tabs, "/home/more", MORE)).toBe("more");
		expect(activeTab(items, tabs, "/elsewhere", MORE)).toBe("more");
		const withoutMore = mobileTabs(items, USER);
		expect(activeTab(items, withoutMore, "/home/settings")).toBe("home");
		expect(activeTab(items, withoutMore, "/elsewhere")).toBe("home");
		expect(activeTab(ITEMS, [], "/elsewhere")).toBe("home");
	});
});

// The icon type accepts a Svelte component
const _check: Component = icon as Component;
void _check;
