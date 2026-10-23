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
	 * The consent screen of an MCP client authorisation (`consentLoad` gives `data`). `children` lists what the assistant
	 * may do, in the Product's words.
	 */
	let { data, authClient, children }: { data: ConsentData; authClient: ConsentClient; children?: Snippet } = $props();
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
		<p>{m().consentIntro(appName)}</p>
		{@render children?.()}
		<p class="text-xs text-muted-foreground">{m().consentNote}</p>
		<div class="grid gap-2">
			<Button disabled={busy} onclick={() => answer(true)} class="cursor-pointer">{m().allow}</Button>
			<Button disabled={busy} variant="outline" onclick={() => answer(false)} class="cursor-pointer">{m().deny}</Button>
		</div>
	</Card.Content>
</Card.Root>
