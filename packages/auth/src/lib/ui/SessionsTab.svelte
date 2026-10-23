<script lang="ts">
	import { Globe, LogOut, Monitor, Smartphone, Tablet, X } from "@lucide/svelte";
	import { page } from "$app/state";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/messages.js";
	import { getSessions, revokeOthers, revokeSessionById } from "#lib/remote/app_user.remote.js";
	import { authUi } from "#lib/ui/context.js";
	import { messageOf } from "#lib/util/messageOf.js";

	/** The devices the user is logged in on. Only mounted while open: listing them needs a login from the last day. */
	const { locale } = authUi();
	const sessions = $derived(await getSessions());
	const currentSessionId = $derived((page.data.session as { id?: string } | null | undefined)?.id);

	async function handleRevoke(sessionId: string) {
		try {
			await revokeSessionById({ sessionId });
			toast.success(m().sessionEnded);
		} catch (e) {
			toast.error(messageOf(e, m().sessionNotEnded));
		}
	}

	async function handleRevokeOthers() {
		try {
			await revokeOthers();
			toast.success(m().otherSessionsEnded);
		} catch (e) {
			toast.error(messageOf(e, m().otherSessionsNotEnded));
		}
	}

	function getDeviceIcon(session: { userAgent?: string | null }) {
		const ua = session.userAgent?.toLowerCase() || "";
		if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return Smartphone;
		if (ua.includes("tablet") || ua.includes("ipad")) return Tablet;
		return Monitor;
	}

	function formatLastActive(date: string | Date) {
		if (!date) return m().unknown;
		return new Date(date).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
	}
</script>

<Tabs.Content value="sessions" class="panel mt-6 p-6 md:p-8">
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold">{m().activeSessions}</h3>
				<p class="text-sm text-muted-foreground">{m().devicesLoggedIn}</p>
			</div>
			<Button variant="destructive" size="sm" onclick={handleRevokeOthers} class="flex cursor-pointer gap-2">
				<LogOut class="size-4" />
				{m().endAllOthers}
			</Button>
		</div>

		<div class="divide-y overflow-hidden rounded-lg border">
			{#if sessions.length === 0}
				<div class="p-8 text-center text-muted-foreground">{m().noActiveSessions}</div>
			{:else}
				{#each sessions as s (s.id)}
					{@const DeviceIcon = getDeviceIcon(s)}
					<div class="flex items-center justify-between bg-muted/10 p-4">
						<div class="flex items-center gap-4">
							<div class="rounded-full bg-muted p-2">
								<DeviceIcon class="size-5 text-muted-foreground" />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<!-- Sessions don't record browser and OS yet -->
									<span class="font-medium">{m().unknownBrowser}</span>
									{#if s.id === currentSessionId}
										<span class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase dark:bg-green-900/30 dark:text-green-400">{m().thisSession}</span>
									{/if}
								</div>
								<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
									<Globe class="size-3" />
									<span>{s.ipAddress || m().noIpAddress}</span>
								</div>
								<p class="mt-1 text-[11px] text-muted-foreground/80">{m().lastActive(formatLastActive(s.updatedAt || s.createdAt))}</p>
							</div>
						</div>

						{#if s.id !== currentSessionId}
							<Button variant="ghost" size="icon" class="cursor-pointer text-destructive hover:bg-destructive/10" onclick={() => handleRevoke(s.token)}>
								<X class="size-4" />
							</Button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</Tabs.Content>
