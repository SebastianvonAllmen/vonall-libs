<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Avatar from "#lib/components/ui/avatar/index.js";
	import { m } from "#lib/messages.js";
	import { href } from "#lib/nav.js";
	import { displayInitials, displayName as defaultDisplayName } from "#lib/shell/names.js";
	import type { ShellUser } from "./AppShell.svelte";
	import ModeToggle from "./ModeToggle.svelte";

	/** The mobile header: the brand (the app name linking home), the Product's widgets, the theme toggle, the avatar. */
	let {
		user,
		appName,
		themeToggle = true,
		displayName = defaultDisplayName,
		brand,
		actions,
	}: {
		user: ShellUser;
		appName: string;
		themeToggle?: boolean;
		displayName?: (user: ShellUser) => string;
		brand?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<!-- Mobile header: hidden on desktop, where the sidebar takes over -->
<header
	class="sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background/85 px-4 pb-3 backdrop-blur md:hidden print:hidden"
	style="padding-top: calc(0.75rem + env(safe-area-inset-top));"
>
	{#if brand}
		{@render brand()}
	{:else}
		<a href={href("/home")} class="text-lg font-semibold tracking-tight">{appName}</a>
	{/if}
	<div class="flex items-center gap-1">
		{@render actions?.()}
		{#if themeToggle}<ModeToggle />{/if}
		<a href={href("/home/settings")} class="rounded-full" aria-label={m().openSettings}>
			<Avatar.Root class="size-9">
				{#if user.image}<Avatar.Image src={user.image} alt="" />{/if}
				<Avatar.Fallback class="bg-primary/10 text-sm font-semibold text-primary">{displayInitials(user, displayName(user))}</Avatar.Fallback>
			</Avatar.Root>
		</a>
	</div>
</header>
