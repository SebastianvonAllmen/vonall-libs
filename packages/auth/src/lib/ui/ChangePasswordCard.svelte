<script lang="ts">
	import { KeyRound } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { changePassword } from "#lib/remote/app_user.remote.js";
	import { messageOf } from "#lib/util/messageOf.js";

	let isSubmitting = $state(false);
</script>

<div class="panel p-6 md:p-8">
	<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold">
		<KeyRound class="size-5 text-muted-foreground" />
		{m().changePassword}
	</h3>
	<form
		class="space-y-6"
		{...changePassword.enhance(async ({ submit }) => {
			isSubmitting = true;
			try {
				await submit();
				toast.success(m().passwordChanged);
				changePassword.fields.currentPassword.set("");
				changePassword.fields.newPassword.set("");
				changePassword.fields.confirmPassword.set("");
			} catch (e) {
				toast.error(messageOf(e, m().passwordNotChanged));
			} finally {
				isSubmitting = false;
			}
		})}
	>
		<div class="space-y-2">
			<Label for="currentPassword" class="text-sm font-medium">{m().currentPassword}</Label>
			<Input id="currentPassword" type="password" {...changePassword.fields.currentPassword.as("text")} placeholder="••••••••" class="bg-muted/30" />
			{#each changePassword.fields.currentPassword.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="newPassword" class="text-sm font-medium">{m().newPassword}</Label>
			<Input id="newPassword" type="password" {...changePassword.fields.newPassword.as("text")} placeholder="••••••••" class="bg-muted/30" />
			{#each changePassword.fields.newPassword.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="confirmPassword" class="text-sm font-medium">{m().confirmNewPasswordShort}</Label>
			<Input id="confirmPassword" type="password" {...changePassword.fields.confirmPassword.as("text")} placeholder="••••••••" class="bg-muted/30" />
			{#each changePassword.fields.confirmPassword.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<Button type="submit" class="cursor-pointer" disabled={isSubmitting}>{isSubmitting ? m().changing : m().changePassword}</Button>
	</form>
</div>
