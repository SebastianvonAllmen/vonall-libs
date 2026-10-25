# @vonall/shell

## 0.4.0

### Minor Changes

- [#37](https://github.com/SebastianvonAllmen/vonall-libs/pull/37) [`912cb28`](https://github.com/SebastianvonAllmen/vonall-libs/commit/912cb28296c3f5f6487cc8d9ce7926e52f81eed9) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - `AppShell` takes a Product's own mobile chrome: `mobileHeader` (snippet) replaces the whole mobile header, `tabBar`
  (snippet given `tabs` and the active tab's id) renders the tab bar's markup while the shell keeps choosing the tabs
  and the active one, and `mainClass` replaces the page container's padding and width. Without them nothing changes.

## 0.3.1

### Patch Changes

- [#28](https://github.com/SebastianvonAllmen/vonall-libs/pull/28) [`6cfdb00`](https://github.com/SebastianvonAllmen/vonall-libs/commit/6cfdb00c77ce21f162d7c296c4d3987bc471ee42) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - The sidebar no longer highlights the item whose href is a prefix of the More page (`moreItem`): on that page nothing is highlighted, as on every page without an entry of its own. `AppSideBar` takes `moreItem`; `activeSidebarId()` is exported.

## 0.3.0

### Minor Changes

- [#24](https://github.com/SebastianvonAllmen/vonall-libs/pull/24) [`a9189a5`](https://github.com/SebastianvonAllmen/vonall-libs/commit/a9189a5f83497d3d6da141cc26ff397e8fe89f1e) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - A Product's own chrome around the shell, every option additive: `NavItem.mobile?: boolean` (once one item has `mobile: true`, only those are mobile tabs; `mobile: false` keeps an item out) and `AppShell` prop `moreItem?: NavItem` (the last tab, active when the current page has no tab of its own; `mobileTabs(items, user, moreItem)` and `activeTab(items, tabs, path, moreItem)` are exported). `AppShell` snippets `brand` (the sidebar header), `mobileBrand` (left side of the mobile header), `headerActions` (right of the desktop header, and in the mobile header before the theme toggle and the avatar), `sidebarFooter` (above the account menu); props `themeToggle?: boolean` (false hides the light/dark toggle), `displayName?: (user) => string` (the sidebar header, the account menu and the avatar initials), `crumbFallback?: (segment) => string | undefined` (consulted before `humanize` for a segment without a label; `crumbs` takes it as its fourth argument). The sidebar highlights the current page's item; the sidebar, both headers and the tab bar carry `print:hidden`.

## 0.2.0

### Minor Changes

- [#16](https://github.com/SebastianvonAllmen/vonall-libs/pull/16) [`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d) Thanks [@SebastianvonAllmen](https://github.com/SebastianvonAllmen)! - One messages helper: `@vonall/messages` exports `defineMessages({ en, de })`, and every package's `configure…Messages({ locale })` takes the app's locale as is ("de-CH", "en-GB"), the language derived from it. In development, reading a package's strings before configuring them throws. The `Locale` type is gone. `@vonall/auth`: the near-duplicate keys `invalidEmailDot`, `passwordsDontMatchDot` and `passwordTooShortDot` are merged into `invalidEmail`, `passwordsMismatch` and `passwordTooShort`; `inviteIntro` takes the number of days.

### Patch Changes

- Updated dependencies [[`b2b45e6`](https://github.com/SebastianvonAllmen/vonall-libs/commit/b2b45e653396341b0023777d0d8de1ddee62f50d)]:
  - @vonall/messages@0.1.0

## 0.1.1

### Patch Changes

- The code review's fixes: `svelte-sonner`, `bits-ui`, `@lucide/svelte` and `mode-watcher` are peer dependencies (one copy per app, so toasts reach the Product's Toaster); the login page no longer echoes unknown `?error=` codes and clears the URL's reason on a new attempt; every path goes through the base path; the settings page stays where the Product mounted it; copying the backup codes reports a failure.

## 0.1.0

### Minor Changes

- The first release: `AppShell` (sidebar, breadcrumbs, mobile header and tabs, the account menu) with the Product's `NavItem` list, `activeNavItem`/`crumbLabel`/`crumbs`, `ModeToggle`; strings in English and German.
