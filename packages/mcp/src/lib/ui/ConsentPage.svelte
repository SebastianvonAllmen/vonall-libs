<script lang="ts">
	import type { Snippet } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { messageOf } from "@vonall/auth";
	import { authUi } from "@vonall/auth/ui";
	import { m } from "#lib/messages.js";
	import type { ConsentData } from "#lib/server/loads.js";

	/** The Product's auth client with the OAuth provider plugin (`mcpClientPlugins()`), as far as this page uses it. */
	type ConsentClient = { oauth2: { consent(input: { accept: boolean }): Promise<{ error?: { message?: string } | null }> } };

	/**
	 * The consent screen of an MCP client authorisation (`consentLoad` gives `data`): what the assistant may do is the
	 * tools' scope lines, or the Product's own `scopes`; `children` adds the Product's words below them, `notice` a box
	 * after the consent note. A user the Product's `admit` refuses (`data.admission`) reads the reason and `refusalNote`
	 * instead, with one button back to the assistant (it answers deny).
	 */
	let {
		data,
		authClient,
		children,
		scopes,
		notice,
		refusalNote,
	}: { data: ConsentData; authClient: ConsentClient; children?: Snippet; scopes?: Snippet; notice?: Snippet; refusalNote?: Snippet } = $props();
	const { appName } = authUi();
	let busy = $state(false);

	async function answer(accept: boolean) {
		busy = true;
		try {
			// The signed query of this page goes along (the OAuth provider client plugin); the answer is the client's callback
			// URL, which the auth client navigates to
			const res = await authClient.oauth2.consent({ accept });
			if (res.error) toast.error(res.error.message || m().didntWork);
		} catch (e) {
			toast.error(messageOf(e, m().didntWork));
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{m().consentTitle} · {appName}</title></svelte:head>

<Card.Root>
	<Card.Header class="text-center">
		<Card.Title class="text-xl">{m().connectQuestion(data.clientName)}</Card.Title>
		<Card.Description>
			{#if data.backTo}{m().backTo} <strong>{data.backTo}</strong>.{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="grid gap-4 text-sm">
		{#if !data.admission.ok}
			<p>{data.admission.reason}</p>
			{#if refusalNote}<div class="text-xs text-muted-foreground">{@render refusalNote()}</div>{/if}
			<Button disabled={busy} variant="outline" onclick={() => answer(false)} class="cursor-pointer">{m().backToAssistant}</Button>
		{:else}
			<p>{m().consentIntro(appName)}</p>
			{#if scopes}
				{@render scopes()}
			{:else if data.toolScopes.length}
				<ul class="grid list-disc gap-1 pl-5">
					{#each data.toolScopes as line (line)}<li>{line}</li>{/each}
				</ul>
			{/if}
			{@render children?.()}
			<p class="text-xs text-muted-foreground">{m().consentNote}</p>
			{@render notice?.()}
			<div class="grid gap-2">
				<Button disabled={busy} onclick={() => answer(true)} class="cursor-pointer">{m().allow}</Button>
				<Button disabled={busy} variant="outline" onclick={() => answer(false)} class="cursor-pointer">{m().deny}</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
