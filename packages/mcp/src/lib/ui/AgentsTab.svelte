<script lang="ts">
	import { Copy } from "@lucide/svelte";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { messageOf } from "@vonall/auth";
	import { m } from "#lib/messages.js";
	import { getAgents, revokeAgent } from "#lib/remote/agent.remote.js";

	/**
	 * The AI assistants (MCP clients) the user allowed, with taking their access away, and how to connect one. Any MCP
	 * client with OAuth works; web apps (claude.ai, ChatGPT, Le Chat) need the public HTTPS address, CLI and editor
	 * clients work locally too. The Product puts it into its settings' tab panel.
	 */
	let { appName, locale }: { appName: string; locale: string } = $props();

	const agents = $derived(await getAgents());
	const datum = $derived(new Intl.DateTimeFormat(locale, { dateStyle: "medium" }));
	const url = $derived(`${page.url.origin}/api/mcp`);
	const local = $derived(["localhost", "127.0.0.1"].includes(page.url.hostname));
	const slug = $derived(appName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

	async function revoke(clientId: string, name: string) {
		if (!confirm(m().revokeConfirm(name, appName))) return;
		try {
			await revokeAgent({ clientId });
			toast.success(m().revoked(name));
		} catch (e) {
			toast.error(messageOf(e, m().revokeFailed));
		}
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(m().copied);
		} catch {
			toast.error(m().copyFailed);
		}
	}
</script>

<div class="grid gap-5">
	<div class="space-y-1">
		<h3 class="text-lg font-medium">{m().agentsTitle}</h3>
		<p class="text-sm text-muted-foreground">{m().agentsIntro}</p>
	</div>

	{#if agents.length > 0}
		<ul class="grid gap-2">
			{#each agents as a (a.clientId)}
				{@const name = a.name ?? m().unnamedAssistant}
				<li class="flex items-center justify-between gap-3">
					<div class="grid min-w-0">
						<strong class="text-sm">{name}</strong>
						<small class="text-xs break-all text-muted-foreground">{m().connectedSince} {a.since ? datum.format(new Date(a.since)) : "–"}{a.uri ? ` · ${a.uri}` : ""}</small>
					</div>
					<Button size="sm" variant="secondary" onclick={() => revoke(a.clientId, name)} class="cursor-pointer">{m().revoke}</Button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-muted-foreground">{m().noAssistant}</p>
	{/if}

	<div class="grid gap-3 text-sm text-muted-foreground">
		<p>{m().howToConnect}</p>
		<div class="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
			<code class="flex-1 text-xs break-all text-foreground">{url}</code>
			<button type="button" aria-label={m().copyAddress} class="text-muted-foreground hover:text-foreground" onclick={() => copy(url)}><Copy size={14} /></button>
		</div>
		{#if local}
			<p class="text-xs text-amber-600 dark:text-amber-400">{m().localNote}</p>
		{/if}

		<details class="rounded-md bg-muted/60 px-3 py-2">
			<summary class="cursor-pointer font-medium text-foreground">{m().claudeTitle}</summary>
			<p class="mt-2">{m().claudeSteps}</p>
		</details>
		<details class="rounded-md bg-muted/60 px-3 py-2">
			<summary class="cursor-pointer font-medium text-foreground">{m().claudeCodeTitle}</summary>
			<code class="mt-2 block rounded-md border bg-background px-3 py-2 text-xs text-foreground">claude mcp add --transport http {slug} {url}</code>
			<p class="mt-2">{m().claudeCodeThen}</p>
		</details>
		<details class="rounded-md bg-muted/60 px-3 py-2">
			<summary class="cursor-pointer font-medium text-foreground">{m().chatgptTitle}</summary>
			<p class="mt-2">{m().chatgptSteps}</p>
		</details>
		<details class="rounded-md bg-muted/60 px-3 py-2">
			<summary class="cursor-pointer font-medium text-foreground">{m().othersTitle}</summary>
			<p class="mt-2">{m().othersSteps}</p>
			<code class="mt-2 block rounded-md border bg-background px-3 py-2 text-xs text-foreground">{`{ "servers": { "${slug}": { "type": "http", "url": "${url}" } } }`}</code>
		</details>

		<p class="text-xs">{m().agentsNote}</p>
	</div>
</div>
