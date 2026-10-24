<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { updateUserProfile } from "#lib/remote/app_user.remote.js";
	import type { AppUserClient } from "#lib/types.js";
	import { messageOf } from "#lib/util/messageOf.js";

	let { user }: { user: AppUserClient | null | undefined } = $props();
	let isSubmitting = $state(false);

	$effect(() => {
		if (user) {
			updateUserProfile.fields.name.set(user.name);
			updateUserProfile.fields.email.set(user.email);
		}
	});
</script>

<Tabs.Content value="profile" class="panel mt-6 p-6 md:p-8">
	<form
		class="space-y-6"
		{...updateUserProfile.enhance(async ({ submit }) => {
			isSubmitting = true;
			try {
				// submit() resolves false when validation failed; the field issues show why
				if (await submit()) toast.success(m().profileUpdated);
			} catch (e) {
				toast.error(messageOf(e, m().profileNotUpdated));
			} finally {
				isSubmitting = false;
			}
		})}
	>
		<div class="space-y-2">
			<Label for="name">{m().name}</Label>
			<Input id="name" {...updateUserProfile.fields.name.as("text")} placeholder={m().yourName} autocomplete="name" />
			{#each updateUserProfile.fields.name.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="email">{m().email}</Label>
			<Input id="email" type="email" {...updateUserProfile.fields.email.as("text")} placeholder={m().emailPlaceholder} autocomplete="email" />
			{#each updateUserProfile.fields.email.issues() as issue (issue.message)}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<Button type="submit" class="cursor-pointer" disabled={isSubmitting}>{isSubmitting ? m().saving : m().save}</Button>
	</form>
</Tabs.Content>
