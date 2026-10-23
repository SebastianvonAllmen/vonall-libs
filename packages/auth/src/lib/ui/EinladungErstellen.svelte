<script lang="ts">
	import { Copy, Share2 } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { m } from "#lib/messages.js";
	import { createEinladung, getOffeneEinladungen } from "#lib/remote/einladung.remote.js";
	import { authUi } from "#lib/ui/context.js";
	import { messageOf } from "#lib/util/messageOf.js";

	/** Creates an Einladung (a link, optionally sent by email) and shows the link once; in the settings and for the admin. */
	const { appName } = authUi();
	const mail = $derived((await getOffeneEinladungen()).mail);

	let email = $state("");
	let busy = $state(false);
	let link = $state<string | null>(null);

	const text = $derived(m().invitationText(appName, link ?? ""));

	async function create(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		try {
			const result = await createEinladung({ email: email.trim() || null });
			link = result.link;
			if (result.mailFehler) toast.error(m().shareYourself(result.mailFehler));
			else if (email.trim()) toast.success(m().invitationSentTo(email.trim()));
			email = "";
		} catch (e) {
			toast.error(messageOf(e, m().invitationNotCreated));
		} finally {
			busy = false;
		}
	}

	async function copy() {
		if (!link) return;
		try {
			await navigator.clipboard.writeText(text);
			toast.success(m().linkCopied);
		} catch {
			toast.error(m().copyLinkFailed);
		}
	}

	async function share() {
		try {
			await navigator.share({ title: appName, text });
		} catch {
			// cancelled or not supported: the copy button remains
		}
	}
</script>

<form onsubmit={create} class="flex flex-wrap gap-2">
	{#if mail}
		<Input type="email" bind:value={email} placeholder={m().emailOptional} autocomplete="off" class="min-w-56 flex-1" />
	{/if}
	<Button type="submit" disabled={busy} class="cursor-pointer">{busy ? m().creating : m().createInvitation}</Button>
</form>

{#if link}
	<div class="grid gap-2 rounded-lg bg-muted p-3">
		<code class="text-xs break-all">{link}</code>
		<div class="flex gap-2">
			<Button size="sm" variant="secondary" onclick={copy} class="cursor-pointer"><Copy size={14} /> {m().copy}</Button>
			{#if typeof navigator !== "undefined" && "share" in navigator}
				<Button size="sm" variant="secondary" onclick={share} class="cursor-pointer"><Share2 size={14} /> {m().share}</Button>
			{/if}
		</div>
		<p class="text-xs text-muted-foreground">{m().linkShownOnce}</p>
	</div>
{/if}
