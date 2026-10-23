<script lang="ts">
	import { Check, Copy, Shield, ShieldAlert, ShieldCheck } from "@lucide/svelte";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { renderSVG } from "uqr";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/messages.js";
	import { authUi } from "#lib/ui/context.js";
	import { messageOf } from "#lib/util/messageOf.js";

	const { authClient } = authUi();
	const user = $derived(page.data.user as { twoFactorEnabled?: boolean | null } | undefined);

	let twoFAInputPassword = $state("");
	let twoFATOTPCode = $state("");
	let isEnabling2FA = $state(false);
	let isRequestingEnable = $state(false);
	let isVerifyingTotp = $state(false);
	let isDisabling2FA = $state(false);

	let totpURI = $state("");
	let backupCodes = $state<string[]>([]);
	let isCopied = $state(false);
	// Rendered here: the TOTP secret must never leave the browser for a QR service
	const qrSrc = $derived(totpURI ? `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(totpURI))}` : "");

	async function handleStartEnable() {
		if (!twoFAInputPassword) {
			toast.error(m().enterPasswordOn);
			return;
		}
		isRequestingEnable = true;
		try {
			const res = await authClient.twoFactor.enable({ password: twoFAInputPassword });
			const data = res.data as { method?: string; totpURI?: string; backupCodes?: string[] } | null | undefined;
			if (res.error) {
				toast.error(res.error.message || m().twoFactorNotOn);
			} else if (data && data.method === "totp" && data.totpURI) {
				totpURI = data.totpURI;
				backupCodes = data.backupCodes || [];
				isEnabling2FA = true;
				toast.success(m().twoFactorEnterCode);
			}
		} catch (e) {
			toast.error(messageOf(e, m().setupNotStarted));
		} finally {
			isRequestingEnable = false;
		}
	}

	async function handleVerifyTotp() {
		if (!twoFATOTPCode || twoFATOTPCode.length < 6) {
			toast.error(m().invalidCode);
			return;
		}
		isVerifyingTotp = true;
		try {
			const res = await authClient.twoFactor.verifyTotp({ code: twoFATOTPCode, trustDevice: true });
			if (res.error) {
				toast.error(res.error.message || m().wrongCode);
			} else {
				toast.success(m().twoFactorIsOn);
				isEnabling2FA = false;
				twoFAInputPassword = "";
				twoFATOTPCode = "";
				totpURI = "";
				window.location.reload();
			}
		} catch (e) {
			toast.error(messageOf(e, m().codeNotVerified));
		} finally {
			isVerifyingTotp = false;
		}
	}

	async function handleDisable2FA() {
		if (!twoFAInputPassword) {
			toast.error(m().enterPasswordOff);
			return;
		}
		isRequestingEnable = true;
		try {
			const res = await authClient.twoFactor.disable({ password: twoFAInputPassword });
			if (res.error) {
				toast.error(res.error.message || m().twoFactorNotOff);
			} else {
				toast.success(m().twoFactorIsOff);
				isDisabling2FA = false;
				twoFAInputPassword = "";
				window.location.reload();
			}
		} catch (e) {
			toast.error(messageOf(e, m().twoFactorNotOff));
		} finally {
			isRequestingEnable = false;
		}
	}

	function handleCopyBackupCodes() {
		navigator.clipboard.writeText(backupCodes.join("\n"));
		isCopied = true;
		toast.success(m().backupCodesCopied);
		setTimeout(() => (isCopied = false), 2000);
	}
</script>

