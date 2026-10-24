<script lang="ts">
	import { ChevronRight } from "@lucide/svelte";
	import * as Avatar from "#lib/components/ui/avatar/index.js";
	import { m } from "#lib/messages.js";
	import type { SessionUser } from "#lib/types.js";
	import type { SettingsTabDef } from "#lib/ui/tabs.js";
	import { displayInitials } from "#lib/util/names.js";

	let { user, memberSince, tabs, onSelectTab }: { user: SessionUser; memberSince: string; tabs: SettingsTabDef[]; onSelectTab: (tabName: string) => void } = $props();
</script>

<section class="panel flex items-center gap-4 p-5">
	<Avatar.Root class="size-14">
		{#if user.image}<Avatar.Image src={user.image} alt="" />{/if}
		<Avatar.Fallback class="bg-primary/10 text-xl font-semibold text-primary">{displayInitials(user)}</Avatar.Fallback>
	</Avatar.Root>
	<div class="min-w-0">
		<span class="section-kicker">{m().profile}</span>
		<h1 class="truncate text-xl font-semibold">{user.name}</h1>
		<p class="mt-0.5 truncate text-xs text-muted-foreground">{#if memberSince}{m().memberSince(memberSince)}{:else}{user.email}{/if}</p>
	</div>
</section>

<section class="panel divide-y px-4">
	{#each tabs as tab (tab.id)}
		<button onclick={() => onSelectTab(tab.id)} class="flex w-full cursor-pointer items-center gap-4 py-3.5 text-left">
			<span class="grid size-9 place-items-center rounded-lg {tab.id === 'deletion' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}">
				<tab.icon size={20} />
			</span>
			<span class="grid min-w-0 flex-1">
				<strong class="text-sm font-medium">{tab.label}</strong>
				<small class="text-xs text-muted-foreground">{tab.hint}</small>
			</span>
			<ChevronRight size={18} class="text-muted-foreground" />
		</button>
	{/each}
</section>
