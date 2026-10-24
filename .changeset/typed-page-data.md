---
"@vonall/auth": minor
"@vonall/mcp": minor
---

`@vonall/auth`: a Product's own columns on `user` (`authSchema({ user: { phone: text("phone") } })` with `createAuth({ userFields })`); `userRepo(ctx)` selects every column. One typed `AuthPageData` between the loads and the components, read through `authPageData(...keys)` (throws naming the load when a key is missing); `signupLoad` no longer returns `mode`; `EinladungPage` takes `einladungLoad`'s data. `SettingsPage` takes a `profile` snippet below name and email; `SettingsTabDef.deletionNote` lets a tab add its sentence to the deletion tab (`DeletionTab` takes `notes`, no `agents`); the `deletionAgents` message moved to `@vonall/mcp`, whose `agentsTab()` carries it.
