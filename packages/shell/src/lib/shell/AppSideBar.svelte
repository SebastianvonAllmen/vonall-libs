<script lang="ts">
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import { m } from "#lib/messages.js";
	import { activeNavItem, href, type NavItem } from "#lib/nav.js";
	import { displayName as defaultDisplayName } from "#lib/shell/names.js";
	import AppBrand from "./AppBrand.svelte";
	import type { ShellUser } from "./AppShell.svelte";
	import NavUser from "./NavUser.svelte";

	/** The desktop navigation: the main pages, and the admin's under Administration; the current page's button is active. */
	let {
		user,
		appName,
		navItems,
		signOut,
		themeToggle = true,
		displayName = defaultDisplayName,
		brand,
		footer,
		collapsible,
		class: className,
		...restProps
	}: {
		user: ShellUser;
		appName: string;
		navItems: readonly NavItem[];
		signOut: () => Promise<void>;
		themeToggle?: boolean;
		displayName?: (user: ShellUser) => string;
		/** The header, instead of `AppBrand`. */
		brand?: Snippet;
		/** Rendered in the footer above the account menu. */
		footer?: Snippet;
		collapsible?: "icon" | "none" | "offcanvas";
		class?: string;
	} = $props();

	const mainItems = $derived(navItems.filter((item) => !item.admin && item.sidebar !== false));
	const adminItems = $derived(navItems.filter((item) => item.admin));
	const activeId = $derived(activeNavItem(navItems, page.url.pathname)?.id);
</script>

{#snippet entry(item: NavItem)}
	<Sidebar.MenuItem>
		<Sidebar.MenuButton tooltipContent={item.label} isActive={activeId === item.id}>
			{#snippet child({ props })}
				<a href={href(item.href)} {...props}>
					<item.icon />
					<span>{item.label}</span>
				</a>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
{/snippet}

<Sidebar.Root {collapsible} class={className} {...restProps}>
	<Sidebar.Header>
		{#if brand}
			{@render brand()}
		{:else}
			<AppBrand {user} {appName} />
		{/if}
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent class="flex flex-col gap-2">
				<Sidebar.Menu>
					{#each mainItems as item (item.id)}
						{@render entry(item)}
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		{#if user.role === "admin" && adminItems.length > 0}
			<Sidebar.Group class="mt-auto">
				<Sidebar.GroupLabel>{m().administration}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each adminItems as item (item.id)}
							{@render entry(item)}
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		{@render footer?.()}
		<NavUser {user} {signOut} {themeToggle} {displayName} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
