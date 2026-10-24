<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { m } from "#lib/messages.js";
	import type { einladungLoad } from "#lib/server/loads.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";

	/** The page an Einladung link opens (`einladungLoad` gives `data`); `tagline` is the Product's one sentence about itself. */
	let { data, tagline }: { data: Awaited<ReturnType<typeof einladungLoad>>; tagline: string } = $props();
	const { appName } = authUi();

	const loginLink = $derived(`${href("/auth/login")}?redirectTo=${encodeURIComponent(page.url.pathname)}`);
</script>

<svelte:head><title>{m().invitationTitle} · {appName}</title></svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-xl">{m().invitationTo(appName)}</Card.Title>
			{#if data.einladung}
				<Card.Description>{m().invitesYou(data.einladung.inviterName)}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content class="grid gap-4 text-sm">
			{#if data.fehler}
				<p class="text-center">{data.fehler}. {m().askForNewLink}</p>
				<Button href={href("/")} variant="outline">{m().toStartPage}</Button>
			{:else if data.eingeloggt}
				<p class="text-center">{m().alreadyHaveAccountNoInvite}</p>
				<Button href={href("/home")}>{m().openApp(appName)}</Button>
			{:else}
				<p>{tagline}</p>
				<div class="grid gap-2">
					<Button href={href("/auth/signup")}>{m().createAccount}</Button>
					<Button href={loginLink} variant="outline">{m().iHaveAnAccount}</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
