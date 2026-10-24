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

`nav.ts` stays the Product's data: `NAV_ITEMS: NavItem[]` (`id`, `label`, `href`, `icon`, `admin?`, `sidebar?`,
`mobile?`) and `CRUMB_LABELS`; `activeNavItem`, `crumbLabel`, `crumbs`, `mobileTabs` and `activeTab` are here.

The mobile tab bar shows every page the user may see until one item has `mobile: true`: then only those are tabs
(`mobile: false` keeps an item out either way), and `moreItem` (a `NavItem`, say "More" → `/home/more`) is appended
as the last tab, active whenever the current page has no tab of its own. The sidebar highlights the current page.

A Product's own chrome goes through `AppShell`'s optional snippets and props; without them the shell looks as above:

| Option                             | Where it renders                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `brand` (snippet)                  | the sidebar header, instead of the app name, the user and their role                 |
| `mobileBrand` (snippet)            | the left side of the mobile header, instead of the app name linking home             |
| `headerActions` (snippet)          | the right of the desktop header; in the mobile header before the theme toggle/avatar |
| `sidebarFooter` (snippet)          | the sidebar footer, above the account menu                                            |
| `themeToggle` (default `true`)     | `false` hides the light/dark toggle in the mobile header and the account menu        |
| `displayName` (`(user) => string`) | how the sidebar header, account menu and avatar initials name the user (default: name, else email) |
| `crumbFallback` (`(seg) => string \| undefined`) | names a breadcrumb segment without a label before it is humanized (an id as "…") |

The sidebar, both headers and the tab bar carry `print:hidden`, so a printed page is only the page. Strings in English and German:
`configureShellMessages({ locale, overrides })`. The components ship their own copies of the shadcn-svelte sidebar,
breadcrumb, dropdown menu, avatar, separator, tooltip and button, styled by the Product's tokens; its `app.css` adds
`@source "../node_modules/@vonall/shell/dist"`. `mode-watcher` toggles light and dark; the Product's root layout keeps
its `<ModeWatcher>`.
