<script lang="ts">
	import { EllipsisVertical, LogOut, Moon, Settings as SettingsIcon, Sun } from "@lucide/svelte";
	import { toggleMode } from "mode-watcher";
	import * as Avatar from "#lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import { useSidebar } from "#lib/components/ui/sidebar/index.js";
	import { m } from "#lib/messages.js";
	import { href } from "#lib/nav.js";
	import { displayInitials, displayName as defaultDisplayName } from "#lib/shell/names.js";
	import type { ShellUser } from "./AppShell.svelte";

	const sidebar = useSidebar();
	const {
		user,
		signOut,
		themeToggle = true,
		displayName = defaultDisplayName,
	}: { user: ShellUser; signOut: () => Promise<void>; themeToggle?: boolean; displayName?: (user: ShellUser) => string } = $props();

	const name = $derived(displayName(user));
	const initials = $derived(displayInitials(user, name));
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} size="lg" class="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
						<Avatar.Root class="size-8 rounded-lg">
							{#if user.image}<Avatar.Image src={user.image} alt="" />{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{name}</span>
							<span class="truncate text-xs">{user.email ?? ""}</span>
						</div>
						<EllipsisVertical class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg" side={sidebar.isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{name}</span>
							<span class="truncate text-xs">{user.email ?? ""}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onSelect={() => (window.location.href = href("/home/settings"))} class="cursor-pointer">
						<SettingsIcon />
						{m().settings}
					</DropdownMenu.Item>
					{#if themeToggle}
						<DropdownMenu.Item onSelect={toggleMode} class="cursor-pointer">
							<Sun class="dark:hidden" />
							<Moon class="hidden dark:block" />
							{m().lightOrDark}
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="cursor-pointer" onSelect={() => void signOut()}>
					<LogOut />
					<span>{m().logOut}</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