<div class="panel space-y-6 p-6 md:p-8">
	<div class="flex items-center justify-between border-b pb-4">
		<div>
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<Shield class="size-5 text-muted-foreground" />
				{m().twoFactorHeading}
			</h3>
			<p class="mt-1 text-sm text-muted-foreground">{m().twoFactorIntro}</p>
		</div>
		<div>
			{#if user?.twoFactorEnabled}
				<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
					<ShieldCheck class="size-4" />
					{m().on}
				</span>
			{:else}
				<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
					<ShieldAlert class="size-4" />
					{m().off}
				</span>
			{/if}
		</div>
	</div>

	{#if user?.twoFactorEnabled}
		<div class="space-y-4">
			<p class="text-sm text-muted-foreground">{m().twoFactorProtects}</p>
			{#if isDisabling2FA}
				<div class="space-y-4 border-t pt-4">
					<div class="space-y-2">
						<Label for="disable2faPassword" class="text-sm font-medium">{m().yourPassword}</Label>
						<Input id="disable2faPassword" type="password" bind:value={twoFAInputPassword} placeholder="••••••••" class="max-w-md bg-muted/30" />
					</div>
					<div class="flex gap-3">
						<Button variant="destructive" onclick={handleDisable2FA} disabled={isRequestingEnable} class="cursor-pointer">
							{isRequestingEnable ? m().turningOff : m().turnOff}
						</Button>
						<Button
							variant="outline"
							onclick={() => {
								isDisabling2FA = false;
								twoFAInputPassword = "";
							}}
							class="cursor-pointer"
						>
							{m().cancel}
						</Button>
					</div>
				</div>
			{:else}
				<Button variant="destructive" onclick={() => (isDisabling2FA = true)} class="cursor-pointer">{m().turnOff2fa}</Button>
			{/if}
		</div>
	{:else if isEnabling2FA}
		<div class="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
			<div class="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed bg-muted/20 p-4 text-center">
				<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{m().scanQr}</p>
				<img src={qrSrc} width="180" height="180" alt={m().qrAlt} class="rounded-lg border bg-white p-2 shadow-xs" />
				<p class="max-w-[220px] text-xs text-muted-foreground">{m().scanWithApp}</p>
			</div>
			<div class="space-y-6">
				<div>
					<h4 class="mb-2 text-sm font-semibold">{m().saveBackupCodes}</h4>
					<p class="mb-3 text-xs text-muted-foreground">{m().backupCodesIntro}</p>
					<div class="flex items-center gap-2">
						<code class="block flex-1 truncate rounded-lg border bg-muted/60 p-2.5 font-mono text-xs select-all">{backupCodes.slice(0, 3).join(", ")}...</code>
						<Button variant="outline" size="icon" onclick={handleCopyBackupCodes} title={m().copyBackupCodes} class="cursor-pointer">
							{#if isCopied}<Check class="size-4 text-emerald-500" />{:else}<Copy class="size-4" />{/if}
						</Button>
					</div>
				</div>

				<div class="space-y-3">
					<h4 class="text-sm font-semibold">{m().confirmSetup}</h4>
					<div class="space-y-2">
						<Label for="totpCode" class="text-sm font-medium">{m().enterCodeFromApp}</Label>
						<Input id="totpCode" type="text" maxlength={6} bind:value={twoFATOTPCode} placeholder="123456" class="max-w-sm bg-muted/30 text-center text-lg font-bold tracking-widest" />
					</div>
					<div class="flex gap-3">
						<Button onclick={handleVerifyTotp} disabled={isVerifyingTotp} class="cursor-pointer">{isVerifyingTotp ? m().checking : m().turnOn2fa}</Button>
						<Button
							variant="outline"
							onclick={() => {
								isEnabling2FA = false;
								twoFAInputPassword = "";
								totpURI = "";
							}}
							class="cursor-pointer"
						>
							{m().cancel}
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			<p class="text-sm text-muted-foreground">{m().setup2faIntro}</p>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="enable2faPassword" class="text-sm font-medium">{m().yourPassword}</Label>
					<Input id="enable2faPassword" type="password" bind:value={twoFAInputPassword} placeholder="••••••••" class="max-w-md bg-muted/30" />
				</div>
				<Button onclick={handleStartEnable} disabled={isRequestingEnable} class="cursor-pointer">{isRequestingEnable ? m().starting : m().start2faSetup}</Button>
			</div>
		</div>
	{/if}
</div>
