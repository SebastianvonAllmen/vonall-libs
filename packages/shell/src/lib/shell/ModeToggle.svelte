<script lang="ts">
	import { Moon, Sun } from "@lucide/svelte";
	import { toggleMode } from "mode-watcher";
	import { Button } from "#lib/components/ui/button/index.js";
	import { m } from "#lib/messages.js";

	let { class: className = "" }: { class?: string } = $props();
</script>

<Button onclick={toggleMode} variant="ghost" size="icon" class="cursor-pointer {className}" aria-label={m().switchTheme}>
	<Sun class="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
	<Moon class="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
</Button>
