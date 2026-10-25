<script lang="ts">
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import { m } from "#lib/messages.js";
	import { activeTab, href, mobileTabs, type NavItem } from "#lib/nav.js";
	import type { ShellUser } from "./AppShell.svelte";

	/**
	 * The mobile tabs (`mobileTabs`): the admin's pages only for the admin, `moreItem` last for the pages without a tab.
	 * `markup` renders them the Product's way instead.
	 */
	let {
		user,
		navItems,
		moreItem,
		markup,
	}: { user: ShellUser; navItems: readonly NavItem[]; moreItem?: NavItem; markup?: Snippet<[tabs: NavItem[], active: string]> } = $props();

	const tabs = $derived(mobileTabs(navItems, user, moreItem));
	const active = $derived(activeTab(navItems, tabs, page.url.pathname, moreItem));
</script>

{#if markup}
	{@render markup(tabs, active)}
{:else}
	<nav
		class="fixed inset-x-0 bottom-0 z-50 grid border-t bg-background/90 backdrop-blur"
		style="grid-template-columns: repeat({tabs.length}, 1fr); padding-bottom: env(safe-area-inset-bottom);"
		aria-label={m().mainNavigation}
	>
		{#each tabs as tab (tab.id)}
			{@const isActive = active === tab.id}
			<a
				href={href(tab.href)}
				class="flex flex-col items-center gap-1 py-2.5 text-[11px] {isActive ? 'text-primary' : 'text-muted-foreground'}"
				aria-current={isActive ? "page" : undefined}
			>
				<tab.icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
				<span class="max-w-full truncate px-1">{tab.label}</span>
			</a>
		{/each}
	</nav>
{/if}
