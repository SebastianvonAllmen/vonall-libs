<script lang="ts">
	import { Trash2, X } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { m } from "#lib/messages.js";
	import { EINLADUNG_GUELTIG_TAGE } from "#lib/util/signup.js";
	import { deleteUser, getAllUsers, setUserRole } from "#lib/remote/app_user.remote.js";
	import { adminWithdrawEinladung, getAlleEinladungen } from "#lib/remote/einladung.remote.js";
	import { authUi } from "#lib/ui/context.js";
	import EinladungErstellen from "#lib/ui/EinladungErstellen.svelte";
	import { messageOf } from "#lib/util/messageOf.js";

	/** The app admin: accounts (role, delete), new Einladungen and every open one. No impersonation, no access to anyone's data. */
	let { currentUserId }: { currentUserId: string } = $props();
	const { locale } = authUi();

	const users = $derived(await getAllUsers());
	const einladungen = $derived(await getAlleEinladungen());
	const datum = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

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

<div class="mx-auto grid max-w-3xl gap-6">
	<header>
		<span class="section-kicker">{m().administration}</span>
		<h1 class="text-2xl font-semibold tracking-tight">{m().accounts}</h1>
	</header>

	<section class="panel p-5">
		<ul class="grid gap-3">
			{#each users as u (u.id)}
				<li class="flex items-center gap-3">
					<div class="grid min-w-0 flex-1">
						<strong class="truncate text-sm font-semibold">{u.name}</strong>
						<small class="text-xs text-muted-foreground">{u.email} · {m().since(datum.format(new Date(u.createdAt)))}{u.twoFactorEnabled ? " · 2FA" : ""}</small>
					</div>
					{#if u.id === currentUserId}
						<span class="text-xs text-muted-foreground">{u.role} {m().you}</span>
					{:else}
						<select
							value={u.role}
							aria-label={m().roleOf(u.name)}
							class="rounded-md border bg-background px-2 py-1.5 text-xs"
							onchange={(e) => run(() => setUserRole({ userId: u.id, role: e.currentTarget.value as "admin" | "user" }), m().roleChanged)}
						>
							<option value="user">user</option>
							<option value="admin">admin</option>
						</select>
						<button type="button" class="text-muted-foreground hover:text-destructive" aria-label={m().deleteAccountOf(u.name)} onclick={() => remove(u.id, u.name)}>
							<Trash2 size={15} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class="panel grid gap-3 p-5">
		<span class="section-kicker">{m().invitations}</span>
		<p class="text-sm text-muted-foreground">{m().inviteIntro(EINLADUNG_GUELTIG_TAGE)}</p>
		<EinladungErstellen />
		{#if einladungen.length === 0}
			<p class="text-sm text-muted-foreground">{m().noOpenInvitations}</p>
		{:else}
			<ul class="grid gap-3">
				{#each einladungen as e (e.id)}
					<li class="flex items-center gap-3">
						<div class="grid min-w-0 flex-1">
							<strong class="truncate text-sm font-semibold">{e.email ?? m().linkWord}</strong>
							<small class="text-xs text-muted-foreground">{m().by(e.inviterName)} · {m().validUntil(datum.format(new Date(e.expiresAt)))}</small>
						</div>
						<button type="button" class="text-muted-foreground hover:text-destructive" aria-label={m().withdrawInvitation} onclick={() => run(() => adminWithdrawEinladung({ einladungId: e.id }), m().invitationWithdrawn)}>
							<X size={15} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
