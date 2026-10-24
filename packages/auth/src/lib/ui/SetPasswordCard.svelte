<script lang="ts">
	import { KeyRound } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { setPassword } from "#lib/remote/app_user.remote.js";
	import { messageOf } from "#lib/util/messageOf.js";

	let { onSetSuccess }: { onSetSuccess?: () => void } = $props();
	let isSubmitting = $state(false);
</script>

<div class="panel p-6 md:p-8">
	<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold">
		<KeyRound class="size-5 text-muted-foreground" />
		{m().setPassword}
	</h3>
	<p class="mb-6 text-sm text-muted-foreground">{m().setPasswordIntro}</p>
	<form
		class="space-y-6"
		{...setPassword.enhance(async ({ submit }) => {
			isSubmitting = true;
			try {
				await submit();
				toast.success(m().passwordSet);
				setPassword.fields.newPassword.set("");
				setPassword.fields.confirmPassword.set("");
				onSetSuccess?.();
			} catch (e) {
				toast.error(messageOf(e, m().passwordNotSet));
			} finally {
				isSubmitting = false;
			}
		})}
	>
		<div class="space-y-2">
			<Label for="newPassword" class="text-sm font-medium">{m().newPassword}</Label>
			<Input id="newPassword" type="password" {...setPassword.fields.newPassword.as("text")} placeholder="••••••••" class="bg-muted/30" />
			{#each setPassword.fields.newPassword.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="confirmPassword" class="text-sm font-medium">{m().confirmNewPasswordShort}</Label>
			<Input id="confirmPassword" type="password" {...setPassword.fields.confirmPassword.as("text")} placeholder="••••••••" class="bg-muted/30" />
			{#each setPassword.fields.confirmPassword.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<Button type="submit" class="cursor-pointer" disabled={isSubmitting}>{isSubmitting ? m().saving : m().setPasswordButton}</Button>
	</form>
</div>
