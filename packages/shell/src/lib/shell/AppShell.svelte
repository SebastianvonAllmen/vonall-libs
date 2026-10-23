<script lang="ts" module>
	/** The logged-in user as the shell shows them (`locals.user` of `@vonall/auth`; `role` with the Admin option). */
	export type ShellUser = { name: string; email: string; image?: string | null; role?: string | null };
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import * as Breadcrumb from "#lib/components/ui/breadcrumb/index.js";
	import { Separator } from "#lib/components/ui/separator/index.js";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import { crumbs, type NavItem } from "#lib/nav.js";
	import AppSideBar from "./AppSideBar.svelte";
	import MobileBottomNav from "./MobileBottomNav.svelte";
	import MobileHeader from "./MobileHeader.svelte";

	/**
	 * The app behind login: the sidebar with the brand, the pages and the account menu on desktop, the header with the
	 * breadcrumbs; the header and the tab bar on mobile. A Product's `src/routes/home/+layout.svelte` renders it with its
	 * `nav.ts` and the user from `homeLayoutLoad`.
	 */
	let {
		user,
		appName,
		navItems,
		crumbLabels = {},
		signOut,
		children,
	}: {
		user: ShellUser;
		appName: string;
		/** The pages behind login, in order (the Product's `NAV_ITEMS`). */
		navItems: readonly NavItem[];
		/** Breadcrumb labels that differ from a page's name, or of path segments that are no page of their own. */
		crumbLabels?: Record<string, string>;
		/** Signs the user out and leaves for the login page (the Product's auth client). */
		signOut: () => Promise<void>;
		children?: Snippet;
	} = $props();

	const path = $derived(crumbs(navItems, crumbLabels, page.url.pathname));
</script>

<Sidebar.Provider>
	<!-- Desktop: the sidebar (hidden on mobile) -->
	<div class="hidden md:block">
		<AppSideBar {user} {appName} {navItems} {signOut} />
	</div>

	<Sidebar.Inset style="scrollbar-gutter: stable;" class="flex min-h-svh w-full flex-col">
		<!-- Desktop header with breadcrumbs: hidden on mobile -->
		<header class="hidden h-12 shrink-0 items-center px-4 transition-[width,height] ease-linear md:flex">
			<div class="flex items-center gap-2">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#each path as { href, label }, idx (href)}
							<Breadcrumb.Item>
								<Breadcrumb.Link {href}>{label}</Breadcrumb.Link>
							</Breadcrumb.Item>
							{#if idx < path.length - 1}
								<Breadcrumb.Separator />
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>

		<MobileHeader {user} {appName} />

		<!-- The page, rendered exactly once for both layouts -->
		<main class="w-full flex-grow px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:mx-auto md:max-w-7xl md:px-4 md:py-8">
			{@render children?.()}
		</main>

		<div class="md:hidden">
			<MobileBottomNav {user} {navItems} />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
