---
"@vonall/auth": minor
---

A Product's own look for two pages: `SettingsPage` takes `mobileMenu`, a snippet given
`{ user, memberSince, tabs, active, select }` that replaces the phone's settings navigation: the menu while `active` is
undefined, the bar back to it while a tab is open (`tabs` are the ones this user may see; `select(id)` opens one,
`select("")` returns to the menu), and `AdminView` takes
`class`, replacing the page's width and spacing (default centred, `max-w-3xl`). Without them nothing changes.
