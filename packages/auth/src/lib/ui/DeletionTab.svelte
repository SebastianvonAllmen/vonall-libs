<script lang="ts">
	import { AlertTriangle, Trash2 } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { deleteOwnAccount } from "#lib/remote/app_user.remote.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";
	import { messageOf } from "#lib/util/messageOf.js";

	/** Deleting the own account; `agents` adds the sentence about connected AI assistants (the MCP endpoint). */
	let { agents = false }: { agents?: boolean } = $props();
	const { authClient } = authUi();

	let confirmationText = $state("");
	let isSubmitting = $state(false);

	const isConfirmed = $derived(confirmationText.toLowerCase() === m().deleteWord.toLowerCase());

	async function handleDeleteAccount() {
		if (!isConfirmed) return;
		isSubmitting = true;
		try {
			const res = await deleteOwnAccount();
			if (res.success) {
				toast.success(m().accountDeleted);
				await authClient.signOut().catch(() => undefined);
				window.location.href = href("/");
			} else {
				toast.error(m().accountNotDeleted);
			}
		} catch (error) {
			toast.error(messageOf(error, m().accountNotDeleted));
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Tabs.Content value="deletion" class="mt-6 space-y-6">
	<div class="rounded-xl border border-destructive/20 bg-destructive/5 p-8 shadow-sm dark:bg-destructive/10">
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-destructive">
			<Trash2 class="size-5" />
			{m().deleteForGood}
		</h3>

		<div class="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
			<div class="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-destructive dark:bg-destructive/20 dark:text-destructive">
				<AlertTriangle class="mt-0.5 size-5 shrink-0" />
				<div>
					<h4 class="mb-1 font-semibold">{m().cannotBeUndone}</h4>
					<p>
						{m().deletionText}
						{#if agents}{m().deletionAgents}{/if}
						{m().deletionNoLogin}
					</p>
				</div>
			</div>

			<div class="space-y-2 pt-2">
				<Label for="confirm-text" class="font-medium text-foreground">
					{m().type} <span class="font-bold text-destructive">{m().deleteWord}</span> {m().typeToContinue}
				</Label>
				<Input id="confirm-text" type="text" bind:value={confirmationText} placeholder={m().deleteWord} class="max-w-md border-destructive/30 bg-background focus-visible:ring-destructive" disabled={isSubmitting} />
			</div>

			<div class="pt-4">
				<Button variant="destructive" disabled={!isConfirmed || isSubmitting} onclick={handleDeleteAccount} class="cursor-pointer">
					{isSubmitting ? m().deleting : m().deletePermanently}
				</Button>
			</div>
		</div>
	</div>
</Tabs.Content>
