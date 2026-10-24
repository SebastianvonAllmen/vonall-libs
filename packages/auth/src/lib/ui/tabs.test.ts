import { beforeAll, describe, expect, it } from "vitest";
import { Star } from "@lucide/svelte";
import { configureAuthMessages } from "#lib/messages.js";
import { visibleTabs, type SettingsTabDef } from "./tabs";

const tab = (id: string, after?: string): SettingsTabDef => ({ id, label: id, hint: "", icon: Star, after });
const ids = (tabs: SettingsTabDef[]) => tabs.map((t) => t.id);

describe("visibleTabs", () => {
	beforeAll(() => configureAuthMessages({ locale: "en-GB" }));

	it("shows Invitations only to someone who may invite, and only when the Product shows the tab", () => {
		expect(ids(visibleTabs(true))).toEqual(["profile", "security", "sessions", "links", "invitations", "deletion"]);
		expect(ids(visibleTabs(false))).toEqual(["profile", "security", "sessions", "links", "deletion"]);
		expect(ids(visibleTabs(true, [], false))).not.toContain("invitations");
	});

	it("appends a Product's tabs before deletion, or after the tab they name", () => {
		expect(ids(visibleTabs(false, [tab("agents")]))).toEqual(["profile", "security", "sessions", "links", "agents", "deletion"]);
		expect(ids(visibleTabs(false, [tab("training", "profile"), tab("agents")]))).toEqual(["profile", "training", "security", "sessions", "links", "agents", "deletion"]);
	});

	it("keeps the order of tabs naming the same one, and appends a tab whose anchor is missing", () => {
		expect(ids(visibleTabs(false, [tab("a", "profile"), tab("b", "profile"), tab("c", "invitations")]))).toEqual(["profile", "a", "b", "security", "sessions", "links", "c", "deletion"]);
	});
});
