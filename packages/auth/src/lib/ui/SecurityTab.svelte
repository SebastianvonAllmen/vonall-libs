<script lang="ts">
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { getLinkedAccounts } from "#lib/remote/app_user.remote.js";
	import ChangePasswordCard from "#lib/ui/ChangePasswordCard.svelte";
	import SetPasswordCard from "#lib/ui/SetPasswordCard.svelte";
	import TwoFactorAuthenticationCard from "#lib/ui/TwoFactorAuthenticationCard.svelte";

	const linkedAccounts = $derived(getLinkedAccounts());
	const hasPasswordAccount = $derived(linkedAccounts.current?.some((acc) => acc.providerId === "credential"));
</script>

<Tabs.Content value="security" class="mt-6 space-y-6">
	{#if linkedAccounts.current}
		{#if hasPasswordAccount}
			<ChangePasswordCard />
			<TwoFactorAuthenticationCard />
		{:else}
			<!-- Accounts that came through GitHub or Google first set a password -->
			<SetPasswordCard onSetSuccess={() => linkedAccounts.refresh()} />
		{/if}
	{:else}
		<div class="panel p-8 text-center text-muted-foreground">{m().loadingSecurity}</div>
	{/if}
</Tabs.Content>
