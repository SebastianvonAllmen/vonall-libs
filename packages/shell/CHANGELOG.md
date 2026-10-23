# @vonall/shell

## 0.1.1

### Patch Changes

- The code review's fixes: `svelte-sonner`, `bits-ui`, `@lucide/svelte` and `mode-watcher` are peer dependencies (one copy per app, so toasts reach the Product's Toaster); the login page no longer echoes unknown `?error=` codes and clears the URL's reason on a new attempt; every path goes through the base path; the settings page stays where the Product mounted it; copying the backup codes reports a failure.

## 0.1.0

### Minor Changes

- The first release: `AppShell` (sidebar, breadcrumbs, mobile header and tabs, the account menu) with the Product's `NavItem` list, `activeNavItem`/`crumbLabel`/`crumbs`, `ModeToggle`; strings in English and German.
