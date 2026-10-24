<script lang="ts">
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { updateUserProfile } from "#lib/remote/app_user.remote.js";
	import { untrack, type Snippet } from "svelte";
	import type { SessionUser } from "#lib/types.js";
	import { authPageData } from "#lib/ui/context.js";
	import { messageOf } from "#lib/util/messageOf.js";

	/**
	 * Name and email of the user. `fields` renders inside the form: the Product's own columns on `user`
	 * (`createAuth({ userFields })`), bound into `extra` (one key per field, from the page's `user`), which the form sends
	 * along; `children` is the Product's own fields below the form (its own form on its own table).
	 */
	let { user, fields, children }: { user: SessionUser | null | undefined; fields?: Snippet<[Record<string, string | null>]>; children?: Snippet } = $props();
	let isSubmitting = $state(false);
	const userFields = $derived(authPageData("userFields").userFields);
	/** The Product's fields as the form edits them, text either way; hidden inputs carry them to `updateUserProfile`. */
	let extra = $state<Record<string, string | null>>({});

	// The session's values into the form, untracked: `set` reads the form's state, so a tracked call would re-run on
	// every keystroke and overwrite what was typed
	$effect(() => {
		if (!user) return;
		const { name, email } = user;
		const values = user as Record<string, unknown>;
		const keys = userFields;
		untrack(() => {
			updateUserProfile.fields.name.set(name);
			updateUserProfile.fields.email.set(email);
			extra = Object.fromEntries(keys.map((key) => [key, values[key] == null ? null : String(values[key])]));
		});
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

		{@render fields?.(extra)}
		{#each Object.entries(extra) as [key, value] (key)}
			<input type="hidden" name={key} value={value ?? ""} />
		{/each}

		<Button type="submit" class="cursor-pointer" disabled={isSubmitting}>{isSubmitting ? m().saving : m().save}</Button>
	</form>
	{@render children?.()}
</Tabs.Content>
