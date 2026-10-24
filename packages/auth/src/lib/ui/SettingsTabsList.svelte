<script lang="ts">
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import type { SettingsTabDef } from "#lib/ui/tabs.js";

	let { tabs }: { tabs: SettingsTabDef[] } = $props();
</script>

<!-- Labels at every width: where they don't fit, the bar scrolls sideways (icons alone were not found); w-0 min-w-full
     keeps its labels from widening the page -->
<Tabs.List class="flex h-12 w-0 min-w-full justify-start overflow-x-auto bg-muted p-1">
	{#each tabs as tab (tab.id)}
		<Tabs.Trigger value={tab.id} class="flex-1 shrink-0 px-3 data-[state=active]:bg-background {tab.id === 'deletion' ? 'text-destructive' : ''}">
			<tab.icon class="size-4" />
			<span>{tab.label}</span>
		</Tabs.Trigger>
	{/each}
</Tabs.List>
