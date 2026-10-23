<script lang="ts">
	import type { Snippet } from "svelte";
	import { ArrowLeft } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { authPageData, authUi } from "#lib/ui/context.js";
	import DeletionTab from "#lib/ui/DeletionTab.svelte";
	import InvitationsTab from "#lib/ui/InvitationsTab.svelte";
	import LinksTab from "#lib/ui/LinksTab.svelte";
	import MobileSettingsMenu from "#lib/ui/MobileSettingsMenu.svelte";
	import ProfileManagementTab from "#lib/ui/ProfileManagementTab.svelte";
	import SecurityTab from "#lib/ui/SecurityTab.svelte";
	import SessionsTab from "#lib/ui/SessionsTab.svelte";
	import SettingsHeader from "#lib/ui/SettingsHeader.svelte";
	import SettingsTabsList from "#lib/ui/SettingsTabsList.svelte";
	import { visibleTabs, type SettingsTabDef } from "#lib/ui/tabs.js";

	/**
	 * The settings page (`homeLayoutLoad` gives `user`, `session`, `providers` and `einladen` in the page data): on
	 * desktop a tab bar, on mobile a menu and one tab at a time, `?tab=` either way. A Product adds its own tabs with
	 * `extraTabs` (their definitions) and `extra` (their content, given the tab id), e.g. the AI assistants of `@vonall/mcp`;
	 * `profile` renders below the name and email form, for the Product's own fields of a person.
	 */
	let { extraTabs = [], extra, profile }: { extraTabs?: SettingsTabDef[]; extra?: Snippet<[string]>; profile?: Snippet } = $props();
	const { appName, locale } = authUi();

	const { user, einladen } = $derived(authPageData("user", "einladen"));
	// Only the tabs this user sees: ?tab=invitations without the right to invite falls back to the profile
	const tabs = $derived(visibleTabs(einladen, extraTabs));
	const ids = $derived(tabs.map((t) => t.id));
	const isTab = (value: string | null): value is string => value !== null && ids.includes(value);

	let activeTab = $state("profile");

	$effect(() => {
		const tab = page.url.searchParams.get("tab");
		activeTab = isTab(tab) ? tab : "profile";
	});

	const hasTabParam = $derived(isTab(page.url.searchParams.get("tab")));
	const activeTabTitle = $derived(tabs.find((t) => t.id === page.url.searchParams.get("tab"))?.label ?? "");

	function selectTab(tabName: string) {
		const url = new URL(page.url.href);
		if (tabName) url.searchParams.set("tab", tabName);
		else url.searchParams.delete("tab");
		goto(`${page.url.pathname}${url.search}`); // wherever the Product mounted this page
	}

	const memberSince = $derived(user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale, { year: "numeric", month: "long" }) : "");
</script>

<svelte:head><title>{m().settingsTitle} · {appName}</title></svelte:head>

<!-- One Tabs.Root for both layouts, so the tab contents (and their remote forms) mount exactly once -->
<Tabs.Root bind:value={activeTab} class="w-full">
	<!-- Desktop -->
	<div class="hidden w-full space-y-6 md:block">
		<SettingsHeader {user} />
		<SettingsTabsList {tabs} />
	</div>

	<!-- Mobile: a menu, then one tab at a time -->
	<div class="w-full space-y-4 md:hidden">
		{#if !hasTabParam}
			<MobileSettingsMenu {user} {memberSince} {tabs} onSelectTab={selectTab} />
		{:else}
			<div class="panel flex items-center gap-3 p-3">
				<button onclick={() => selectTab("")} class="rounded-full p-2 text-muted-foreground hover:bg-accent" aria-label={m().backToOverview}>
					<ArrowLeft size={18} />
				</button>
				<div>
					<span class="section-kicker">{m().settingsTitle}</span>
					<h2 class="text-base font-semibold">{activeTabTitle}</h2>
				</div>
			</div>
		{/if}
	</div>

	<div class={hasTabParam ? "mt-4 block w-full" : "mt-4 hidden w-full md:block"}>
		<ProfileManagementTab {user}>{@render profile?.()}</ProfileManagementTab>
		<SecurityTab />
		<!-- Only while open: listing the sessions needs a login from the last day, which only this tab should ask for -->
		{#if activeTab === "sessions"}<SessionsTab />{/if}
		<LinksTab />
		{#if einladen}<InvitationsTab />{/if}
		{#each extraTabs as tab (tab.id)}
			<Tabs.Content value={tab.id} class="panel mt-6 p-6 md:p-8">{@render extra?.(tab.id)}</Tabs.Content>
		{/each}
		<DeletionTab notes={extraTabs.map((t) => t.deletionNote).filter((n): n is string => Boolean(n))} />
	</div>
</Tabs.Root>
