<script lang="ts">
	import { LoaderCircle } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { authPageData, authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";
	import SocialButton from "#lib/ui/SocialButton.svelte";
	import { cn } from "#lib/utils.js";

	/** The signup page: what `signupLoad` allows (the signup mode, the Einladung), then email and password or a social login. */
	const { class: className, ...restProps }: { class?: string } = $props();
	const { authClient, appName } = authUi();

	let email = $state("");
	let password = $state("");
	let password_repeat = $state("");
	let loading = $state(false);
	let errorMessage = $state("");

	const providers = $derived(authPageData("providers").providers);
	const signupState = $derived(authPageData("state").state);
	const erlaubt = $derived(signupState === "allowed");
	/** After signing up without a session (signup mode open): confirm by mail first, or (first account) log in. */
	let done = $state<"confirm" | "login" | null>(null);
	const einladung = $derived(authPageData("einladung").einladung);
	const providerNames = $derived([providers?.github && "GitHub", providers?.google && "Google"].filter(Boolean).join(` ${m().or} `));

	async function signUp(e: SubmitEvent) {
		e.preventDefault();
		if (password !== password_repeat) {
			errorMessage = m().passwordsMismatch;
			return;
		}
		const name = email.split("@")[0]; // the server turns it into a readable name
		await authClient.signUp.email(
			{ email, password, name, callbackURL: href("/home") },
			{
				onRequest: () => {
					loading = true;
					errorMessage = "";
				},
				onSuccess: async (ctx) => {
					loading = false;
					const data = ctx.data as { token?: string | null; user?: { emailVerified?: boolean } } | null;
					// No session yet when the email address has to be confirmed first (signup mode open)
					if (!data?.token) done = data?.user?.emailVerified ? "login" : "confirm";
					else await goto(href("/home"), { replaceState: true });
				},
				onError: async (ctx) => {
					errorMessage =
						ctx.error.status === 403 ? m().needsValidEinladung : ctx.error.message?.toLowerCase().includes("exist") ? m().emailInUse : ctx.error.message || m().signupFailed;
					loading = false;
				},
			},
		);
	}
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">{m().createAccount}</Card.Title>
			{#if einladung}
				<Card.Description>{m().invitesYouTo(einladung.inviterName, appName)}</Card.Description>
			{/if}
			{#if erlaubt && (providers?.github || providers?.google)}
				<Card.Description>{m().signUpWith(providerNames)}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content>
			{#if done === "confirm"}
				<div class="grid gap-4 text-center text-sm">
					<p>{m().almostDone(email, appName)}</p>
				</div>
			{:else if done === "login"}
				<div class="grid gap-4 text-center text-sm">
					<p>{m().accountReady}</p>
					<p><a href={href("/auth/login")} class="underline underline-offset-4">{m().logIn}</a></p>
				</div>
			{:else if !erlaubt}
				<div class="grid gap-4 text-center text-sm">
					{#if signupState === "no_mail"}
						<p>{m().noNewAccountOpen}</p>
					{:else}
						<p>{m().inviteOnly(appName)}</p>
					{/if}
					<p>
						{m().alreadyHaveAccount}
						<a href={href("/auth/login")} class="underline underline-offset-4">{m().logIn}</a>
					</p>
				</div>
			{:else}
				<form onsubmit={signUp}>
					<div class="grid gap-6">
						{#if providers?.github || providers?.google}
							<div class="flex flex-col gap-4">
								{#if providers.github}<SocialButton provider="github" />{/if}
								{#if providers.google}<SocialButton provider="google" />{/if}
							</div>
							<div class="relative text-center text-sm">
								<span class="relative z-10 bg-card px-2 text-muted-foreground">{m().orWithEmail}</span>
								<div class="absolute inset-0 top-1/2 z-0 border-t border-border"></div>
							</div>
						{/if}

						<div class="grid gap-3">
							<Label for="email">{m().email}</Label>
							<Input id="email" name="email" type="email" bind:value={email} required autocomplete="username" />
						</div>
						<div class="grid gap-3">
							<Label for="password">{m().password}</Label>
							<Input id="password" name="password" type="password" required bind:value={password} autocomplete="new-password" />
						</div>
						<div class="grid gap-3">
							<Label for="password_repeat">{m().repeatPassword}</Label>
							<Input id="password_repeat" name="password_repeat" type="password" required bind:value={password_repeat} autocomplete="new-password" />
						</div>

						{#if errorMessage}
							<div class="rounded-md text-center text-sm text-destructive">{errorMessage}</div>
						{/if}

						<Button type="submit" class="w-full cursor-pointer" disabled={loading}>
							{#if loading}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
							{m().signUp}
						</Button>

						<div class="text-center text-sm">
							{m().alreadyHaveAccount}
							<a href={href("/auth/login")} class="underline underline-offset-4">{m().logIn}</a>
						</div>
					</div>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
