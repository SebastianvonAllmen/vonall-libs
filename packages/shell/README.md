# @vonall/shell

The app shell behind login of a Web App Factory Product: on desktop the sidebar with the brand, the pages and the
account menu (settings, light or dark, log out) plus the header with the breadcrumbs; on mobile the header and the tab
bar. The pages come from the Product's `nav.ts`, the user from `@vonall/auth`'s `homeLayoutLoad`.

```svelte
<!-- src/routes/home/+layout.svelte -->
<script lang="ts">
	import { AppShell } from "@vonall/shell";
	import { authClient } from "#lib/auth-client.js";
	import { APP_NAME } from "#lib/config.js";
	import { CRUMB_LABELS, NAV_ITEMS } from "#lib/nav.js";
	let { data, children } = $props();
	const signOut = async () => { await authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/auth/login"; } } }); };
</script>

<AppShell user={data.user} appName={APP_NAME} navItems={NAV_ITEMS} crumbLabels={CRUMB_LABELS} {signOut}>
	{@render children?.()}
</AppShell>
```

`nav.ts` stays the Product's data: `NAV_ITEMS: NavItem[]` (`id`, `label`, `href`, `icon`, `admin?`, `sidebar?`) and
`CRUMB_LABELS`; `activeNavItem`, `crumbLabel` and `crumbs` are here. Strings in English and German:
`configureShellMessages({ locale, overrides })`. The components ship their own copies of the shadcn-svelte sidebar,
breadcrumb, dropdown menu, avatar, separator, tooltip and button, styled by the Product's tokens; its `app.css` adds
`@source "../node_modules/@vonall/shell/dist"`. `mode-watcher` toggles light and dark; the Product's root layout keeps
its `<ModeWatcher>`.
