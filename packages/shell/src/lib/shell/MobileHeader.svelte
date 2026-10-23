<script lang="ts">
	import * as Avatar from "#lib/components/ui/avatar/index.js";
	import { m } from "#lib/messages.js";
	import { href } from "#lib/nav.js";
	import { displayInitials } from "#lib/shell/names.js";
	import type { ShellUser } from "./AppShell.svelte";
	import ModeToggle from "./ModeToggle.svelte";

	let { user, appName }: { user: ShellUser; appName: string } = $props();
</script>

<!-- Mobile header: hidden on desktop, where the sidebar takes over -->
<header
	class="sticky top-0 z-40 flex items-center justify-between border-b bg-background/85 px-4 pb-3 backdrop-blur md:hidden"
	style="padding-top: calc(0.75rem + env(safe-area-inset-top));"
>
	<a href={href("/home")} class="text-lg font-semibold tracking-tight">{appName}</a>
	<div class="flex items-center gap-1">
		<ModeToggle />
		<a href={href("/home/settings")} class="rounded-full" aria-label={m().openSettings}>
			<Avatar.Root class="size-9">
				{#if user.image}<Avatar.Image src={user.image} alt="" />{/if}
				<Avatar.Fallback class="bg-primary/10 text-sm font-semibold text-primary">{displayInitials(user)}</Avatar.Fallback>
			</Avatar.Root>
		</a>
	</div>
</header>
