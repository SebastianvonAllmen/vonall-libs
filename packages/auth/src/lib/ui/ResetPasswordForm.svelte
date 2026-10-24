<script lang="ts">
	import { LoaderCircle } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { MIN_PASSWORD_LENGTH } from "#lib/types.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";
	import { messageOf } from "#lib/util/messageOf.js";

	/** The page the reset mail links to (`?token=`): the new password, twice. */
	const { authClient } = authUi();

	let password = $state("");
	let confirmPassword = $state("");
	let loading = $state(false);
	let errorMessage = $state("");

	const token = $derived(page.url.searchParams.get("token"));

	async function handleResetPassword(e: SubmitEvent) {
		e.preventDefault();
		if (!token) {
			toast.error(m().resetLinkInvalid);
			return;
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			toast.error(m().passwordTooShort(MIN_PASSWORD_LENGTH));
			return;
		}
		if (password !== confirmPassword) {
			toast.error(m().passwordsMismatch);
			return;
		}
		loading = true;
		errorMessage = "";
		try {
			const res = await authClient.resetPassword({ newPassword: password, token });
			if (res.error) {
				errorMessage = res.error.message || m().passwordNotReset;
				toast.error(errorMessage);
			} else {
				toast.success(m().passwordWasReset);
				await goto(href("/auth/login"), { replaceState: true });
			}
		} catch (err) {
			errorMessage = messageOf(err, m().somethingWentWrong);
			toast.error(errorMessage);
		} finally {
			loading = false;
		}
	}
</script>

<Card.Root>
	<Card.Header class="text-center">
		<Card.Title class="text-xl">{m().resetTitle}</Card.Title>
		<Card.Description>{m().resetIntro}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !token}
			<div class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">{m().resetNoToken}</div>
			<Button variant="outline" class="mt-4 w-full cursor-pointer" onclick={() => goto(href("/auth/login"))}>{m().backToLogin}</Button>
		{:else}
			<form onsubmit={handleResetPassword}>
				<div class="grid gap-6">
					<div class="grid gap-3">
						<Label for="password">{m().newPassword}</Label>
						<Input id="password" type="password" bind:value={password} placeholder="••••••••" required autocomplete="new-password" />
					</div>
					<div class="grid gap-3">
						<Label for="confirmPassword">{m().confirmNewPassword}</Label>
						<Input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="••••••••" required autocomplete="new-password" />
					</div>
					{#if errorMessage}
						<div class="rounded-md text-center text-sm text-destructive">{errorMessage}</div>
					{/if}
					<Button type="submit" class="w-full cursor-pointer" disabled={loading}>
						{#if loading}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
						{m().savePassword}
					</Button>
				</div>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
