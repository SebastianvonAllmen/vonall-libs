<script lang="ts">
	import * as Avatar from "#lib/components/ui/avatar/index.js";
	import { m } from "#lib/messages.js";
	import type { AppUserClient } from "#lib/types.js";
	import { displayInitials, displayName } from "#lib/util/names.js";

	let { user }: { user: AppUserClient | null | undefined } = $props();
</script>

<div class="flex items-center gap-6">
	<Avatar.Root class="size-20 rounded-full border-2 border-muted">
		{#if user?.image}<Avatar.Image src={user.image} alt="" />{/if}
		<Avatar.Fallback class="text-2xl">{user ? displayInitials(user) : "?"}</Avatar.Fallback>
	</Avatar.Root>
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">{user ? displayName(user) : m().user}</h1>
		<p class="text-muted-foreground">{user?.email || ""}</p>
	</div>
</div>
