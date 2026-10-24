<script lang="ts">
	import type { Snippet } from "svelte";
	import { X } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { EINLADUNG_GUELTIG_TAGE } from "#lib/util/signup.js";
	import { getOffeneEinladungen, withdrawEinladung } from "#lib/remote/einladung.remote.js";
	import { authUi } from "#lib/ui/context.js";
	import EinladungErstellen from "#lib/ui/EinladungErstellen.svelte";
	import { messageOf } from "#lib/util/messageOf.js";

	/** Signup is invite only: here a user creates Einladungen and sees the open ones; `einladungFields` is the Product's own fields of one. */
	let { einladungFields }: { einladungFields?: Snippet<[Record<string, unknown>]> } = $props();
	const { locale } = authUi();
	const offen = $derived(await getOffeneEinladungen());
	const datum = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });

	async function withdraw(einladungId: string) {
		try {
			await withdrawEinladung({ einladungId });
			toast.success(m().invitationWithdrawn);
		} catch (e) {
			toast.error(messageOf(e, m().invitationNotWithdrawn));
		}
	}
</script>

<Tabs.Content value="invitations" class="panel mt-6 grid gap-4 p-6 md:p-8">
	<div class="space-y-1">
		<h3 class="text-lg font-medium">{m().inviteSomeone}</h3>
		<p class="text-sm text-muted-foreground">{m().inviteIntro(EINLADUNG_GUELTIG_TAGE)}</p>
	</div>

	<EinladungErstellen {einladungFields} />

	{#if offen.einladungen.length > 0}
		<ul class="grid gap-2 text-sm">
			{#each offen.einladungen as e (e.id)}
				<li class="flex items-center justify-between gap-2">
					<span class="text-muted-foreground">{e.email ?? m().linkWord} · {m().validUntil(datum.format(new Date(e.expiresAt)))}</span>
					<button type="button" class="text-muted-foreground hover:text-destructive" aria-label={m().withdrawInvitation} onclick={() => withdraw(e.id)}>
						<X size={14} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</Tabs.Content>
