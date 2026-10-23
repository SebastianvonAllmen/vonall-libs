<script lang="ts">
	import { LoaderCircle } from "@lucide/svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { authUi } from "#lib/ui/context.js";
	import { messageOf } from "#lib/util/messageOf.js";

	type Props = {
		/** Gets the response data: during an MCP client authorisation it carries the next URL, which the auth client follows. */
		onSuccess: (data?: { redirect?: boolean; url?: string } | null) => void;
		onCancel: () => void;
	};

	let { onSuccess, onCancel }: Props = $props();
	const { authClient } = authUi();

	let totpCode = $state("");
	let isVerifyingTotp = $state(false);
	let errorMessage = $state("");

	async function verify2FA(e: SubmitEvent) {
		e.preventDefault();
		if (!totpCode || totpCode.length < 6) {
			errorMessage = m().invalidCode;
			return;
		}
		isVerifyingTotp = true;
		errorMessage = "";
		try {
			const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
			if (res.error) errorMessage = res.error.message || m().wrongCode;
			else onSuccess(res.data as { redirect?: boolean; url?: string } | null);
		} catch (err) {
			errorMessage = messageOf(err, m().codeNotVerified);
		} finally {
			isVerifyingTotp = false;
		}
	}
</script>

<form onsubmit={verify2FA}>
	<div class="grid gap-6">
		<div class="space-y-2 text-center">
			<Label class="text-sm font-medium">{m().twoFactorTitle}</Label>
			<p class="text-xs text-muted-foreground">{m().twoFactorEnterCode}</p>
		</div>
		<div class="grid gap-2">
			<Input id="totpCode" type="text" maxlength={6} bind:value={totpCode} placeholder="123456" required class="bg-muted/30 text-center text-lg font-bold tracking-widest" autocomplete="one-time-code" />
		</div>
		{#if errorMessage}
			<div class="rounded-md text-center text-sm text-destructive">{errorMessage}</div>
		{/if}
		<div class="flex flex-col gap-2">
			<Button type="submit" class="w-full cursor-pointer" disabled={isVerifyingTotp}>
				{#if isVerifyingTotp}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
				{m().confirm}
			</Button>
			<Button variant="outline" class="w-full cursor-pointer" onclick={onCancel}>{m().cancel}</Button>
		</div>
	</div>
</form>
