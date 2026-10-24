<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import { m } from "#lib/messages.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";
	import IconGithub from "./IconGithub.svelte";
	import IconGoogle from "./IconGoogle.svelte";

	/** "Continue with GitHub/Google": starts the social sign-in with the Product's client. */
	let { provider, callbackURL = href("/home") }: { provider: "github" | "google"; callbackURL?: string } = $props();
	const { authClient } = authUi();
	const names = { github: "GitHub", google: "Google" };

	async function login() {
		await authClient.signIn.social({ provider, callbackURL, errorCallbackURL: href("/auth/login") });
	}
</script>

<Button variant="outline" class="w-full cursor-pointer" onclick={login}>
	{#if provider === "github"}<IconGithub />{:else}<IconGoogle />{/if}
	{m().continueWith(names[provider])}
</Button>
