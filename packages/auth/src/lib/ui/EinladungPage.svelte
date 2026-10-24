<script lang="ts">
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { m } from "#lib/messages.js";
	import type { einladungLoad } from "#lib/server/loads.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";

	type Data = Awaited<ReturnType<typeof einladungLoad>>;
	type Einladung = NonNullable<Data["einladung"]>;

	/**
	 * The page an Einladung link opens (`einladungLoad` gives `data`); `tagline` is the Product's one sentence about
	 * itself, `title` replaces "Invitation to <app>", `loggedIn` what someone with an account sees (default: a link into
	 * the app, since an account needs no Einladung).
	 */
	let { data, tagline, title, loggedIn }: { data: Data; tagline: string; title?: string; loggedIn?: Snippet<[Einladung]> } = $props();
	const { appName } = authUi();

	const loginLink = $derived(`${href("/auth/login")}?redirectTo=${encodeURIComponent(page.url.pathname)}`);
</script>

<svelte:head><title>{m().invitationTitle} · {appName}</title></svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-xl">{title ?? m().invitationTo(appName)}</Card.Title>
			{#if data.einladung}
				<Card.Description>{m().invitesYou(data.einladung.inviterName)}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content class="grid gap-4 text-sm">
			{#if data.fehler}
				<p class="text-center">{data.fehler}. {m().askForNewLink}</p>
				<Button href={href("/")} variant="outline">{m().toStartPage}</Button>
			{:else if data.eingeloggt && loggedIn && data.einladung}
				{@render loggedIn(data.einladung)}
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
