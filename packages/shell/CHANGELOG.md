# @vonall/shell

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
