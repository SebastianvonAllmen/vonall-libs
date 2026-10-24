<script lang="ts">
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import { m } from "#lib/messages.js";
	import { href, type NavItem } from "#lib/nav.js";
	import AppBrand from "./AppBrand.svelte";
	import type { ShellUser } from "./AppShell.svelte";
	import NavUser from "./NavUser.svelte";

	/** The desktop navigation: the main pages, and the admin's under Administration. */
	let {
		user,
		appName,
		navItems,
		signOut,
		collapsible,
		class: className,
		...restProps
	}: {
		user: ShellUser;
		appName: string;
		navItems: readonly NavItem[];
		signOut: () => Promise<void>;
		collapsible?: "icon" | "none" | "offcanvas";
		class?: string;
	} = $props();

	const mainItems = $derived(navItems.filter((item) => !item.admin && item.sidebar !== false));
	const adminItems = $derived(navItems.filter((item) => item.admin));
</script>

<Sidebar.Root {collapsible} class={className} {...restProps}>
	<Sidebar.Header>
		<AppBrand {user} {appName} />
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent class="flex flex-col gap-2">
				<Sidebar.Menu>
					{#each mainItems as item (item.id)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton tooltipContent={item.label}>
								{#snippet child({ props })}
									<a href={href(item.href)} {...props}>
										<item.icon />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
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
							<Sidebar.MenuItem>
								<Sidebar.MenuButton tooltipContent={item.label}>
									{#snippet child({ props })}
										<a href={href(item.href)} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser {user} {signOut} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
