<script lang="ts">
	import { LayoutDashboard } from "@lucide/svelte";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import { m } from "#lib/messages.js";
	import type { ShellUser } from "./AppShell.svelte";

	let { user, appName }: { user: ShellUser; appName: string } = $props();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<div class="flex items-center gap-3 px-2 py-1.5">
			<div class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<LayoutDashboard class="size-5" />
			</div>
			<div class="grid flex-1 text-left text-sm leading-tight">
				<span class="truncate font-semibold">{appName}</span>
				<span class="truncate text-xs text-muted-foreground">{user.name}</span>
				{#if user.role === "admin"}<span class="truncate text-xs text-muted-foreground">{m().administrator}</span>{/if}
			</div>
		</div>
	</Sidebar.MenuItem>
</Sidebar.Menu>
