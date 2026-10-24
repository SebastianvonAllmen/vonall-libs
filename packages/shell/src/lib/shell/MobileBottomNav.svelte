<script lang="ts">
	import { page } from "$app/state";
	import { m } from "#lib/messages.js";
	import { activeNavItem, href, type NavItem } from "#lib/nav.js";
	import type { ShellUser } from "./AppShell.svelte";

	/** The mobile tabs; the admin's pages only for the admin. */
	let { user, navItems }: { user: ShellUser; navItems: readonly NavItem[] } = $props();

	const tabs = $derived(navItems.filter((item) => !item.admin || user.role === "admin"));
	const activeTab = $derived(activeNavItem(navItems, page.url.pathname)?.id ?? "home");
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 grid border-t bg-background/90 backdrop-blur"
	style="grid-template-columns: repeat({tabs.length}, 1fr); padding-bottom: env(safe-area-inset-bottom);"
	aria-label={m().mainNavigation}
>
	{#each tabs as tab (tab.id)}
		{@const active = activeTab === tab.id}
		<a
			href={href(tab.href)}
			class="flex flex-col items-center gap-1 py-2.5 text-[11px] {active ? 'text-primary' : 'text-muted-foreground'}"
			aria-current={active ? "page" : undefined}
		>
			<tab.icon size={22} strokeWidth={active ? 2.4 : 1.9} />
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>
