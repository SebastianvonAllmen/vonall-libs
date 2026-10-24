# @vonall/shell

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
