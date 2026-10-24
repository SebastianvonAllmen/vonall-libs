<script lang="ts">
	import type { Snippet } from "svelte";
	import { LoaderCircle } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { authUi } from "#lib/ui/context.js";
	import { href } from "#lib/ui/href.js";
	import SocialButton from "#lib/ui/SocialButton.svelte";
	import Verify2FAForm from "#lib/ui/Verify2FAForm.svelte";
	import { cn } from "#lib/utils.js";
	import { messageOf } from "#lib/util/messageOf.js";
	import { sameSitePath } from "#lib/util/sameSite.js";

	/**
	 * The login page: email and password (with two-factor and the forgotten password), the social logins that have keys
	 * (`authLayoutLoad`). `footer` is the Product's line under the card (e.g. its privacy policy).
	 */
	const { class: className, footer, ...restProps }: { class?: string; footer?: Snippet } = $props();
	const { authClient, appName, signupMode } = authUi();

	let email = $state("");
	let password = $state("");
	let loading = $state(false);
	let errorMessage = $state("");

	let show2FAInput = $state(false);
	let showForgotPassword = $state(false);
	let forgotPasswordEmail = $state("");
	let sendingResetLink = $state(false);

	const providers = $derived(page.data.providers as { github?: boolean; google?: boolean } | undefined);
	const mail = $derived(page.data.mail as boolean);

	const urlError = $derived(page.url.searchParams.get("error"));
	// A new account through GitHub or Google was refused: why depends on the signup mode
	const noNewAccount = $derived(signupMode === "open" ? m().noNewAccountOpen : m().noNewAccountInvite);
	const URL_ERRORS = $derived<Record<string, string>>({
		account_not_linked: m().accountNotLinked,
		unable_to_create_user: noNewAccount,
		forbidden: noNewAccount,
		session_not_fresh: m().loginTooOld,
	});

	const displayError = $derived(urlError ? (URL_ERRORS[urlError.toLowerCase()] ?? urlError) : errorMessage);

	async function requestPasswordReset(e: SubmitEvent) {
		e.preventDefault();
		if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
			toast.error(m().invalidEmailDot);
			return;
		}
		sendingResetLink = true;
		try {
			const res = await authClient.requestPasswordReset({ email: forgotPasswordEmail, redirectTo: `${window.location.origin}/auth/reset-password` });
			if (res.error) {
				toast.error(res.error.message || m().resetLinkNotSent);
			} else {
				toast.success(m().resetLinkSent);
				showForgotPassword = false;
				forgotPasswordEmail = "";
			}
		} catch (err) {
			toast.error(messageOf(err, m().resetLinkNotRequested));
		} finally {
			sendingResetLink = false;
		}
	}

	// An AI assistant (MCP client) sent the user here to authorise it; the query is signed by the OAuth provider.
	// Sign-in then carries it along (the OAuth provider client plugin) and the server answers with the next step's URL
	// (consent page or the client's callback), which the auth client follows by itself.
	const oauthRequest = $derived(page.url.searchParams.has("sig") && page.url.searchParams.has("client_id"));
	// Only same-site paths, e.g. back to an Einladung after logging in
	const redirectTo = $derived(sameSitePath(page.url.searchParams.get("redirectTo"), page.url.origin));

	async function next(data?: { redirect?: boolean; url?: string } | null) {
		if (data?.redirect && data.url) return; // the auth client navigates to data.url
		if (oauthRequest) {
			// Fallback: with a session, the authorize endpoint continues the flow in the browser
			const query = [...page.url.searchParams].filter(([key]) => key !== "sig" && key !== "exp");
			window.location.href = `/api/auth/oauth2/authorize?${query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`;
			return;
		}
		// A new login: queries cached before it (one that sent here to log in again resolved empty) load again
		await goto(redirectTo ?? href("/home"), { replaceState: true, refreshAll: true });
	}

	async function signIn(e: SubmitEvent) {
		e.preventDefault();
		await authClient.signIn.email(
			{ email, password },
			{
				onRequest: () => {
					loading = true;
					errorMessage = "";
				},
				onSuccess: async (ctx) => {
					loading = false;
					const data = ctx.data as { twoFactorRedirect?: boolean; redirect?: boolean; url?: string } | null;
					if (data?.twoFactorRedirect) show2FAInput = true;
					else await next(data);
				},
				onError: async (ctx) => {
					loading = false;
					// Signup mode open: the address isn't confirmed yet; better-auth has just sent a new link
					errorMessage = ctx.error.code === "EMAIL_NOT_VERIFIED" ? m().confirmEmailFirst : (ctx.error.message ?? "");
				},
			},
		);
	}
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">{m().welcomeBack}</Card.Title>
			<Card.Description>{m().logInTo(appName)}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if show2FAInput}
				<Verify2FAForm
					onSuccess={async (data) => {
						await next(data);
						show2FAInput = false;
					}}
					onCancel={() => {
						show2FAInput = false;
						errorMessage = "";
					}}
				/>
			{:else if showForgotPassword}
				<form onsubmit={requestPasswordReset}>
					<div class="grid gap-6">
						<div class="space-y-2 text-center">
							<h3 class="text-lg font-medium">{m().forgotPassword}</h3>
							<p class="text-sm text-muted-foreground">{m().forgotIntro}</p>
						</div>
						<div class="grid gap-3">
							<Label for="resetEmail">{m().email}</Label>
							<Input id="resetEmail" type="email" bind:value={forgotPasswordEmail} placeholder={m().emailPlaceholder} required />
						</div>
						<div class="flex flex-col gap-2">
							<Button type="submit" class="w-full cursor-pointer" disabled={sendingResetLink}>
								{#if sendingResetLink}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
								{m().sendTheLink}
							</Button>
							<Button
								type="button"
								variant="outline"
								class="w-full cursor-pointer"
								onclick={() => {
									showForgotPassword = false;
									errorMessage = "";
								}}
							>
								{m().backToLogin}
							</Button>
						</div>
					</div>
				</form>
			{:else}
				<form onsubmit={signIn}>
					<div class="grid gap-6">
						{#if providers?.github || providers?.google}
							<div class="flex flex-col gap-4">
								{#if providers.github}<SocialButton provider="github" callbackURL={redirectTo ?? "/home"} />{/if}
								{#if providers.google}<SocialButton provider="google" callbackURL={redirectTo ?? "/home"} />{/if}
							</div>
							<div class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
								<span class="bg-card text-muted-foreground relative z-10 px-2">{m().orWithEmail}</span>
							</div>
						{/if}
						<div class="grid gap-6">
							<div class="grid gap-3">
								<Label for="email">{m().email}</Label>
								<Input id="email" name="email" bind:value={email} type="email" placeholder={m().emailPlaceholder} required autocomplete="username" />
							</div>
							<div class="grid gap-3">
								<div class="flex items-center">
									<Label for="password">{m().password}</Label>
									{#if mail}
										<button
											type="button"
											onclick={() => {
												showForgotPassword = true;
												errorMessage = "";
											}}
											class="ml-auto cursor-pointer border-0 bg-transparent p-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
										>
											{m().forgotPassword}
										</button>
									{/if}
								</div>
								<Input id="password" name="password" type="password" bind:value={password} required autocomplete="current-password" />
							</div>
							{#if displayError}
								<div class="rounded-md text-center text-sm text-destructive">{displayError}</div>
							{/if}
							<Button type="submit" class="w-full cursor-pointer" disabled={loading}>
								{#if loading}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
								{m().logIn}
							</Button>
						</div>
						<div class="text-center text-sm">
							{m().noAccountYet}
							<a href={href("/auth/signup")} class="underline underline-offset-4">{m().signUp}</a>
						</div>
					</div>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
	{@render footer?.()}
</div>
