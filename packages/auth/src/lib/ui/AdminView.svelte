<script lang="ts">
	import type { Snippet } from "svelte";
	import { Trash2, X } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { m } from "#lib/messages.js";
	import { EINLADUNG_GUELTIG_TAGE } from "#lib/util/signup.js";
	import { deleteUser, getAllUsers, setUserRole } from "#lib/remote/app_user.remote.js";
	import { adminWithdrawEinladung, getAlleEinladungen } from "#lib/remote/einladung.remote.js";
	import type { AppUserClient, EinladungRow } from "#lib/types.js";
	import { authPageData, authUi } from "#lib/ui/context.js";
	import EinladungErstellen from "#lib/ui/EinladungErstellen.svelte";
	import { messageOf } from "#lib/util/messageOf.js";

	/**
	 * The app admin: accounts (role, delete), new Einladungen and every open one. No impersonation, no access to anyone's
	 * data. The roles come from `manageUserLoad` (`createAuth({ roles })`), `roleLabel` names them. A Product adds its own
	 * to each account (`userExtra`, the admin's own row included), to each open Einladung (`einladungExtra`) and to the
	 * form that creates one (`einladungFields`, bound into its `extras`); `intro` replaces the sentence about the links,
	 * `showEinladungErstellen: false` hides the form, `class` replaces the page's width and spacing (centred, 48rem).
	 */
	let {
		currentUserId,
		intro,
		showEinladungErstellen = true,
		roleLabel = defaultRoleLabel,
		userExtra,
		einladungExtra,
		einladungFields,
		class: className = "mx-auto grid max-w-3xl gap-6",
	}: {
		currentUserId: string;
		intro?: string;
		showEinladungErstellen?: boolean;
		roleLabel?: (role: string) => string;
		userExtra?: Snippet<[AppUserClient, boolean]>;
		einladungExtra?: Snippet<[EinladungRow & { inviterName: string }]>;
		einladungFields?: Snippet<[Record<string, unknown>]>;
		class?: string;
	} = $props();
	const { locale, displayName } = authUi();
	const roles = $derived(authPageData("roles").roles);

	const users = $derived(await getAllUsers());
	const einladungen = $derived(await getAlleEinladungen());
	const datum = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

	function defaultRoleLabel(role: string): string {
		return role === "admin" ? m().roleAdmin : role === "user" ? m().roleUser : role;
	}

	async function run(action: () => Promise<unknown>, success: string) {
		try {
			await action();
			toast.success(success);
		} catch (e) {
			toast.error(messageOf(e, m().didntWork));
		}
	}

	function remove(id: string, name: string) {
		if (!confirm(m().confirmDeleteAccount(name))) return;
		run(() => deleteUser({ userId: id }), m().accountDeletedAdmin);
	}
</script>

<div class={className}>
	<header>
		<span class="section-kicker">{m().administration}</span>
		<h1 class="text-2xl font-semibold tracking-tight">{m().accounts}</h1>
	</header>

	<section class="panel p-5">
		<ul class="grid gap-3">
			{#each users as u (u.id)}
				{@const name = displayName(u)}
				<li class="flex flex-wrap items-center gap-3">
					<div class="grid min-w-0 flex-1">
						<strong class="truncate text-sm font-semibold">{name}{#if u.banned}&nbsp;<span class="font-normal text-destructive">{m().bannedMark}</span>{/if}</strong>
						<small class="text-xs text-muted-foreground">{u.email} · {m().since(datum.format(new Date(u.createdAt)))}{u.twoFactorEnabled ? " · 2FA" : ""}</small>
					</div>
					{@render userExtra?.(u, u.id === currentUserId)}
					{#if u.id === currentUserId}
						<span class="text-xs text-muted-foreground">{roleLabel(u.role)} {m().you}</span>
					{:else}
						<select value={u.role} aria-label={m().roleOf(name)} class="rounded-md border bg-background px-2 py-1.5 text-xs" onchange={(e) => run(() => setUserRole({ userId: u.id, role: e.currentTarget.value }), m().roleChanged)}>
							{#each roles as role (role)}
								<option value={role}>{roleLabel(role)}</option>
							{/each}
						</select>
						<button type="button" class="text-muted-foreground hover:text-destructive" aria-label={m().deleteAccountOf(name)} onclick={() => remove(u.id, name)}>
							<Trash2 size={15} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class="panel grid gap-3 p-5">
		<span class="section-kicker">{m().invitations}</span>
		<p class="text-sm text-muted-foreground">{intro ?? m().inviteIntro(EINLADUNG_GUELTIG_TAGE)}</p>
		{#if showEinladungErstellen}<EinladungErstellen {einladungFields} />{/if}
		{#if einladungen.length === 0}
			<p class="text-sm text-muted-foreground">{m().noOpenInvitations}</p>
		{:else}
			<ul class="grid gap-3">
				{#each einladungen as e (e.id)}
					<li class="flex flex-wrap items-center gap-3">
						<div class="grid min-w-0 flex-1">
							<strong class="truncate text-sm font-semibold">{e.email ?? m().linkWord}</strong>
							<small class="text-xs text-muted-foreground">{m().by(e.inviterName)} · {m().validUntil(datum.format(new Date(e.expiresAt)))}</small>
						</div>
						{@render einladungExtra?.(e)}
						<button type="button" class="text-muted-foreground hover:text-destructive" aria-label={m().withdrawInvitation} onclick={() => run(() => adminWithdrawEinladung({ einladungId: e.id }), m().invitationWithdrawn)}>
							<X size={15} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
