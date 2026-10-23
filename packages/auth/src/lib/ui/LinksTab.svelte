<script lang="ts">
	import { Link2, Unlink } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { getLinkedAccounts } from "#lib/remote/app_user.remote.js";
	import { authPageData, authUi } from "#lib/ui/context.js";
	import IconGithub from "#lib/ui/IconGithub.svelte";
	import IconGoogle from "#lib/ui/IconGoogle.svelte";
	import { isSessionNotFresh, reauthPath } from "#lib/util/fresh.js";

	const { authClient } = authUi();
	const linkedAccounts = $derived(getLinkedAccounts());
	const providersData = $derived(authPageData("providers").providers);

	const providers = $derived([
		...(providersData?.github ? [{ id: "github", name: "GitHub", component: IconGithub }] : []),
		...(providersData?.google ? [{ id: "google", name: "Google", component: IconGoogle }] : []),
	]);

	async function link(provider: string) {
		const res = await authClient.linkSocial({ provider, callbackURL: window.location.href });
		if (res?.error) toast.error(res.error.message || m().providerNotLinked(provider));
	}

	async function unlink(provider: string) {
		const accountId = linkedAccounts.current?.find((acc) => acc.providerId === provider)?.id;
		if (!accountId) return;
		const res = await authClient.unlinkAccount({ accountId, providerId: provider });

		if (isSessionNotFresh(res?.error)) {
			// better-auth lets only a login from the last day unlink an account
			await goto(reauthPath(`${page.url.pathname}?tab=links`));
		} else if (res?.error) {
			toast.error(res.error.message || m().providerNotUnlinked(provider));
		} else {
			toast.success(m().providerUnlinked(provider));
			linkedAccounts.refresh();
		}
	}

	function isLinked(providerId: string) {
		return linkedAccounts.current?.some((acc) => acc.providerId === providerId);
	}
</script>

<Tabs.Content value="links" class="panel mt-6 p-6 md:p-8">
	<div class="space-y-6">
		<div class="space-y-1">
			<h3 class="text-lg font-medium">{m().linkedAccounts}</h3>
			<p class="text-sm text-muted-foreground">{m().linkedIntro}</p>
		</div>

		<div class="grid gap-4">
			{#each providers as provider (provider.id)}
				{@const linked = isLinked(provider.id)}
				<div class="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
					<div class="flex items-center gap-4">
						<div class="flex items-center justify-center rounded-md border bg-background p-2">
							<provider.component class="size-5" />
						</div>
						<div>
							<p class="font-medium">{provider.name}</p>
							<p class="text-xs text-muted-foreground">{linked ? m().linked : m().notLinked}</p>
						</div>
					</div>

					{#if linked}
						<Button variant="outline" size="sm" class="cursor-pointer text-destructive hover:text-destructive" onclick={() => unlink(provider.id)}>
							<Unlink class="mr-2 size-4" />
							{m().unlink}
						</Button>
					{:else}
						<Button class="cursor-pointer" variant="outline" size="sm" onclick={() => link(provider.id)}>
							<Link2 class="mr-2 size-4" />
							{m().link}
						</Button>
					{/if}
				</div>
			{/each}

			{#if providers.length === 0}
				<p class="text-sm text-muted-foreground">{m().noSocialLogin}</p>
			{/if}
			<p class="text-xs text-muted-foreground">{m().autoLinkNote}</p>
		</div>
	</div>
</Tabs.Content>
